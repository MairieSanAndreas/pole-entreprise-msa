import { supabase } from "./supabase";

export const ASSETS = "company-assets"; // public
export const DOCS = "documents";        // privé

// URL publique d'un logo (bucket public).
// Logo d'une entreprise : lien externe en priorité, sinon fichier Storage.
export function companyLogo(company) {
  if (!company) return null;
  if (company.logo_url) return company.logo_url;
  return logoUrl(company.logo_path);
}

export function logoUrl(path) {
  if (!path) return null;
  return supabase.storage.from(ASSETS).getPublicUrl(path).data.publicUrl;
}

// URL signée temporaire pour un document privé (RIB, facture, contrat…).
export async function signedUrl(path, seconds = 120) {
  if (!path) return null;
  const { data } = await supabase.storage.from(DOCS).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

// Ouvre un document privé dans un nouvel onglet.
export async function openDoc(path) {
  const url = await signedUrl(path);
  if (url) window.open(url, "_blank");
}

// Upload d'un logo ; renvoie le chemin de stockage.
export async function uploadLogo(companyId, file) {
  const ext = file.name.split(".").pop();
  const path = `${companyId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(ASSETS).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

// Upload d'un document privé sous {companyId}/{type}/...
export async function uploadDoc(companyId, type, file) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${companyId}/${type}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(DOCS).upload(path, file);
  if (error) throw error;
  return { path, mime: file.type, size: file.size, name: file.name };
}
