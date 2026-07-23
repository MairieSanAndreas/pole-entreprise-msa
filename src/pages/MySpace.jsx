import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { fmtDate, fmtDateTime, rdvStatus } from "../lib/format";
import { noteTypeLabel } from "../lib/constants";
import { Loading, Empty, Section, RdvPill } from "../components/ui";

export default function MySpace() {
  const { user, displayName } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [attention, setAttention] = useState([]);

  useEffect(() => {
    (async () => {
      const [a, n, c] = await Promise.all([
        supabase.from("audit_logs").select("*").eq("actor_id", user.id).order("created_at", { ascending: false }).limit(15),
        supabase.from("company_notes").select("*, companies(name)").eq("author_id", user.id).eq("is_deleted", false).order("created_at", { ascending: false }).limit(8),
        supabase.from("companies").select("id, name, last_meeting_at, category_id").eq("is_active", true),
      ]);
      setActivity(a.data ?? []);
      setMyNotes(n.data ?? []);
      const late = (c.data ?? []).filter((x) => ["late", "warn"].includes(rdvStatus(x.last_meeting_at).level))
        .sort((x, y) => (x.last_meeting_at ? new Date(x.last_meeting_at) : 0) - (y.last_meeting_at ? new Date(y.last_meeting_at) : 0))
        .slice(0, 8);
      setAttention(late);
      setLoading(false);
    })();
  }, [user.id]);

  if (loading) return <Loading />;
  return (
    <div className="stack">
      <div className="card pad">
        <div style={{ fontFamily: "var(--serif)", fontSize: 20 }}>Bonjour {displayName.split(" ")[0]} 👋</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Voici un résumé de votre activité récente sur le Pôle Entreprise.</div>
      </div>

      <div className="grid g-2">
        <Section title="Mes dernières actions">
          {activity.length === 0 ? <Empty icon="↺" title="Aucune action" /> : (
            <div className="tl">
              {activity.map((a) => (
                <div key={a.id} className="tl-item" onClick={() => a.company_id && nav(`/entreprises/${a.company_id}`)} style={{ cursor: a.company_id ? "pointer" : "default" }}>
                  <div className="row" style={{ fontSize: 12.5 }}>
                    <span className="badge">{a.entity_type}</span>
                    <span className="grow" />
                    <span className="faint">{fmtDateTime(a.created_at)}</span>
                  </div>
                  <div style={{ marginTop: 5, fontSize: 13.5 }}>{a.summary || a.action}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="stack">
          <Section title="Entreprises à relancer" action={<span className="faint" style={{ fontSize: 12 }}>{attention.length}</span>}>
            {attention.length === 0 ? <Empty icon="✓" title="Tout est à jour" /> : (
              <div className="stack" style={{ gap: 8 }}>
                {attention.map((c) => (
                  <div key={c.id} className="row" style={{ cursor: "pointer", fontSize: 13.5 }} onClick={() => nav(`/entreprises/${c.id}`)}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span className="grow" />
                    <RdvPill date={c.last_meeting_at} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Mes dernières notes">
            {myNotes.length === 0 ? <Empty icon="☰" title="Aucune note" /> : (
              <div className="stack" style={{ gap: 10 }}>
                {myNotes.map((n) => (
                  <div key={n.id} style={{ cursor: "pointer" }} onClick={() => nav(`/entreprises/${n.company_id}`)}>
                    <div className="row" style={{ fontSize: 12 }}>
                      <span className="badge">{noteTypeLabel(n.type)}</span>
                      <span className="gold">{n.companies?.name}</span>
                      <span className="grow" />
                      <span className="faint">{fmtDate(n.created_at)}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
