import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { Loading, Empty, Modal, Field, Confirm } from "../components/ui";

export default function Links() {
  const { isResponsable, user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [edit, setEdit] = useState(null);   // objet en édition/création
  const [del, setDel] = useState(null);
  const [copied, setCopied] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [l, c] = await Promise.all([
      supabase.from("useful_links").select("*, companies(name)").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").eq("is_active", true).order("name"),
    ]);
    setRows(l.data ?? []); setCompanies(c.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.category === cat) &&
      (!term || r.title.toLowerCase().includes(term) || (r.description || "").toLowerCase().includes(term)));
  }, [rows, q, cat]);

  const copy = (r) => { navigator.clipboard.writeText(r.url); setCopied(r.id); setTimeout(() => setCopied(null), 1500); };

  const save = async () => {
    if (!edit.title?.trim() || !edit.url?.trim()) return toast.err("Titre et URL requis.");
    setBusy(true);
    const payload = { title: edit.title.trim(), description: edit.description || null, url: edit.url.trim(),
      category: edit.category || null, company_id: edit.company_id || null };
    let err;
    if (edit.id) ({ error: err } = await supabase.from("useful_links").update(payload).eq("id", edit.id));
    else ({ error: err } = await supabase.from("useful_links").insert(payload));
    if (err) { toast.err(err.message); setBusy(false); return; }
    await logAudit({ action: edit.id ? "update" : "create", entity_type: "link", summary: `Lien « ${payload.title} » ${edit.id ? "modifié" : "ajouté"}` });
    toast.ok(edit.id ? "Lien modifié." : "Lien ajouté."); setEdit(null); setBusy(false); load();
  };

  const remove = async () => {
    setBusy(true);
    await supabase.from("useful_links").delete().eq("id", del.id);
    await logAudit({ action: "delete", entity_type: "link", summary: `Lien « ${del.title} » supprimé` });
    toast.ok("Lien supprimé."); setDel(null); setBusy(false); load();
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher un lien…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Toutes catégories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grow" />
        <button className="btn primary" onClick={() => setEdit({ title: "", url: "", description: "", category: "", company_id: "" })}>+ Ajouter un lien</button>
      </div>

      {filtered.length === 0 ? <div className="card"><Empty icon="⇗" title="Aucun lien" /></div> : (
        <div className="grid g-3">
          {filtered.map((r) => (
            <div key={r.id} className="card pad">
              <div className="row">
                {r.category && <span className="badge">{r.category}</span>}
                <span className="grow" />
                {(isResponsable || r.created_by === user.id) && (
                  <>
                    <button className="btn ghost sm" onClick={() => setEdit(r)} style={{ padding: "3px 7px" }}>✎</button>
                    <button className="btn ghost sm" onClick={() => setDel(r)} style={{ padding: "3px 7px" }}>✕</button>
                  </>
                )}
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16, marginTop: 8 }}>{r.title}</div>
              {r.description && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{r.description}</div>}
              {r.companies?.name && <div className="gold" style={{ fontSize: 12.5, marginTop: 6 }}>{r.companies.name}</div>}
              <div className="row" style={{ marginTop: 12 }}>
                <a className="btn sm" href={r.url} target="_blank" rel="noreferrer">Ouvrir ⇗</a>
                <button className={`btn ghost sm ${copied === r.id ? "copied" : ""}`} onClick={() => copy(r)}>{copied === r.id ? "✓ Copié" : "Copier"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <Modal title={edit.id ? "Modifier le lien" : "Ajouter un lien"} onClose={() => setEdit(null)}
          footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <Field label="Titre" required><input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="URL" required><input value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} placeholder="https://docs.google.com/…" /></Field>
            <Field label="Description"><textarea value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <div className="grid g-2">
              <Field label="Catégorie"><input value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
              <Field label="Entreprise associée">
                <select value={edit.company_id || ""} onChange={(e) => setEdit({ ...edit, company_id: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </Modal>
      )}
      {del && <Confirm title="Supprimer le lien" danger message={`Supprimer « ${del.title} » ?`} confirmLabel="Supprimer" onConfirm={remove} onClose={() => setDel(null)} busy={busy} />}
    </div>
  );
}
