import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fmtDate, fmtDateTime, rdvStatus } from "../lib/format";
import { RDV_WARN_DAYS, RDV_LATE_DAYS, noteTypeLabel } from "../lib/constants";
import { Loading, Empty, Section, Logo, RdvPill } from "../components/ui";
import { companyLogo } from "../lib/storage";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [audit, setAudit] = useState([]);
  const [contracts, setContracts] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const [c, cat, n, inv, a, con] = await Promise.all([
        supabase.from("companies")
          .select("id, name, category_id, last_meeting_at, logo_path, logo_url, created_at, status")
          .eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("company_categories").select("*").eq("is_active", true).order("position"),
        supabase.from("company_notes")
          .select("id, type, content, created_at, company_id, companies(name)")
          .eq("is_deleted", false).order("created_at", { ascending: false }).limit(6),
        supabase.from("invoices")
          .select("id, number, amount, received_at, company_id, companies(name)")
          .order("created_at", { ascending: false }).limit(6),
        supabase.from("audit_logs")
          .select("id, action, entity_type, summary, created_at, actor_id")
          .order("created_at", { ascending: false }).limit(8),
        supabase.from("contracts")
          .select("id, name, end_date, status, company_id, companies(name)")
          .not("end_date", "is", null).in("status", ["actif", "en_attente"])
          .order("end_date", { ascending: true }).limit(20),
      ]);
      setCompanies(c.data ?? []);
      setCategories(cat.data ?? []);
      setNotes(n.data ?? []);
      setInvoices(inv.data ?? []);
      setAudit(a.data ?? []);
      setContracts(con.data ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const byCat = {};
    let warn = 0, late = 0, none = 0;
    companies.forEach((c) => {
      byCat[c.category_id] = (byCat[c.category_id] || 0) + 1;
      const s = rdvStatus(c.last_meeting_at);
      if (s.level === "late") late++;
      else if (s.level === "warn") warn++;
      else if (s.level === "none") none++;
    });
    return { total: companies.length, byCat, warn, late, none };
  }, [companies]);

  const endingSoon = useMemo(() => {
    const soon = Date.now() + 30 * 86400000;
    return contracts.filter((c) => new Date(c.end_date).getTime() <= soon);
  }, [contracts]);

  const recentCompanies = companies.slice(0, 5);

  if (loading) return <Loading />;

  return (
    <div className="stack">
      {/* KPIs */}
      <div className="grid g-4">
        <Link to="/entreprises" className="card kpi">
          <div className="lbl">Entreprises</div>
          <div className="val gold">{stats.total}</div>
          <div className="hint">Total actives</div>
        </Link>
        <Link to="/entreprises?relance=warn" className="card kpi">
          <div className="lbl">À relancer (3 sem.)</div>
          <div className="val warn">{stats.warn}</div>
          <div className="hint">RDV &gt; {RDV_WARN_DAYS} jours</div>
        </Link>
        <Link to="/entreprises?relance=late" className="card kpi">
          <div className="lbl">En retard (1 mois)</div>
          <div className="val late">{stats.late}</div>
          <div className="hint">RDV &gt; {RDV_LATE_DAYS} jours</div>
        </Link>
        <Link to="/entreprises?relance=none" className="card kpi">
          <div className="lbl">Sans RDV</div>
          <div className="val">{stats.none}</div>
          <div className="hint">Aucun rendez-vous</div>
        </Link>
      </div>

      {/* Notifications / rappels internes */}
      {(stats.late > 0 || endingSoon.length > 0) && (
        <Section title="🔔 Rappels internes">
          <div className="stack" style={{ gap: 8 }}>
            {stats.late > 0 && (
              <div className="row" style={{ fontSize: 13.5 }}>
                <span className="pill late"><span className="dot" />{stats.late}</span>
                <span>entreprise{stats.late > 1 ? "s" : ""} sans rendez-vous depuis plus d'un mois.</span>
                <Link to="/entreprises?relance=late" className="btn sm ghost" style={{ marginLeft: "auto" }}>Voir</Link>
              </div>
            )}
            {endingSoon.map((c) => (
              <div key={c.id} className="row" style={{ fontSize: 13.5 }} onClick={() => nav(`/entreprises/${c.company_id}`)}>
                <span className="pill warn"><span className="dot" /></span>
                <span>Contrat « {c.name} » ({c.companies?.name}) se termine le {fmtDate(c.end_date)}.</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid g-2">
        {/* Répartition par catégorie */}
        <Section title="Répartition par catégorie">
          <div className="stack" style={{ gap: 10 }}>
            {categories.map((cat) => {
              const count = stats.byCat[cat.id] || 0;
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="row" style={{ fontSize: 13 }}>
                    <span className="cat-dot" style={{ background: cat.color }} />
                    <span>{cat.label}</span>
                    <span className="grow" />
                    <span className="mono muted">{count}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg)", borderRadius: 4, marginTop: 5, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: cat.color, opacity: .8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Entreprises récemment ajoutées */}
        <Section title="Ajoutées récemment" action={<Link to="/entreprises" className="btn sm ghost">Tout voir</Link>}>
          {recentCompanies.length === 0 ? <Empty title="Aucune entreprise" /> : (
            <div className="stack" style={{ gap: 8 }}>
              {recentCompanies.map((c) => (
                <div key={c.id} className="row" style={{ cursor: "pointer" }} onClick={() => nav(`/entreprises/${c.id}`)}>
                  <Logo url={companyLogo(c)} name={c.name} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="faint" style={{ fontSize: 12 }}>Créée le {fmtDate(c.created_at)}</div>
                  </div>
                  <span className="grow" />
                  <RdvPill date={c.last_meeting_at} />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid g-3">
        <Section title="Dernières notes" action={<span className="faint" style={{ fontSize: 12 }}>{notes.length}</span>}>
          {notes.length === 0 ? <Empty title="Aucune note" /> : (
            <div className="stack" style={{ gap: 10 }}>
              {notes.map((n) => (
                <div key={n.id} style={{ cursor: "pointer" }} onClick={() => nav(`/entreprises/${n.company_id}`)}>
                  <div className="row" style={{ fontSize: 12 }}>
                    <span className="badge">{noteTypeLabel(n.type)}</span>
                    <span className="grow" />
                    <span className="faint">{fmtDate(n.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }} className="gold">{n.companies?.name}</div>
                  <div className="muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.content}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Dernières factures">
          {invoices.length === 0 ? <Empty title="Aucune facture" /> : (
            <div className="stack" style={{ gap: 9 }}>
              {invoices.map((i) => (
                <div key={i.id} className="row" style={{ fontSize: 13, cursor: "pointer" }} onClick={() => nav(`/entreprises/${i.company_id}`)}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{i.number}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{i.companies?.name}</div>
                  </div>
                  <span className="grow" />
                  <span className="mono muted">{fmtDate(i.received_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Dernières modifications" action={<Link to="/historique" className="btn sm ghost">Historique</Link>}>
          {audit.length === 0 ? <Empty title="Aucune action" /> : (
            <div className="stack" style={{ gap: 9 }}>
              {audit.map((a) => (
                <div key={a.id} style={{ fontSize: 12.5 }}>
                  <div className="row">
                    <span className="badge">{a.entity_type}</span>
                    <span className="grow" />
                    <span className="faint">{fmtDateTime(a.created_at)}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 3 }}>{a.summary || a.action}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
