import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { Loading, Empty, Modal, Field } from "../components/ui";

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export default function Settings() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("company_categories").select("*").order("position");
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit.label?.trim()) return toast.err("Le libellé est requis.");
    setBusy(true);
    const payload = { label: edit.label.trim(), color: edit.color, is_active: edit.is_active ?? true };
    let err;
    if (edit.id) ({ error: err } = await supabase.from("company_categories").update(payload).eq("id", edit.id));
    else ({ error: err } = await supabase.from("company_categories")
      .insert({ ...payload, slug: slugify(edit.label), position: rows.length + 1 }));
    if (err) { toast.err(err.message); setBusy(false); return; }
    await logAudit({ action: edit.id ? "update" : "create", entity_type: "category", summary: `Catégorie « ${payload.label} » ${edit.id ? "modifiée" : "créée"}` });
    toast.ok("Enregistré."); setEdit(null); setBusy(false); load();
  };

  const toggle = async (c) => {
    await supabase.from("company_categories").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  if (loading) return <Loading />;
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <h2>Catégories d'entreprises</h2>
        <div className="grow" />
        <button className="btn primary" onClick={() => setEdit({ label: "", color: "#C9A24B", is_active: true })}>+ Nouvelle catégorie</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {rows.length === 0 ? <Empty icon="⚙" title="Aucune catégorie" /> : (
          <table className="table">
            <thead><tr><th>Catégorie</th><th>Identifiant</th><th>État</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ cursor: "default" }}>
                  <td><div className="row"><span className="cat-dot" style={{ background: c.color }} /><span style={{ fontWeight: 600 }}>{c.label}</span></div></td>
                  <td className="mono faint">{c.slug}</td>
                  <td>{c.is_active ? <span className="pill ok"><span className="dot" />Active</span> : <span className="pill none"><span className="dot" />Désactivée</span>}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn ghost sm" onClick={() => setEdit(c)}>Modifier</button>
                      <button className="btn ghost sm" onClick={() => toggle(c)}>{c.is_active ? "Désactiver" : "Activer"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card pad">
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 15, margin: "0 0 6px" }}>Seuils de relance</h3>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Suivi à jour sous 3 semaines (vert), orange dès 3 semaines, rouge dès 1 mois sans rendez-vous.
          Ces seuils sont définis dans <span className="mono">src/lib/constants.js</span> (RDV_WARN_DAYS, RDV_LATE_DAYS).
        </p>
      </div>

      {edit && (
        <Modal title={edit.id ? "Modifier la catégorie" : "Nouvelle catégorie"} onClose={() => setEdit(null)}
          footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Libellé" required><input value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} /></Field>
            <Field label="Couleur">
              <div className="row">
                <input type="color" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} style={{ width: 54, padding: 4, height: 40 }} />
                <input className="mono" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
              </div>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
