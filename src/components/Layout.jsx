import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NAV } from "../lib/constants";
import { Avatar } from "./ui";
import GlobalSearch from "./GlobalSearch";

const TITLES = {
  "/": ["Tableau de bord", "Vue d'ensemble du Pôle Entreprise"],
  "/entreprises": ["Entreprises", "Annuaire et fiches des entreprises"],
  "/factures": ["Factures", "Factures transmises par les entreprises"],
  "/contrats": ["Contrats", "Conventions et contrats des entreprises"],
  "/liens": ["Liens GDocs", "Documents et espaces de travail partagés"],
  "/templates": ["Messages types", "Modèles réutilisables du Pôle"],
  "/mon-espace": ["Mon espace", "Votre activité récente"],
  "/historique": ["Historique", "Journal des actions"],
  "/utilisateurs": ["Utilisateurs", "Gestion des comptes"],
  "/parametres": ["Paramètres", "Catégories et configuration"],
};

export default function Layout({ children }) {
  const { displayName, role, isResponsable, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const base = "/" + (loc.pathname.split("/")[1] || "");
  const [title, sub] = TITLES[loc.pathname] || TITLES[base] || ["Pôle Entreprise", ""];

  const items = NAV.filter((n) => !n.admin || isResponsable);

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="seal">SA</div>
          <div className="brand-txt">
            <b>Pôle Entreprise</b>
            <span>Mairie · San Andréas</span>
          </div>
        </div>

        <nav className="nav" onClick={() => setOpen(false)}>
          {items.map((n, i) => (
            <div key={n.to}>
              {n.admin && (items[i - 1] && !items[i - 1].admin) && <div className="nav-sep" />}
              <NavLink to={n.to} end={n.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
                <span className="ic">{n.icon}</span>
                {n.label}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="who">
            <Avatar name={displayName} />
            <div style={{ minWidth: 0 }}>
              <div className="role">{role?.label || "Utilisateur"}</div>
              <small style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </small>
            </div>
          </div>
          <button className="btn ghost sm" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn icon ghost menu-btn" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <div>
            <h1>{title}</h1>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <div className="grow" />
          <GlobalSearch />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
