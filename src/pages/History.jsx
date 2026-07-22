import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { fmtDateTime } from "../lib/format";
import { Loading, Empty, Avatar } from "../components/ui";

const ENTITIES = ["all", "company", "note", "invoice", "contract", "document", "link", "template", "user"];

export default function History() {
  const { isResponsable } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [actor, setActor] = useState("all");
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    (async () => {
      // La RLS restreint déjà : la responsable voit tout, une secrétaire son activité.
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      setRows(data ?? []);
      const { data: pf } = await supabase.from("profiles").select("id, display_name");
      setPeople(Object.fromEntries((pf ?? []).map((p) => [p.id, p.display_name])));
      setLoading(false);
    })();
  }, []);

  const actors = useMemo(() => [...new Set(rows.map((r) => r.actor_id).filter(Boolean))], [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const since = period === "all" ? 0 : Date.now() - Number(period) * 86400000;
    return rows.filter((r) =>
      (entity === "all" || r.entity_type === entity) &&
      (actor === "all" || r.actor_id === actor) &&
      (new Date(r.created_at).getTime() >= since) &&
      (!term || (r.summary || "").toLowerCase().includes(term) || (r.action || "").toLowerCase().includes(term)));
  }, [rows, q, entity, actor, period]);

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="page-head">
        <div className="search"><input placeholder="Rechercher une action…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={entity} onChange={(e) => setEntity(e.target.value)} style={{ width: "auto" }}>
          {ENTITIES.map((e) => <option key={e} value={e}>{e === "all" ? "Tout type" : e}</option>)}
        </select>
        {isResponsable && (
          <select value={actor} onChange={(e) => setActor(e.target.value)} style={{ width: "auto" }}>
            <option value="all">Tous utilisateurs</option>
            {actors.map((a) => <option key={a} value={a}>{people[a] || "—"}</option>)}
          </select>
        )}
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: "auto" }}>
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
          <option value="all">Tout</option>
        </select>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? <Empty icon="↺" title="Aucune action" /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Type</th><th>Détail</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => r.company_id && nav(`/entreprises/${r.company_id}`)} style={{ cursor: r.company_id ? "pointer" : "default" }}>
                    <td className="num muted" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.created_at)}</td>
                    <td><div className="row"><Avatar name={people[r.actor_id]} /><span>{people[r.actor_id] || "—"}</span></div></td>
                    <td><span className="badge">{r.action}</span></td>
                    <td>{r.entity_type}</td>
                    <td>
                      {r.summary || "—"}
                      {r.field && <div className="faint mono" style={{ fontSize: 11.5, marginTop: 3 }}>{r.field}: {r.old_value ?? "∅"} → {r.new_value ?? "∅"}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="faint" style={{ fontSize: 12.5 }}>{filtered.length} entrée{filtered.length > 1 ? "s" : ""}</div>
    </div>
  );
}
