import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { fmtDate, money } from "../lib/format";
import { openDoc, uploadDoc } from "../lib/storage";
import { Loading, Empty, Modal, Field } from "../components/ui";

export default function Invoices() {
  const toast = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ company_id: "", number: "", category: "", amount: "", invoice_date: "", comment: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [inv, c] = await Promise.all([
      supabase.from("invoices").select("*, companies(name)").order("received_at", { ascending: false }),
      supabase.from("companies").select("id, name").eq("is_active", true).order("name"),
    ]);
    setRows(inv.data ?? []); setCompanies(c.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.category === cat) &&
      (!term || r.number.toLowerCase().includes(term) || (r.companies?.name || "").toLowerCase().includes(term)));
  }, [rows, q, cat]);

  const save = async () => {
    if (!f.company_id) return toast.err("Sélectionnez une entreprise.");
    if (!f.number.trim()) return toast.err("Un nom ou numéro est requis.");
    setBusy(true);
    try {
      let file_path = null;
      if (file) { const up = await uploadDoc(f.company_id, "factures", file); file_path = up.path; }
      const { data, error } = await supabase.from("invoices").insert({
        company_id: f.company_id, number: f.number.trim(), category: f.category || null,
        amount: f.amount ? Number(f.amount) : null, invoice_date: f.invoice_date || null,
        comment: f.comment || null, file_path,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "invoice", entity_id: data.id, company_id: f.company_id, summary: `Facture « ${f.number} » ajoutée` });
      toast.ok("Facture ajoutée."); setOpen(false); setFile(null);
      setF({ company_id: "", number: "", category: "", amount: "", invoice_date: "", comment: "" }); load();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher entreprise ou numéro…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Toutes catégories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grow" />
        <button className="btn primary" onClick={() => setOpen(true)}>+ Ajouter une facture</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? <Empty icon="€" title="Aucune facture" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Entreprise</th><th>Facture</th><th>Catégorie</th><th>Montant</th><th>Date</th><th>Reçue</th><th></th></tr></thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} onClick={() => nav(`/entreprises/${i.company_id}`)}>
                    <td style={{ fontWeight: 600 }} className="gold">{i.companies?.name}</td>
                    <td>{i.number}</td>
                    <td>{i.category || <span className="faint">—</span>}</td>
                    <td className="num">{money(i.amount)}</td>
                    <td className="num">{fmtDate(i.invoice_date)}</td>
                    <td className="num">{fmtDate(i.received_at)}</td>
                    <td onClick={(e) => { e.stopPropagation(); i.file_path ? openDoc(i.file_path) : i.external_url && window.open(i.external_url, "_blank"); }}>
                      {i.file_path ? "📄" : i.external_url ? "⇗" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal title="Ajouter une facture" onClose={() => setOpen(false)}
          footer={<><button className="btn ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Entreprise" required>
              <select value={f.company_id} onChange={(e) => setF({ ...f, company_id: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Nom ou numéro" required><input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>
            <div className="grid g-2">
              <Field label="Catégorie"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
              <Field label="Montant"><input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            </div>
            <Field label="Date de facture"><input type="date" value={f.invoice_date} onChange={(e) => setF({ ...f, invoice_date: e.target.value })} /></Field>
            <Field label="Fichier (PDF / image)"><input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
            <Field label="Commentaire"><textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
