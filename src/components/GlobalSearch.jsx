import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Recherche globale : entreprises (nom, patron, téléphone), factures,
// contrats, liens, templates. Résultats regroupés par type.
export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setGroups([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [comp, inv, con, lnk, tpl] = await Promise.all([
        supabase.from("companies")
          .select("id, name, owner_first_name, owner_last_name, owner_phone, coowner_phone")
          .or(`name.ilike.${like},owner_first_name.ilike.${like},owner_last_name.ilike.${like},owner_phone.ilike.${like},coowner_phone.ilike.${like}`)
          .limit(6),
        supabase.from("invoices").select("id, number, company_id").ilike("number", like).limit(4),
        supabase.from("contracts").select("id, name, company_id").ilike("name", like).limit(4),
        supabase.from("useful_links").select("id, title, url").ilike("title", like).limit(4),
        supabase.from("message_templates").select("id, title").ilike("title", like).limit(4),
      ]);

      const g = [];
      if (comp.data?.length) g.push({ label: "Entreprises", items: comp.data.map((c) => ({
        key: c.id, title: c.name,
        sub: [c.owner_first_name, c.owner_last_name].filter(Boolean).join(" ") || c.owner_phone,
        go: () => nav(`/entreprises/${c.id}`),
      })) });
      if (inv.data?.length) g.push({ label: "Factures", items: inv.data.map((i) => ({
        key: i.id, title: i.number, sub: "Facture", go: () => nav(`/entreprises/${i.company_id}`),
      })) });
      if (con.data?.length) g.push({ label: "Contrats", items: con.data.map((c) => ({
        key: c.id, title: c.name, sub: "Contrat", go: () => nav(`/entreprises/${c.company_id}`),
      })) });
      if (lnk.data?.length) g.push({ label: "Liens", items: lnk.data.map((l) => ({
        key: l.id, title: l.title, sub: "Lien", go: () => window.open(l.url, "_blank"),
      })) });
      if (tpl.data?.length) g.push({ label: "Messages types", items: tpl.data.map((t) => ({
        key: t.id, title: t.title, sub: "Template", go: () => nav("/templates"),
      })) });

      setGroups(g);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q, nav]);

  return (
    <div className="search" ref={box} style={{ position: "relative" }}>
      <input
        placeholder="Rechercher entreprise, patron, facture…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && q.trim().length >= 2 && (
        <div className="card" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360, maxHeight: 420, overflow: "auto", zIndex: 40, padding: 6 }}>
          {loading && <div className="muted" style={{ padding: 12, fontSize: 13 }}>Recherche…</div>}
          {!loading && groups.length === 0 && <div className="muted" style={{ padding: 12, fontSize: 13 }}>Aucun résultat.</div>}
          {groups.map((grp) => (
            <div key={grp.label}>
              <div className="faint" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: .6, padding: "8px 10px 4px" }}>{grp.label}</div>
              {grp.items.map((it) => (
                <button key={it.key} className="btn ghost" style={{ width: "100%", justifyContent: "flex-start", border: "none", padding: "8px 10px" }}
                  onClick={() => { it.go(); setOpen(false); setQ(""); }}>
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    {it.sub && <div className="faint" style={{ fontSize: 11.5 }}>{it.sub}</div>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
