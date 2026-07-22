import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { fmtDateTime } from "../lib/format";
import { Loading, Empty, Modal, Field, Confirm, Avatar } from "../components/ui";

// Appel de l'Edge Function admin-users. Le jeton d'accès de la session
// est attaché automatiquement par supabase.functions.invoke.
async function admin(action, payload) {
  const { data, error } = await supabase.functions.invoke("admin-users", { body: { action, payload } });
  if (error) {
    // Récupère le message renvoyé par la fonction si disponible.
    let msg = error.message;
    try { const ctx = await error.context?.json(); if (ctx?.error) msg = ctx.error; } catch {}
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function Users() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [create, setCreate] = useState(null);
  const [edit, setEdit] = useState(null);
  const [reset, setReset] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("profiles")
      .select("*, roles:role_id(slug, label)").order("created_at", { ascending: false });
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const doCreate = async () => {
    if (!create.email?.trim() || !create.password) return toast.err("Email et mot de passe requis.");
    setBusy(true);
    try {
      await admin("create", {
        email: create.email.trim(), password: create.password,
        first_name: create.first_name, last_name: create.last_name, role_slug: create.role_slug,
      });
      toast.ok("Compte créé."); setCreate(null); load();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  const doEdit = async () => {
    setBusy(true);
    try {
      await admin("update", { user_id: edit.id, first_name: edit.first_name, last_name: edit.last_name, role_slug: edit.roles?.slug });
      toast.ok("Compte mis à jour."); setEdit(null); load();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  const doReset = async () => {
    if (!reset.password || reset.password.length < 8) return toast.err("8 caractères minimum.");
    setBusy(true);
    try {
      await admin("reset_password", { user_id: reset.id, password: reset.password });
      toast.ok("Mot de passe réinitialisé."); setReset(null);
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  const toggleActive = async (u) => {
    try { await admin("set_active", { user_id: u.id, is_active: !u.is_active }); toast.ok(u.is_active ? "Compte désactivé." : "Compte activé."); load(); }
    catch (e) { toast.err(e.message); }
  };

  const doDelete = async () => {
    setBusy(true);
    try { await admin("delete", { user_id: confirm.id }); toast.ok("Compte supprimé."); setConfirm(null); load(); }
    catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <h2>Comptes utilisateurs</h2>
        <div className="grow" />
        <button className="btn primary" onClick={() => setCreate({ role_slug: "secretaire", first_name: "", last_name: "", email: "", password: "" })}>+ Créer un compte</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {rows.length === 0 ? <Empty icon="◉" title="Aucun compte" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Utilisateur</th><th>Rôle</th><th>État</th><th>Dernière connexion</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} style={{ cursor: "default" }}>
                    <td>
                      <div className="row">
                        <Avatar name={u.display_name} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.display_name || "—"}</div>
                          <div className="faint" style={{ fontSize: 12 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge">{u.roles?.label || "—"}</span></td>
                    <td>{u.is_active ? <span className="pill ok"><span className="dot" />Actif</span> : <span className="pill none"><span className="dot" />Inactif</span>}</td>
                    <td className="num muted">{u.last_login_at ? fmtDateTime(u.last_login_at) : "Jamais"}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn ghost sm" onClick={() => setEdit(u)}>Modifier</button>
                        <button className="btn ghost sm" onClick={() => setReset({ id: u.id, name: u.display_name, password: "" })}>Réinit.</button>
                        <button className="btn ghost sm" onClick={() => toggleActive(u)}>{u.is_active ? "Désactiver" : "Activer"}</button>
                        <button className="btn ghost sm" style={{ color: "var(--red-2)" }} onClick={() => setConfirm(u)}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {create && (
        <Modal title="Créer un compte" onClose={() => setCreate(null)}
          footer={<><button className="btn ghost" onClick={() => setCreate(null)}>Annuler</button><button className="btn primary" onClick={doCreate} disabled={busy}>Créer</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <Field label="Prénom"><input value={create.first_name} onChange={(e) => setCreate({ ...create, first_name: e.target.value })} /></Field>
              <Field label="Nom"><input value={create.last_name} onChange={(e) => setCreate({ ...create, last_name: e.target.value })} /></Field>
            </div>
            <Field label="Adresse de connexion" required><input type="email" value={create.email} onChange={(e) => setCreate({ ...create, email: e.target.value })} /></Field>
            <Field label="Mot de passe temporaire" required hint="L'utilisateur devra le changer à la première connexion.">
              <input value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} />
            </Field>
            <Field label="Rôle">
              <select value={create.role_slug} onChange={(e) => setCreate({ ...create, role_slug: e.target.value })}>
                <option value="secretaire">Secrétaire</option>
                <option value="responsable">Responsable du Pôle</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {edit && (
        <Modal title="Modifier le compte" onClose={() => setEdit(null)}
          footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Annuler</button><button className="btn primary" onClick={doEdit} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <Field label="Prénom"><input value={edit.first_name || ""} onChange={(e) => setEdit({ ...edit, first_name: e.target.value })} /></Field>
              <Field label="Nom"><input value={edit.last_name || ""} onChange={(e) => setEdit({ ...edit, last_name: e.target.value })} /></Field>
            </div>
            <Field label="Rôle">
              <select value={edit.roles?.slug || "secretaire"} onChange={(e) => setEdit({ ...edit, roles: { ...edit.roles, slug: e.target.value } })}>
                <option value="secretaire">Secrétaire</option>
                <option value="responsable">Responsable du Pôle</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {reset && (
        <Modal title="Réinitialiser le mot de passe" onClose={() => setReset(null)}
          footer={<><button className="btn ghost" onClick={() => setReset(null)}>Annuler</button><button className="btn primary" onClick={doReset} disabled={busy}>Réinitialiser</button></>}>
          <Field label={`Nouveau mot de passe temporaire — ${reset.name || ""}`} hint="L'utilisateur devra le changer à sa prochaine connexion.">
            <input value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
          </Field>
        </Modal>
      )}

      {confirm && <Confirm title="Supprimer le compte" danger message={`Supprimer définitivement le compte de ${confirm.display_name || confirm.email} ?`} confirmLabel="Supprimer" onConfirm={doDelete} onClose={() => setConfirm(null)} busy={busy} />}
    </div>
  );
}
