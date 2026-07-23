import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { fmtDate } from "../lib/format";
import { openDoc, uploadDoc } from "../lib/storage";
import { Loading, Empty, Modal, Field } from "../components/ui";

// Page « Taxe d'exploitation » — réutilise la table contracts.
export default function Contracts() {
  const toast = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ company_id: "", is_active: true, start_date: "", notes: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [con, c] = await Promise.all([
      supabase.from("contracts").select("*, companies(name)").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").eq("is_active", true).order("name"),
    ]);
    setRows(con.data ?? []); setCompanies(c.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) =>
      (status === "all" || (status === "active" ? r.is_active : !r.is_active)) &&
      (!term || (r.companies?.name || "").toLowerCase().includes(term) || (r.notes || "").toLowerCase().includes(term)));
  }, [rows, q, status]);

  const save = async () => {
    if (!f.company_id) return toast.err("Sélectionnez une entreprise.");
    setBusy(true);
    try {
      let file_path = null;
      if (file) { const up = await uploadDoc(f.company_id, "taxes", file); file_path = up.path; }
      const label = `Taxe d'exploitation${f.start_date ? " — " + f.start_date : ""}`;
      const { data, error } = await supabase.from("contracts").insert({
        company_id: f.company_id, name: label, is_active: f.is_active,
        start_date: f.start_date || null, notes: f.notes || null, file_path,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "taxe", entity_id: data.id, company_id: f.company_id, summary: `Taxe d'exploitation ajoutée` });
      toast.ok("Taxe ajoutée."); setOpen(false); setFile(null);
      setF({ company_id: "", is_active: true, start_date: "", notes: "" }); load();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher une entreprise ou une note…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <div className="grow" />
        <button className="btn primary" onClick={() => setOpen(true)}>+ Ajouter une taxe d'exploitation</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? <Empty icon="€" title="Aucune taxe d'exploitation" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Entreprise</th><th>Statut</th><th>Date de création</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => nav(`/entreprises/${c.company_id}`)}>
                    <td className="gold" style={{ fontWeight: 600 }}>{c.companies?.name}</td>
                    <td><span className={`pill ${c.is_active ? "ok" : "none"}`}><span className="dot" />{c.is_active ? "Actif" : "Inactif"}</span></td>
                    <td className="num">{fmtDate(c.start_date)}</td>
                    <td className="muted" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.notes || "—"}</td>
                    <td onClick={(e) => { e.stopPropagation(); c.file_path ? openDoc(c.file_path) : c.external_url && window.open(c.external_url, "_blank"); }}>
                      {c.file_path ? "📄" : c.external_url ? "⇗" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal title="Ajouter une taxe d'exploitation" onClose={() => setOpen(false)}
          footer={<><button className="btn ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Entreprise" required>
              <select value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid g-2">
              <Field label="Statut">
                <select value={f.is_active ? "1" : "0"} onChange={(e) => setF({ ...f, is_active: e.target.value === "1" })}>
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </select>
              </Field>
              <Field label="Date de création"><input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
            </div>
            <Field label="Fichier"><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
            <Field label="Note"><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
