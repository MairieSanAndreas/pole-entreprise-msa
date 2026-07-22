import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { logAudit } from "../lib/audit";
import { uploadLogo, uploadDoc } from "../lib/storage";
import { COMPANY_STATUS } from "../lib/constants";
import { Field, Loading } from "../components/ui";

const EMPTY = {
  name: "", category_id: "", owner_first_name: "", owner_last_name: "", owner_phone: "",
  coowner_first_name: "", coowner_last_name: "", coowner_phone: "",
  last_meeting_at: "", status: "prospect", notes: "",
};

export default function CompanyForm() {
  const { id } = useParams();
  const editing = !!id;
  const { canViewSensitive } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [rib, setRib] = useState({ rib_text: "", rib_document_path: "" });
  const [ribFile, setRibFile] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("company_categories")
        .select("*").eq("is_active", true).order("position");
      setCategories(cats ?? []);
      if (editing) {
        const { data } = await supabase.from("companies").select("*").eq("id", id).single();
        if (data) setForm({ ...EMPTY, ...data, last_meeting_at: data.last_meeting_at || "" });
        if (canViewSensitive) {
          const { data: s } = await supabase.from("company_sensitive").select("*").eq("company_id", id).maybeSingle();
          if (s) setRib({ rib_text: s.rib_text || "", rib_document_path: s.rib_document_path || "" });
        }
        setLoading(false);
      }
    })();
  }, [id, editing, canViewSensitive]);

  const onLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.err("Le nom de l'entreprise est obligatoire.");
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        owner_first_name: form.owner_first_name || null,
        owner_last_name: form.owner_last_name || null,
        owner_phone: form.owner_phone || null,
        coowner_first_name: form.coowner_first_name || null,
        coowner_last_name: form.coowner_last_name || null,
        coowner_phone: form.coowner_phone || null,
        last_meeting_at: form.last_meeting_at || null,
        status: form.status,
        notes: form.notes || null,
      };

      let companyId = id;
      if (editing) {
        const { error } = await supabase.from("companies").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("companies").insert(payload).select("id").single();
        if (error) throw error;
        companyId = data.id;
      }

      // Logo
      if (logoFile) {
        const path = await uploadLogo(companyId, logoFile);
        await supabase.from("companies").update({ logo_path: path }).eq("id", companyId);
      }

      // RIB (données sensibles) — uniquement si autorisé
      if (canViewSensitive && (rib.rib_text || ribFile || rib.rib_document_path)) {
        let ribPath = rib.rib_document_path || null;
        if (ribFile) {
          const up = await uploadDoc(companyId, "rib", ribFile);
          ribPath = up.path;
        }
        await supabase.from("company_sensitive").upsert({
          company_id: companyId,
          rib_text: rib.rib_text || null,
          rib_document_path: ribPath,
        });
      }

      await logAudit({
        action: editing ? "update" : "create",
        entity_type: "company",
        entity_id: companyId,
        company_id: companyId,
        summary: `${editing ? "Modification" : "Création"} de l'entreprise « ${payload.name} »`,
      });

      toast.ok(editing ? "Entreprise mise à jour." : "Entreprise créée.");
      nav(`/entreprises/${companyId}`);
    } catch (err) {
      toast.err(err.message || "Erreur lors de l'enregistrement.");
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <form className="stack" onSubmit={submit} style={{ maxWidth: 820 }}>
      <div className="page-head">
        <h2>{editing ? "Modifier l'entreprise" : "Nouvelle entreprise"}</h2>
        <div className="grow" />
        <button type="button" className="btn ghost" onClick={() => nav(-1)}>Annuler</button>
        <button className="btn primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
      </div>

      <div className="card pad">
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 16 }}>
          <div className="field" style={{ width: 130 }}>
            <label>Logo</label>
            <label className="logo lg" style={{ cursor: "pointer" }}>
              {logoPreview ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (form.name?.[0]?.toUpperCase() || "+")}
              <input type="file" accept="image/*" hidden onChange={onLogo} />
            </label>
          </div>
          <div className="grow stack">
            <Field label="Nom de l'entreprise" required>
              <input value={form.name} onChange={set("name")} placeholder="ex. Bean Machine" required />
            </Field>
            <div className="grid g-2">
              <Field label="Catégorie">
                <select value={form.category_id || ""} onChange={set("category_id")}>
                  <option value="">— Sélectionner —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Statut">
                <select value={form.status} onChange={set("status")}>
                  {COMPANY_STATUS.filter((s) => s.value !== "archive").map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="divider" />
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 15, margin: "0 0 12px" }}>Patron</h3>
        <div className="grid g-3">
          <Field label="Prénom"><input value={form.owner_first_name} onChange={set("owner_first_name")} /></Field>
          <Field label="Nom"><input value={form.owner_last_name} onChange={set("owner_last_name")} /></Field>
          <Field label="Téléphone"><input value={form.owner_phone} onChange={set("owner_phone")} placeholder="555-0100" /></Field>
        </div>

        <h3 style={{ fontFamily: "var(--serif)", fontSize: 15, margin: "16px 0 12px" }}>Copatron <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>(facultatif)</span></h3>
        <div className="grid g-3">
          <Field label="Prénom"><input value={form.coowner_first_name} onChange={set("coowner_first_name")} /></Field>
          <Field label="Nom"><input value={form.coowner_last_name} onChange={set("coowner_last_name")} /></Field>
          <Field label="Téléphone"><input value={form.coowner_phone} onChange={set("coowner_phone")} /></Field>
        </div>

        <div className="divider" />
        <div className="grid g-2">
          <Field label="Date du dernier rendez-vous">
            <input type="date" value={form.last_meeting_at || ""} onChange={set("last_meeting_at")} />
          </Field>
        </div>
        <Field label="Notes générales">
          <textarea value={form.notes} onChange={set("notes")} placeholder="Informations générales sur l'entreprise…" />
        </Field>
      </div>

      {canViewSensitive && (
        <div className="card pad">
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 15, margin: "0 0 4px" }}>🔒 Informations sensibles — RIB</h3>
          <p className="faint" style={{ fontSize: 12, margin: "0 0 14px" }}>Accessible uniquement aux utilisateurs autorisés.</p>
          <Field label="RIB (texte)">
            <input className="mono" value={rib.rib_text} onChange={(e) => setRib((r) => ({ ...r, rib_text: e.target.value }))} placeholder="FR76 …" />
          </Field>
          <Field label="Document RIB" hint={rib.rib_document_path ? "Un document est déjà associé — en importer un nouveau le remplacera." : "PDF ou image."}>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setRibFile(e.target.files?.[0] || null)} />
          </Field>
        </div>
      )}
    </form>
  );
}
