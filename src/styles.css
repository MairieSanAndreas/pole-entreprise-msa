import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setErr("Identifiants incorrects ou compte introuvable.");
      setBusy(false);
      return;
    }
    // Trace la dernière connexion (fonction SECURITY DEFINER).
    await supabase.rpc("touch_last_login");
    // La redirection est gérée par le routeur une fois la session chargée.
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="seal">SA</div>
        <h1>Pôle Entreprise</h1>
        <p className="sub">Mairie de San Andréas — accès réservé</p>

        {err && <div className="err-box" style={{ marginBottom: 14 }}>{err}</div>}

        <div className="stack">
          <div className="field">
            <label>Adresse de connexion</label>
            <input type="email" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@mairie-sa.fr" required />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn primary" style={{ justifyContent: "center", marginTop: 4 }} disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </div>
      </form>
    </div>
  );
}
