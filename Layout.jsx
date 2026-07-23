import { useEffect, useState } from "react";
import { rdvStatus } from "../lib/format";

export const Spinner = () => <div className="spinner" aria-label="Chargement" />;
export const Loading = () => <div className="loading"><Spinner /></div>;

export function Empty({ icon = "◇", title, children }) {
  return (
    <div className="empty">
      <div className="ic">{icon}</div>
      <h4>{title}</h4>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function Field({ label, required, children, hint }) {
  return (
    <div className="field">
      {label && <label>{label} {required && <span className="req">*</span>}</label>}
      {children}
      {hint && <span className="faint" style={{ fontSize: 11.5 }}>{hint}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ title = "Confirmer", message, confirmLabel = "Confirmer", danger, onConfirm, onClose, busy }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Annuler</button>
          <button className={`btn ${danger ? "danger" : "primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "…" : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.55 }}>{message}</p>
    </Modal>
  );
}

// Statut de relance (dernier RDV) — pastille colorée calculée à la volée.
export function RdvPill({ date }) {
  const s = rdvStatus(date);
  const label = s.level === "none" ? "Aucun RDV" : s.label;
  return (
    <span className={`pill ${s.level}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

export function CategoryBadge({ category }) {
  if (!category) return <span className="faint">—</span>;
  return (
    <span className="badge">
      <span className="cat-dot" style={{ background: category.color || "#C9A24B" }} />
      {category.label}
    </span>
  );
}

export function Logo({ url, name, lg }) {
  const [broken, setBroken] = useState(false);
  const letter = (name || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div className={`logo ${lg ? "lg" : ""}`}>
      {url && !broken
        ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setBroken(true)} />
        : letter}
    </div>
  );
}

export function Avatar({ name }) {
  const i = (name || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <div className="avatar">{i || "?"}</div>;
}

// Petite section titrée réutilisable dans les fiches.
export function Section({ title, action, children }) {
  return (
    <div className="card pad">
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 16, margin: 0 }}>{title}</h3>
        <div className="grow" />
        {action}
      </div>
      {children}
    </div>
  );
}
