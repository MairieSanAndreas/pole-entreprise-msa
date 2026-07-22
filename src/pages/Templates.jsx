import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { fillTemplate } from "../lib/format";
import { Loading, Empty, Modal, Field, Confirm } from "../components/ui";

export default function Templates() {
  const { isResponsable, user, displayName } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [edit, setEdit] = useState(null);
  const [preview, setPreview] = useState(null);
  const [del, setDel] = useState(null);
  const [copied, setCopied] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("message_templates").select("*")
      .eq("is_archived", false).order("title");
    setRows(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => (cat === "all" || r.category === cat) &&
      (!term || r.title.toLowerCase().includes(term) || r.content.toLowerCase().includes(term)));
  }, [rows, q, cat]);

  // Copie en remplaçant {secretaire} et {date} d'office ; les variables
  // liées à une entreprise se remplissent depuis la fiche entreprise.
  const copy = (r) => {
    const text = fillTemplate(r.content, { secretaire: displayName });
    navigator.clipboard.writeText(text);
    setCopied(r.id); setTimeout(() => setCopied(null), 1500);
  };

  const save = async () => {
    if (!edit.title?.trim() || !edit.content?.trim()) return toast.err("Titre et contenu requis.");
    setBusy(true);
    const payload = { title: edit.title.trim(), category: edit.category || null, content: edit.content };
    let err;
    if (edit.id) ({ error: err } = await supabase.from("message_templates").update(payload).eq("id", edit.id));
    else ({ error: err } = await supabase.from("message_templates").insert(payload));
    if (err) { toast.err(err.message); setBusy(false); return; }
    await logAudit({ action: edit.id ? "update" : "create", entity_type: "template", summary: `Template « ${payload.title} » ${edit.id ? "modifié" : "créé"}` });
    toast.ok("Enregistré."); setEdit(null); setBusy(false); load();
  };

  const remove = async () => {
    setBusy(true);
    await supabase.from("message_templates").delete().eq("id", del.id);
    await logAudit({ action: "delete", entity_type: "template", summary: `Template « ${del.title} » supprimé` });
    toast.ok("Supprimé."); setDel(null); setBusy(false); load();
  };

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher un message type…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Toutes catégories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grow" />
        <button className="btn primary" onClick={() => setEdit({ title: "", category: "", content: "" })}>+ Nouveau message</button>
      </div>

      <div className="card pad" style={{ background: "var(--bg-2)", fontSize: 12.5 }}>
        <span className="muted">Variables disponibles : </span>
        {["{entreprise}", "{patron}", "{date}", "{secretaire}"].map((v) => <span key={v} className="badge mono" style={{ marginRight: 6 }}>{v}</span>)}
      </div>

      {filtered.length === 0 ? <div className="card"><Empty icon="❝" title="Aucun message type" /></div> : (
        <div className="grid g-3">
          {filtered.map((r) => (
            <div key={r.id} className="card pad">
              <div className="row">
                {r.category && <span className="badge">{r.category}</span>}
                <span className="grow" />
                {(isResponsable || r.created_by === user.id) && (
                  <>
                    <button className="btn ghost sm" style={{ padding: "3px 7px" }} onClick={() => setEdit(r)}>✎</button>
                    <button className="btn ghost sm" style={{ padding: "3px 7px" }} onClick={() => setDel(r)}>✕</button>
                  </>
                )}
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 16, marginTop: 8 }}>{r.title}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, maxHeight: 68, overflow: "hidden" }}>{r.content}</div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className={`btn primary sm ${copied === r.id ? "" : ""}`} onClick={() => copy(r)}>{copied === r.id ? "✓ Copié" : "Copier"}</button>
                <button className="btn ghost sm" onClick={() => setPreview(r)}>Aperçu</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <Modal title={edit.id ? "Modifier le message" : "Nouveau message type"} onClose={() => setEdit(null)} wide
          footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Annuler</button><button className="btn primary" onClick={save} disabled={busy}>Enregistrer</button></>}>
          <div className="stack">
            <div className="grid g-2">
              <Field label="Titre" required><input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
              <Field label="Catégorie"><input value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            </div>
            <Field label="Contenu" required hint="Utilisez {entreprise}, {patron}, {date}, {secretaire}.">
              <textarea style={{ minHeight: 160 }} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title={preview.title} onClose={() => setPreview(null)} wide
          footer={<button className="btn primary" onClick={() => { copy(preview); }}>Copier</button>}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{fillTemplate(preview.content, { secretaire: displayName })}</div>
        </Modal>
      )}
      {del && <Confirm title="Supprimer le message" danger message={`Supprimer « ${del.title} » ?`} confirmLabel="Supprimer" onConfirm={remove} onClose={() => setDel(null)} busy={busy} />}
    </div>
  );
}
