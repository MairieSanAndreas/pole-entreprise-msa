import { RDV_WARN_DAYS, RDV_LATE_DAYS } from "./constants";

// ---------- Dates ---------------------------------------------------------

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

export const daysSince = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / 86400000);
};

// ---------- Statut de relance (dernier RDV) -------------------------------
// Renvoie le niveau visuel + un libellé humain, calculé sur la date du jour.

export function rdvStatus(lastMeetingAt) {
  const d = daysSince(lastMeetingAt);
  if (d === null) return { level: "none", label: "Aucun RDV", days: null };
  if (d >= RDV_LATE_DAYS) return { level: "late", label: `Il y a ${d} j`, days: d };
  if (d >= RDV_WARN_DAYS) return { level: "warn", label: `Il y a ${d} j`, days: d };
  return { level: "ok", label: `Il y a ${d} j`, days: d };
}

// ---------- Storage -------------------------------------------------------

export const money = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(n);

export const initials = (name = "") =>
  name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

// ---------- Variables de template -----------------------------------------
// Remplace {entreprise}, {patron}, {date}, {secretaire} dans un message.

export function fillTemplate(content, ctx = {}) {
  const map = {
    entreprise: ctx.entreprise ?? "",
    patron: ctx.patron ?? "",
    date: ctx.date ?? new Date().toLocaleDateString("fr-FR"),
    secretaire: ctx.secretaire ?? "",
  };
  return (content || "").replace(/\{(entreprise|patron|date|secretaire)\}/g, (_, k) => map[k]);
}
