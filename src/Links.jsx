import { supabase } from "./supabase";

// Écrit une entrée dans l'historique. actor_id est renseigné par défaut
// côté base (auth.uid()) et vérrouillé par la RLS : l'entrée devient
// non modifiable après insertion.
export async function logAudit({
  action,
  entity_type,
  entity_id = null,
  company_id = null,
  field = null,
  old_value = null,
  new_value = null,
  summary = null,
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: user?.id,
    action,
    entity_type,
    entity_id,
    company_id,
    field,
    old_value: old_value == null ? null : String(old_value).slice(0, 1000),
    new_value: new_value == null ? null : String(new_value).slice(0, 1000),
    summary,
  });
  // L'audit ne doit jamais bloquer l'action métier ; on trace en console.
  if (error) console.warn("audit:", error.message);
}
