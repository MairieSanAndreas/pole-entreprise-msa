import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { rdvStatus, fmtDate } from "../lib/format";
import { Loading, Empty, Logo, RdvPill, CategoryBadge } from "../components/ui";
import { logoUrl } from "../lib/storage";

const RELANCE = [
  { value: "all",  label: "Toutes" },
  { value: "ok",   label: "Suivi à jour" },
  { value: "warn", label: "+ de 3 semaines" },
  { value: "late", label: "+ de 1 mois" },
  { value: "none", label: "Sans RDV" },
];

export default function Companies() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("name");
  const [params, setParams] = useSearchParams();
  const [relance, setRelance] = useState(params.get("relance") || "all");
  const [showArchived, setShowArchived] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const [cat, c] = await Promise.all([
        supabase.from("company_categories").select("*").eq("is_active", true).order("position"),
        supabase.from("companies")
          .select("id, name, category_id, logo_path, owner_first_name, owner_last_name, owner_phone, last_meeting_at, status, is_active")
          .order("name"),
      ]);
      setCategories(cat.data ?? []);
      setRows(c.data ?? []);
      setLoading(false);
    })();
  }, []);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows.filter((c) => (showArchived ? !c.is_active : c.is_active));
    if (term) list = list.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      `${c.owner_first_name || ""} ${c.owner_last_name || ""}`.toLowerCase().includes(term) ||
      (c.owner_phone || "").includes(term));
    if (cat !== "all") list = list.filter((c) => c.category_id === cat);
    if (relance !== "all") list = list.filter((c) => rdvStatus(c.last_meeting_at).level === relance);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rdv") {
        const da = a.last_meeting_at ? new Date(a.last_meeting_at) : 0;
        const db = b.last_meeting_at ? new Date(b.last_meeting_at) : 0;
        return da - db; // plus ancien en premier -> à relancer en haut
      }
      return 0;
    });
    return list;
  }, [rows, q, cat, relance, sort, showArchived]);

  const setRel = (v) => {
    setRelance(v);
    if (v === "all") { params.delete("relance"); setParams(params, { replace: true }); }
    else setParams({ relance: v }, { replace: true });
  };

  if (loading) return <Loading />;

  return (
    <div className="stack">
      <div className="page-head">
        <div className="search">
          <input placeholder="Rechercher par nom, patron, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Toutes catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: "auto" }}>
          <option value="name">Trier : nom</option>
          <option value="rdv">Trier : à relancer</option>
        </select>
        <div className="grow" />
        <Link to="/entreprises/nouvelle" className="btn primary">+ Nouvelle entreprise</Link>
      </div>

      <div className="seg">
        {RELANCE.map((r) => (
          <button key={r.value} className={relance === r.value ? "active" : ""} onClick={() => setRel(r.value)}>{r.label}</button>
        ))}
        <button className={showArchived ? "active" : ""} onClick={() => setShowArchived((s) => !s)}>
          {showArchived ? "◀ Actives" : "Archivées"}
        </button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <Empty icon="▣" title="Aucune entreprise">
            {rows.length === 0 ? "Ajoutez votre première entreprise." : "Aucun résultat pour ces filtres."}
          </Empty>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Catégorie</th>
                  <th>Patron</th>
                  <th>Téléphone</th>
                  <th>Dernier RDV</th>
                  <th>Suivi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => nav(`/entreprises/${c.id}`)}>
                    <td>
                      <div className="row">
                        <Logo url={logoUrl(c.logo_path)} name={c.name} />
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td><CategoryBadge category={catMap[c.category_id]} /></td>
                    <td>{[c.owner_first_name, c.owner_last_name].filter(Boolean).join(" ") || <span className="faint">—</span>}</td>
                    <td className="num">{c.owner_phone || <span className="faint">—</span>}</td>
                    <td className="num">{fmtDate(c.last_meeting_at)}</td>
                    <td><RdvPill date={c.last_meeting_at} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="faint" style={{ fontSize: 12.5 }}>{filtered.length} entreprise{filtered.length > 1 ? "s" : ""}</div>
    </div>
  );
}
