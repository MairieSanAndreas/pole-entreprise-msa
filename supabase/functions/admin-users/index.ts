// =====================================================================
// Edge Function : admin-users
// ---------------------------------------------------------------------
// Opérations administratives sur les comptes (création, réinit. mot de
// passe, activation/désactivation, suppression). Utilise la clé
// service_role UNIQUEMENT côté serveur — jamais exposée au navigateur.
// Chaque appel est vérifié : seul un profil « responsable » actif peut agir.
//
// Déploiement :  supabase functions deploy admin-users
// Secrets requis (déjà fournis par Supabase) : SUPABASE_URL,
//   SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Authentification requise." }, 401);

    // Client « appelant » : sert à identifier qui fait la demande.
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await caller.auth.getUser();
    if (userErr || !user) return json({ error: "Session invalide." }, 401);

    // Client admin : service_role, contourne la RLS pour les opérations admin.
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérification du rôle : la personne doit être responsable ET active.
    const { data: profile } = await admin
      .from("profiles")
      .select("is_active, roles:role_id(slug, can_manage_users)")
      .eq("id", user.id)
      .single();

    const role = (profile as any)?.roles;
    if (!profile?.is_active || !role?.can_manage_users) {
      return json({ error: "Accès réservé à la responsable du Pôle." }, 403);
    }

    const { action, payload } = await req.json();

    switch (action) {
      // ---- Créer un compte -------------------------------------------
      case "create": {
        const { email, password, first_name, last_name, role_slug } = payload;
        if (!email || !password) {
          return json({ error: "Email et mot de passe requis." }, 400);
        }
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { first_name, last_name },
        });
        if (cErr) return json({ error: cErr.message }, 400);

        const { data: roleRow } = await admin
          .from("roles").select("id").eq("slug", role_slug ?? "secretaire").single();

        const { error: pErr } = await admin.from("profiles").upsert({
          id: created.user.id,
          first_name,
          last_name,
          display_name: [first_name, last_name].filter(Boolean).join(" "),
          email,
          role_id: roleRow?.id,
          is_active: true,
          must_change_password: true,
          created_by: user.id,
        });
        if (pErr) return json({ error: pErr.message }, 400);

        await admin.from("audit_logs").insert({
          actor_id: user.id, action: "create", entity_type: "user",
          entity_id: created.user.id,
          summary: `Création du compte ${email}`,
        });
        return json({ ok: true, id: created.user.id });
      }

      // ---- Réinitialiser le mot de passe (temporaire) ----------------
      case "reset_password": {
        const { user_id, password } = payload;
        if (!user_id || !password) return json({ error: "Paramètres manquants." }, 400);
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) return json({ error: error.message }, 400);
        await admin.from("profiles").update({ must_change_password: true }).eq("id", user_id);
        await admin.from("audit_logs").insert({
          actor_id: user.id, action: "update", entity_type: "user",
          entity_id: user_id, summary: "Réinitialisation du mot de passe",
        });
        return json({ ok: true });
      }

      // ---- Activer / désactiver --------------------------------------
      case "set_active": {
        const { user_id, is_active } = payload;
        const { error } = await admin.from("profiles")
          .update({ is_active }).eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.from("audit_logs").insert({
          actor_id: user.id, action: is_active ? "activate" : "deactivate",
          entity_type: "user", entity_id: user_id,
          summary: `${is_active ? "Activation" : "Désactivation"} d'un compte`,
        });
        return json({ ok: true });
      }

      // ---- Mettre à jour le profil / rôle ----------------------------
      case "update": {
        const { user_id, first_name, last_name, role_slug } = payload;
        const patch: Record<string, unknown> = {};
        if (first_name !== undefined) patch.first_name = first_name;
        if (last_name !== undefined) patch.last_name = last_name;
        if (first_name !== undefined || last_name !== undefined)
          patch.display_name = [first_name, last_name].filter(Boolean).join(" ");
        if (role_slug) {
          const { data: roleRow } = await admin
            .from("roles").select("id").eq("slug", role_slug).single();
          patch.role_id = roleRow?.id;
        }
        const { error } = await admin.from("profiles").update(patch).eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.from("audit_logs").insert({
          actor_id: user.id, action: "update", entity_type: "user",
          entity_id: user_id, summary: "Modification d'un compte",
        });
        return json({ ok: true });
      }

      // ---- Supprimer définitivement ----------------------------------
      case "delete": {
        const { user_id } = payload;
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) return json({ error: error.message }, 400);
        await admin.from("audit_logs").insert({
          actor_id: user.id, action: "delete", entity_type: "user",
          entity_id: user_id, summary: "Suppression d'un compte",
        });
        return json({ ok: true });
      }

      default:
        return json({ error: "Action inconnue." }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Erreur serveur." }, 500);
  }
});
