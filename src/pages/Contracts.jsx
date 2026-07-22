import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { fmtDate } from "../lib/format";
import { CONTRACT_STATUS, contractStatusMeta } from "../lib/constants";
import { openDoc, uploadDoc } from "../lib/storage";
import { Loading, Empty, Modal, Field } from "../components/ui";

export default function Contracts() {
  const toast = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ company_id: "", name: "", category: "", status: "brouillon", start_date: "", end_date: "", notes: "" });
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
      (status === "all" || r.status === status) &&
      (!term || r.name.toLowerCase().includes(term) || (r.companies?.name || "").toLowerCase().includes(term)));
  }, [rows, q, status]);

  const save = async () => {
    if (!f.company_id) return toast.err("Sélectionnez une entreprise.");
    if (!f.name.trim()) return toast.err("Le nom du contrat est requis.");
    setBusy(true);
    try {
      let file_path = null;
      if (file) { const up = await uploadDoc(f.company_id, "contrats", file); file_path = up.path; }
      const { data, error } = await supabase.from("contracts").insert({
        company_id: f.company_id, name: f.name.trim(), category: f.category || null, status: f.status,
        start_date: f.start_date || null, end_date: f.end_date || null, notes: f.notes || null, file_path,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "contract", entity_id: data.id, company_id: f.company_id, summary: `Contrat « ${f.name} » ajouté` });
      toast.ok("Contrat ajouté."); setOpen(false); setFile(null);
      setF({ company_id: "", name: "", category: "", status: "brouillon", start_date: "", end_date: "", notes: "" }); load();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher contrat ou entreprise…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Tous statuts</option>
          {CONTRACT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="grow" />
        <button className="btn primary" onClick={() => setOpen(true)}>+ Ajouter un contrat</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? <Empty icon="✎" title="Aucun contrat" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Entreprise</th><th>Contrat</th><th>Statut</th><th>Début</th><th>Fin</th><th></th></tr></thead>
              <tbody>
                {filtered.map((c) => { const m = contractStatusMeta(c.status); return (
                  <tr key={c.id} onClick={() => nav(`/entreprises/${c.company_id}`)}>
                    <td className="gold" style={{ fontWeight: 600 }}>{c.companies?.name}</td>
                    <td>{c.name}</td>
                    <td><span className={`pill ${m.tone}`}>{m.label}</span></td>
                    <td className="num">{fmtDate(c.start_date)}</td>
                    <td className="num">{fmtDate(c.end_date)}</td>
                    <td onClick={(e) => { e.stopPropagation(); c.file_path ? openDoc(c.file_path) : c.external_url && window.open(c.external_url, "_blank"); }}>
                      {c.file_path ? "📄" : c.external_url ? "⇗" : ""}
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal title="Ajouter un contrat" onClose={() => setOpen(false)}
          footer={<><button className="btn ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Entreprise" required>
              <select value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nom du contrat" required><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <div className="grid g-2">
              <Field label="Catégorie"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
              <Field label="Statut">
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                  {CONTRACT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid g-2">
              <Field label="Date de début"><input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
              <Field label="Date de fin"><input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
            </div>
            <Field label="Fichier"><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
            <Field label="Notes"><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
