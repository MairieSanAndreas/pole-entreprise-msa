// Libellés et référentiels partagés dans toute l'application.

export const NOTE_TYPES = [
  { value: "compte_rendu",     label: "Compte rendu de RDV", icon: "📋" },
  { value: "appel",            label: "Appel téléphonique",  icon: "📞" },
  { value: "demande_document", label: "Demande de document", icon: "📄" },
  { value: "relance",          label: "Relance",             icon: "🔔" },
  { value: "probleme",         label: "Problème signalé",    icon: "⚠️" },
  { value: "info",             label: "Information générale", icon: "💬" },
];

export const noteTypeLabel = (v) =>
  NOTE_TYPES.find((t) => t.value === v)?.label ?? v;

export const COMPANY_STATUS = [
  { value: "prospect",   label: "Prospect" },
  { value: "actif",      label: "Actif" },
  { value: "partenaire", label: "Partenaire" },
  { value: "inactif",    label: "Inactif" },
  { value: "archive",    label: "Archivé" },
];

export const CONTRACT_STATUS = [
  { value: "brouillon",  label: "Brouillon",  tone: "neutral" },
  { value: "en_attente", label: "En attente", tone: "warn" },
  { value: "actif",      label: "Actif",      tone: "ok" },
  { value: "termine",    label: "Terminé",    tone: "neutral" },
  { value: "resilie",    label: "Résilié",    tone: "danger" },
  { value: "archive",    label: "Archivé",    tone: "neutral" },
];

export const contractStatusMeta = (v) =>
  CONTRACT_STATUS.find((s) => s.value === v) ?? { label: v, tone: "neutral" };

// Seuils de relance (en jours) pour le suivi du dernier rendez-vous.
export const RDV_WARN_DAYS = 21; // 3 semaines -> orange
export const RDV_LATE_DAYS = 30; // 1 mois     -> rouge

// Navigation principale. `admin: true` => réservé à la responsable.
export const NAV = [
  { to: "/",            label: "Tableau de bord", icon: "◆" },
  { to: "/entreprises", label: "Entreprises",     icon: "▣" },
  { to: "/factures",    label: "Factures",        icon: "€" },
  { to: "/contrats",    label: "Contrats",        icon: "✎" },
  { to: "/liens",       label: "Liens GDocs",     icon: "⇗" },
  { to: "/templates",   label: "Messages types",  icon: "❝" },
  { to: "/mon-espace",  label: "Mon espace",      icon: "☰" },
  { to: "/historique",  label: "Historique",      icon: "↺" },
  { to: "/utilisateurs",label: "Utilisateurs",    icon: "◉", admin: true },
  { to: "/parametres",  label: "Paramètres",      icon: "⚙", admin: true },
];
