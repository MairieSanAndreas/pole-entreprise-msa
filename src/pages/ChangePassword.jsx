import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";

export default function ChangePassword({ forced }) {
  const { refreshProfile, signOut } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("8 caractères minimum.");
    if (pw !== pw2) return setErr("Les deux mots de passe ne correspondent pas.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setBusy(false); return; }
    await supabase.rpc("mark_password_changed");
    await refreshProfile();
    toast.ok("Mot de passe mis à jour.");
    if (!forced) nav("/");
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="seal">SA</div>
        <h1>{forced ? "Choisissez un mot de passe" : "Modifier le mot de passe"}</h1>
        <p className="sub">
          {forced ? "Première connexion : définissez votre mot de passe personnel." : "Sécurisez votre accès au Pôle."}
        </p>

        {err && <div className="err-box" style={{ marginBottom: 14 }}>{err}</div>}

        <div className="stack">
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="field">
            <label>Confirmer</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn primary" style={{ justifyContent: "center", marginTop: 4 }} disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
          {forced && (
            <button type="button" className="btn ghost sm" style={{ justifyContent: "center" }} onClick={signOut}>
              Se déconnecter
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
