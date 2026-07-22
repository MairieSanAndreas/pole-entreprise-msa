import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { fmtDate, fmtDateTime, money } from "../lib/format";
import { NOTE_TYPES, noteTypeLabel, contractStatusMeta } from "../lib/constants";
import { logoUrl, openDoc, uploadDoc } from "../lib/storage";
import { Loading, Empty, Logo, RdvPill, CategoryBadge, Section, Modal, Confirm, Field } from "../components/ui";

export default function CompanyDetail() {
  const { id } = useParams();
  const { canViewSensitive, canDelete, user } = useAuth();
  const { isResponsable } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [company, setCompany] = useState(null);
  const [rib, setRib] = useState(null);
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [docs, setDocs] = useState([]);
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("notes");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, n, inv, con, dc, pf] = await Promise.all([
      supabase.from("companies").select("*, company_categories!category_id(label, color)").eq("id", id).single(),
      supabase.from("company_notes").select("*").eq("company_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("company_id", id).order("received_at", { ascending: false }),
      supabase.from("contracts").select("*").eq("company_id", id).order("created_at", { ascending: false }),
      supabase.from("company_documents").select("*").eq("company_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
    ]);
    setCompany(c.data); setNotes(n.data ?? []); setInvoices(inv.data ?? []);
    setContracts(con.data ?? []); setDocs(dc.data ?? []);
    setPeople(Object.fromEntries((pf.data ?? []).map((p) => [p.id, p.display_name])));
    if (canViewSensitive) {
      const { data: s } = await supabase.from("company_sensitive").select("*").eq("company_id", id).maybeSingle();
      setRib(s);
    }
    setLoading(false);
  }, [id, canViewSensitive]);

  useEffect(() => { load(); }, [load]);

  const who = (uid) => people[uid] || "—";

  const archive = async () => {
    setBusy(true);
    await supabase.from("companies").update({
      is_active: false, status: "archive", archived_at: new Date().toISOString(), archived_by: user.id,
    }).eq("id", id);
    await logAudit({ action: "archive", entity_type: "company", entity_id: id, company_id: id, summary: `Archivage de « ${company.name} »` });
    toast.ok("Entreprise archivée."); setBusy(false); setConfirm(null); nav("/entreprises");
  };
  const restore = async () => {
    await supabase.from("companies").update({ is_active: true, status: "actif", archived_at: null, archived_by: null }).eq("id", id);
    await logAudit({ action: "update", entity_type: "company", entity_id: id, company_id: id, summary: `Restauration de « ${company.name} »` });
    toast.ok("Entreprise restaurée."); load();
  };
  const destroy = async () => {
    setBusy(true);
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) { toast.err(error.message); setBusy(false); return; }
    await logAudit({ action: "delete", entity_type: "company", entity_id: id, summary: `Suppression définitive de « ${company.name} »` });
    toast.ok("Entreprise supprimée."); setBusy(false); nav("/entreprises");
  };

  if (loading) return <Loading />;
  if (!company) return <Empty icon="▣" title="Entreprise introuvable"><Link className="btn" to="/entreprises">Retour</Link></Empty>;

  return (
    <div className="stack">
      {/* En-tête */}
      <div className="card pad">
        <div className="row wrap" style={{ alignItems: "flex-start" }}>
          <Logo url={logoUrl(company.logo_path)} name={company.name} lg />
          <div style={{ minWidth: 0 }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 24, margin: 0 }}>{company.name}</h2>
              {!company.is_active && <span className="pill neutral">Archivée</span>}
            </div>
            <div className="row wrap" style={{ marginTop: 8, gap: 8 }}>
              <CategoryBadge category={company.company_categories} />
              <RdvPill date={company.last_meeting_at} />
              <span className="badge">{company.status}</span>
            </div>
          </div>
          <div className="grow" />
          <div className="row wrap" style={{ gap: 8 }}>
            <Link to={`/entreprises/${id}/modifier`} className="btn">Modifier</Link>
            {company.is_active
              ? <button className="btn ghost" onClick={() => setConfirm("archive")}>Archiver</button>
              : <button className="btn ghost" onClick={restore}>Restaurer</button>}
            {canDelete && <button className="btn danger" onClick={() => setConfirm("delete")}>Supprimer</button>}
          </div>
        </div>
      </div>

      <div className="grid g-2">
        {/* Coordonnées */}
        <Section title="Coordonnées">
          <div className="stack" style={{ gap: 12 }}>
            <Info label="Patron" value={[company.owner_first_name, company.owner_last_name].filter(Boolean).join(" ")} phone={company.owner_phone} />
            {(company.coowner_first_name || company.coowner_last_name || company.coowner_phone) && (
              <Info label="Copatron" value={[company.coowner_first_name, company.coowner_last_name].filter(Boolean).join(" ")} phone={company.coowner_phone} />
            )}
            <div className="divider" />
            <Info label="Dernier rendez-vous" value={fmtDate(company.last_meeting_at)} />
            {company.notes && (
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Notes générales</div>
                <div style={{ marginTop: 4, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{company.notes}</div>
              </div>
            )}
          </div>
          <div className="divider" />
          <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.7 }}>
            Créée le {fmtDate(company.created_at)} par {who(company.created_by)}<br />
            Modifiée le {fmtDateTime(company.updated_at)} par {who(company.updated_by)}
          </div>
        </Section>

        {/* RIB sensible */}
        <Section title="🔒 RIB & informations sensibles">
          {!canViewSensitive ? (
            <div className="muted" style={{ fontSize: 13 }}>Accès réservé aux utilisateurs autorisés.</div>
          ) : rib && (rib.rib_text || rib.rib_document_path) ? (
            <div className="stack" style={{ gap: 12 }}>
              {rib.rib_text && (
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>RIB</div>
                  <div className="mono" style={{ marginTop: 4, wordBreak: "break-all" }}>{rib.rib_text}</div>
                </div>
              )}
              {rib.rib_document_path && (
                <button className="btn sm" onClick={() => openDoc(rib.rib_document_path)}>📄 Ouvrir le document RIB</button>
              )}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>Aucun RIB enregistré. <Link className="gold" to={`/entreprises/${id}/modifier`}>Ajouter</Link>.</div>
          )}
        </Section>
      </div>

      {/* Onglets contenu */}
      <div className="card pad">
        <div className="tabs">
          <button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}>Suivi & notes ({notes.length})</button>
          <button className={tab === "invoices" ? "active" : ""} onClick={() => setTab("invoices")}>Factures ({invoices.length})</button>
          <button className={tab === "contracts" ? "active" : ""} onClick={() => setTab("contracts")}>Contrats ({contracts.length})</button>
          <button className={tab === "docs" ? "active" : ""} onClick={() => setTab("docs")}>Documents ({docs.length})</button>
        </div>

        {tab === "notes" && <NotesTab companyId={id} company={company} notes={notes} people={people} reload={load} isResponsable={isResponsable} userId={user.id} />}
        {tab === "invoices" && <InvoicesTab companyId={id} companyName={company.name} rows={invoices} people={people} reload={load} />}
        {tab === "contracts" && <ContractsTab companyId={id} companyName={company.name} rows={contracts} people={people} reload={load} />}
        {tab === "docs" && <DocsTab companyId={id} companyName={company.name} rows={docs} people={people} reload={load} />}
      </div>

      {confirm === "archive" && (
        <Confirm title="Archiver l'entreprise" message={`« ${company.name} » sera masquée des listes actives mais conservée. Continuer ?`}
          confirmLabel="Archiver" onConfirm={archive} onClose={() => setConfirm(null)} busy={busy} />
      )}
      {confirm === "delete" && (
        <Confirm title="Suppression définitive" danger confirmLabel="Supprimer définitivement"
          message={`Cette action est irréversible : « ${company.name} », ses notes, factures et contrats seront supprimés. Confirmer ?`}
          onConfirm={destroy} onClose={() => setConfirm(null)} busy={busy} />
      )}
    </div>
  );
}

const Info = ({ label, value, phone }) => (
  <div>
    <div className="muted" style={{ fontSize: 12 }}>{label}</div>
    <div style={{ marginTop: 3 }}>{value || <span className="faint">—</span>}</div>
    {phone && <div className="mono gold" style={{ fontSize: 13, marginTop: 2 }}>{phone}</div>}
  </div>
);

/* ---------------------------- Notes ------------------------------------- */
function NotesTab({ companyId, company, notes, people, reload, isResponsable, userId }) {
  const toast = useToast();
  const [type, setType] = useState("compte_rendu");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!content.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("company_notes")
      .insert({ company_id: companyId, type, content: content.trim(), author_id: userId }).select("id").single();
    if (error) { toast.err(error.message); setBusy(false); return; }
    await logAudit({ action: "create", entity_type: "note", entity_id: data.id, company_id: companyId,
      summary: `Note (${noteTypeLabel(type)}) sur « ${company.name} »` });
    setContent(""); setBusy(false); toast.ok("Note ajoutée."); reload();
  };

  const del = async (note) => {
    // Suppression logique -> le trigger DB écrit l'entrée d'audit.
    await supabase.from("company_notes").update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq("id", note.id);
    toast.ok("Note supprimée."); reload();
  };

  return (
    <div>
      <div className="card pad" style={{ background: "var(--bg-2)", marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "auto" }}>
            {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ajouter une note de suivi…" />
        <div className="row" style={{ marginTop: 10, justifyContent: "flex-end" }}>
          <button className="btn primary" onClick={add} disabled={busy || !content.trim()}>Ajouter la note</button>
        </div>
      </div>

      {notes.length === 0 ? <Empty icon="☰" title="Aucune note">Le suivi commence ici.</Empty> : (
        <div className="tl">
          {notes.map((n) => (
            <div key={n.id} className="tl-item">
              <div className="row" style={{ fontSize: 12.5 }}>
                <span className="badge">{noteTypeLabel(n.type)}</span>
                <span className="faint">· {who(people, n.author_id)}</span>
                <span className="grow" />
                <span className="faint">{fmtDateTime(n.created_at)}</span>
                {(isResponsable || n.author_id === userId) && (
                  <button className="btn ghost sm" style={{ padding: "2px 7px" }} onClick={() => del(n)}>✕</button>
                )}
              </div>
              <div style={{ marginTop: 6, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{n.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const who = (people, uid) => people[uid] || "—";

/* --------------------------- Invoices ----------------------------------- */
function InvoicesTab({ companyId, companyName, rows, people, reload }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ number: "", category: "", amount: "", invoice_date: "", comment: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.number.trim()) return toast.err("Un nom ou numéro est requis.");
    setBusy(true);
    try {
      let file_path = null;
      if (file) { const up = await uploadDoc(companyId, "factures", file); file_path = up.path; }
      const { data, error } = await supabase.from("invoices").insert({
        company_id: companyId, number: f.number.trim(), category: f.category || null,
        amount: f.amount ? Number(f.amount) : null, invoice_date: f.invoice_date || null,
        comment: f.comment || null, file_path,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "invoice", entity_id: data.id, company_id: companyId, summary: `Facture « ${f.number} » ajoutée à ${companyName}` });
      toast.ok("Facture ajoutée."); setOpen(false); setF({ number: "", category: "", amount: "", invoice_date: "", comment: "" }); setFile(null); reload();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="grow" />
        <button className="btn primary sm" onClick={() => setOpen(true)}>+ Ajouter une facture</button>
      </div>
      {rows.length === 0 ? <Empty icon="€" title="Aucune facture" /> : (
        <table className="table">
          <thead><tr><th>Facture</th><th>Catégorie</th><th>Montant</th><th>Date</th><th>Reçue</th><th></th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} onClick={() => i.file_path ? openDoc(i.file_path) : i.external_url && window.open(i.external_url, "_blank")}>
                <td style={{ fontWeight: 600 }}>{i.number}</td>
                <td>{i.category || <span className="faint">—</span>}</td>
                <td className="num">{money(i.amount)}</td>
                <td className="num">{fmtDate(i.invoice_date)}</td>
                <td className="num">{fmtDate(i.received_at)}</td>
                <td>{i.file_path ? "📄" : i.external_url ? "⇗" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title="Ajouter une facture" onClose={() => setOpen(false)}
          footer={<><button className="btn ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
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

/* --------------------------- Contracts ---------------------------------- */
function ContractsTab({ companyId, companyName, rows, reload }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", category: "", status: "brouillon", start_date: "", end_date: "", notes: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.name.trim()) return toast.err("Le nom du contrat est requis.");
    setBusy(true);
    try {
      let file_path = null;
      if (file) { const up = await uploadDoc(companyId, "contrats", file); file_path = up.path; }
      const { data, error } = await supabase.from("contracts").insert({
        company_id: companyId, name: f.name.trim(), category: f.category || null, status: f.status,
        start_date: f.start_date || null, end_date: f.end_date || null, notes: f.notes || null, file_path,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "contract", entity_id: data.id, company_id: companyId, summary: `Contrat « ${f.name} » ajouté à ${companyName}` });
      toast.ok("Contrat ajouté."); setOpen(false); setF({ name: "", category: "", status: "brouillon", start_date: "", end_date: "", notes: "" }); setFile(null); reload();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}><span className="grow" /><button className="btn primary sm" onClick={() => setOpen(true)}>+ Ajouter un contrat</button></div>
      {rows.length === 0 ? <Empty icon="✎" title="Aucun contrat" /> : (
        <table className="table">
          <thead><tr><th>Contrat</th><th>Statut</th><th>Début</th><th>Fin</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => { const m = contractStatusMeta(c.status); return (
              <tr key={c.id} onClick={() => c.file_path ? openDoc(c.file_path) : c.external_url && window.open(c.external_url, "_blank")}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td><span className={`pill ${m.tone}`}>{m.label}</span></td>
                <td className="num">{fmtDate(c.start_date)}</td>
                <td className="num">{fmtDate(c.end_date)}</td>
                <td>{c.file_path ? "📄" : c.external_url ? "⇗" : ""}</td>
              </tr>
            ); })}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title="Ajouter un contrat" onClose={() => setOpen(false)}
          footer={<><button className="btn ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Nom du contrat" required><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <div className="grid g-2">
              <Field label="Catégorie"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
              <Field label="Statut">
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                  {contractStatusMeta && ["brouillon","en_attente","actif","termine","resilie","archive"].map((s) => <option key={s} value={s}>{contractStatusMeta(s).label}</option>)}
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

/* ---------------------------- Documents --------------------------------- */
function DocsTab({ companyId, companyName, rows, people, reload }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!file) return toast.err("Sélectionnez un fichier.");
    setBusy(true);
    try {
      const up = await uploadDoc(companyId, "autres", file);
      const { data, error } = await supabase.from("company_documents").insert({
        company_id: companyId, doc_type: "autre", name: name.trim() || up.name,
        storage_path: up.path, mime_type: up.mime, size_bytes: up.size,
      }).select("id").single();
      if (error) throw error;
      await logAudit({ action: "create", entity_type: "document", entity_id: data.id, company_id: companyId, summary: `Document ajouté à ${companyName}` });
      toast.ok("Document ajouté."); setFile(null); setName(""); reload();
    } catch (e) { toast.err(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="card pad" style={{ background: "var(--bg-2)", marginBottom: 14 }}>
        <div className="row wrap">
          <input placeholder="Nom du document (optionnel)" value={name} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 260 }} />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ maxWidth: 260 }} />
          <button className="btn primary sm" onClick={add} disabled={busy || !file}>Importer</button>
        </div>
      </div>
      {rows.length === 0 ? <Empty icon="📎" title="Aucun document" /> : (
        <table className="table">
          <thead><tr><th>Document</th><th>Ajouté le</th><th>Par</th><th></th></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} onClick={() => d.storage_path ? openDoc(d.storage_path) : d.external_url && window.open(d.external_url, "_blank")}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td className="num">{fmtDate(d.created_at)}</td>
                <td>{who(people, d.created_by)}</td>
                <td>📄</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
