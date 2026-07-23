/* =====================================================================
   Pôle Entreprise — Mairie de San Andréas
   Identité : institutionnelle sombre & or, accents rouge « sceau ».
   Display : Fraunces (titres, sceau) · UI : Inter · Données : JetBrains Mono
   ===================================================================== */

:root {
  --bg:        #0E1216;
  --bg-2:      #121820;
  --surface:   #171E27;
  --surface-2: #1E2732;
  --line:      #2A3541;
  --line-soft: #212C37;

  --text:      #E9E7E1;
  --muted:     #98A2AE;
  --faint:     #6B7784;

  --gold:      #C9A24B;
  --gold-2:    #E4C06A;
  --gold-dim:  #7C6631;
  --red:       #B4413B;
  --red-2:     #D4574F;

  --ok:        #4F9E6A;
  --warn:      #D18A34;
  --late:      #C24A40;
  --info:      #4C86C6;

  --ok-bg:   rgba(79,158,106,.14);
  --warn-bg: rgba(209,138,52,.15);
  --late-bg: rgba(194,74,64,.16);

  --radius:   14px;
  --radius-s: 9px;
  --shadow:   0 10px 30px rgba(0,0,0,.35);
  --ring:     0 0 0 2px rgba(201,162,75,.55);

  --sidebar-w: 244px;

  --sans: "Inter", system-ui, -apple-system, sans-serif;
  --serif: "Fraunces", Georgia, serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;
}

* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  font-family: var(--sans);
  color: var(--text);
  background:
    radial-gradient(1100px 700px at 82% -8%, rgba(201,162,75,.07), transparent 60%),
    radial-gradient(900px 600px at -5% 110%, rgba(180,65,59,.06), transparent 55%),
    var(--bg);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; }
::selection { background: rgba(201,162,75,.30); }

/* ---------- Scrollbar --------------------------------------------------- */
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: #263141; border-radius: 20px; border: 2px solid var(--bg); }
*::-webkit-scrollbar-track { background: transparent; }

/* ---------- App shell --------------------------------------------------- */
.shell { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }

.sidebar {
  position: sticky; top: 0; height: 100vh;
  background: linear-gradient(180deg, #10161D, #0C1116);
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column;
  padding: 18px 14px;
}
.brand { display: flex; gap: 12px; align-items: center; padding: 6px 8px 16px; }
.seal {
  width: 42px; height: 42px; flex: none; border-radius: 11px;
  background:
    radial-gradient(circle at 50% 34%, var(--gold-2), var(--gold) 46%, var(--gold-dim) 100%);
  color: #241B08; display: grid; place-items: center;
  font-family: var(--serif); font-weight: 700; font-size: 20px;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.18), 0 4px 14px rgba(201,162,75,.35);
  position: relative;
}
.seal::after {
  content: ""; position: absolute; inset: 4px; border-radius: 8px;
  border: 1px dashed rgba(36,27,8,.4);
}
.brand-txt b {
  font-family: var(--serif); font-weight: 600; font-size: 15px; letter-spacing: .2px;
  display: block; line-height: 1.1;
}
.brand-txt span { font-size: 11px; color: var(--gold); letter-spacing: 1.4px; text-transform: uppercase; }

.nav { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
.nav-sep { height: 1px; background: var(--line-soft); margin: 12px 6px; }
.nav a {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 11px; border-radius: 10px; color: var(--muted);
  font-size: 13.5px; font-weight: 500; transition: .14s;
}
.nav a .ic { width: 18px; text-align: center; color: var(--faint); font-size: 13px; }
.nav a:hover { background: var(--surface); color: var(--text); }
.nav a.active { background: var(--surface-2); color: var(--text); box-shadow: inset 3px 0 0 var(--gold); }
.nav a.active .ic { color: var(--gold); }

.sidebar-foot { margin-top: auto; padding: 12px 8px 2px; border-top: 1px solid var(--line-soft); }
.who { display: flex; align-items: center; gap: 10px; }
.who .role { font-size: 11px; color: var(--gold); text-transform: uppercase; letter-spacing: .8px; }
.who small { color: var(--muted); font-size: 12.5px; }

/* ---------- Main -------------------------------------------------------- */
.main { min-width: 0; display: flex; flex-direction: column; }
.topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 16px;
  padding: 14px 26px; background: rgba(14,18,22,.82);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--line);
}
.topbar h1 { font-family: var(--serif); font-size: 20px; font-weight: 600; margin: 0; }
.topbar .sub { color: var(--muted); font-size: 12.5px; margin-top: 1px; }
.topbar .grow { flex: 1; }
.content { padding: 24px 26px 60px; max-width: 1400px; width: 100%; }

.page-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
.page-head h2 { font-family: var(--serif); font-size: 22px; font-weight: 600; margin: 0; }
.page-head .grow { flex: 1; }

/* ---------- Cards / grid ------------------------------------------------ */
.card {
  background: linear-gradient(180deg, var(--surface), var(--bg-2));
  border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
}
.card.pad { padding: 18px; }
.grid { display: grid; gap: 16px; }
.g-2 { grid-template-columns: repeat(2, 1fr); }
.g-3 { grid-template-columns: repeat(3, 1fr); }
.g-4 { grid-template-columns: repeat(4, 1fr); }
.row { display: flex; gap: 12px; align-items: center; }
.wrap { flex-wrap: wrap; }
.grow { flex: 1; }
.stack { display: flex; flex-direction: column; gap: 14px; }

/* ---------- KPI --------------------------------------------------------- */
.kpi { padding: 16px 18px; }
.kpi .lbl { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .7px; }
.kpi .val { font-family: var(--serif); font-size: 30px; font-weight: 600; margin-top: 4px; }
.kpi .val.gold { color: var(--gold-2); }
.kpi .val.late { color: var(--late); }
.kpi .val.warn { color: var(--warn); }
.kpi .hint { color: var(--faint); font-size: 12px; margin-top: 2px; }

/* ---------- Buttons ----------------------------------------------------- */
.btn {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 9px 15px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
  background: var(--surface-2); color: var(--text); border: 1px solid var(--line);
  transition: .14s;
}
.btn:hover { border-color: #3a4757; background: #232e3a; }
.btn:focus-visible { outline: none; box-shadow: var(--ring); }
.btn.primary {
  background: linear-gradient(180deg, var(--gold-2), var(--gold));
  color: #241B08; border-color: transparent;
}
.btn.primary:hover { filter: brightness(1.06); }
.btn.danger { color: var(--red-2); border-color: #4a2b2b; }
.btn.danger:hover { background: rgba(180,65,59,.14); }
.btn.ghost { background: transparent; }
.btn.sm { padding: 6px 11px; font-size: 12.5px; }
.btn.icon { padding: 7px 9px; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

/* ---------- Inputs ------------------------------------------------------ */
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; color: var(--muted); font-weight: 500; }
.field .req { color: var(--red-2); }
input, select, textarea {
  background: var(--bg); color: var(--text);
  border: 1px solid var(--line); border-radius: 10px;
  padding: 10px 12px; font-size: 14px; font-family: inherit; width: 100%;
  transition: .14s;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--gold-dim); box-shadow: var(--ring); }
textarea { resize: vertical; min-height: 84px; }
input::placeholder, textarea::placeholder { color: var(--faint); }
.search {
  position: relative; min-width: 240px;
}
.search input { padding-left: 34px; }
.search::before {
  content: "⚲"; position: absolute; left: 12px; top: 50%; transform: translateY(-50%) rotate(-45deg);
  color: var(--faint); font-size: 15px;
}

/* ---------- Table ------------------------------------------------------- */
.table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.table th {
  text-align: left; color: var(--muted); font-weight: 600; font-size: 11.5px;
  text-transform: uppercase; letter-spacing: .5px;
  padding: 11px 14px; border-bottom: 1px solid var(--line);
}
.table td { padding: 12px 14px; border-bottom: 1px solid var(--line-soft); }
.table tr:last-child td { border-bottom: none; }
.table tbody tr { transition: background .12s; }
.table tbody tr:hover { background: var(--surface-2); cursor: pointer; }
.table .num { font-family: var(--mono); }

/* ---------- Badges / pills --------------------------------------------- */
.badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 600;
  border: 1px solid var(--line); color: var(--muted); background: var(--bg-2);
}
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }

.pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.pill .dot { width: 7px; height: 7px; border-radius: 50%; }
.pill.ok   { background: var(--ok-bg);   color: #7CCB99; }
.pill.warn { background: var(--warn-bg); color: #E7B368; }
.pill.late { background: var(--late-bg); color: #E58A81; }
.pill.none { background: #1b2530; color: var(--faint); }
.pill.ok .dot { background: var(--ok); }
.pill.warn .dot { background: var(--warn); }
.pill.late .dot { background: var(--late); }
.pill.none .dot { background: var(--faint); }
.pill.neutral { background: #1b2530; color: var(--muted); }
.pill.danger { background: var(--late-bg); color: #E58A81; }
.pill.info { background: rgba(76,134,198,.15); color: #7FB0E0; }

/* ---------- Logo chip --------------------------------------------------- */
.logo {
  width: 38px; height: 38px; border-radius: 9px; flex: none; object-fit: cover;
  background: var(--surface-2); border: 1px solid var(--line);
  display: grid; place-items: center; font-weight: 700; color: var(--gold-2);
  font-family: var(--serif); overflow: hidden;
}
.logo.lg { width: 72px; height: 72px; font-size: 26px; border-radius: 14px; }

/* ---------- Avatar ------------------------------------------------------ */
.avatar {
  width: 32px; height: 32px; border-radius: 50%; flex: none;
  background: var(--surface-2); border: 1px solid var(--line);
  display: grid; place-items: center; font-size: 12px; font-weight: 700; color: var(--gold-2);
}

/* ---------- Modal ------------------------------------------------------- */
.overlay {
  position: fixed; inset: 0; z-index: 60; background: rgba(6,9,12,.66);
  display: grid; place-items: center; padding: 24px; backdrop-filter: blur(3px);
}
.modal {
  width: 100%; max-width: 560px; max-height: 88vh; overflow: auto;
  background: linear-gradient(180deg, var(--surface), var(--bg-2));
  border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
}
.modal.wide { max-width: 760px; }
.modal-head { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--line); }
.modal-head h3 { font-family: var(--serif); font-size: 18px; margin: 0; }
.modal-body { padding: 20px; }
.modal-foot { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid var(--line); }
.x { margin-left: auto; cursor: pointer; color: var(--muted); font-size: 20px; line-height: 1; background: none; border: none; }
.x:hover { color: var(--text); }

/* ---------- Toast ------------------------------------------------------- */
.toasts { position: fixed; bottom: 22px; right: 22px; z-index: 90; display: flex; flex-direction: column; gap: 10px; }
.toast {
  min-width: 240px; max-width: 360px; padding: 12px 15px; border-radius: 11px;
  background: var(--surface-2); border: 1px solid var(--line); box-shadow: var(--shadow);
  font-size: 13.5px; display: flex; gap: 10px; align-items: center;
  animation: toastIn .25s ease;
}
.toast.ok { border-left: 3px solid var(--ok); }
.toast.err { border-left: 3px solid var(--red); }
.toast.info { border-left: 3px solid var(--gold); }
@keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }

/* ---------- Misc -------------------------------------------------------- */
.muted { color: var(--muted); }
.faint { color: var(--faint); }
.mono { font-family: var(--mono); }
.gold { color: var(--gold-2); }
.center { text-align: center; }
.sp { display: flex; gap: 8px; align-items: center; }
.divider { height: 1px; background: var(--line-soft); margin: 16px 0; }
.tag-input { display: flex; gap: 8px; flex-wrap: wrap; }

.empty { text-align: center; padding: 48px 20px; color: var(--muted); }
.empty .ic { font-size: 34px; opacity: .5; }
.empty h4 { font-family: var(--serif); color: var(--text); margin: 10px 0 4px; font-weight: 600; }

.spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--line); border-top-color: var(--gold);
  animation: spin .7s linear infinite;
}
.loading { display: grid; place-items: center; padding: 60px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Segmented filter buttons */
.seg { display: inline-flex; background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; padding: 3px; gap: 2px; flex-wrap: wrap; }
.seg button {
  border: none; background: transparent; color: var(--muted); cursor: pointer;
  padding: 6px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
}
.seg button.active { background: var(--surface-2); color: var(--text); }
.seg button:hover { color: var(--text); }

/* Tabs */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.tabs button {
  background: none; border: none; color: var(--muted); cursor: pointer;
  padding: 10px 14px; font-size: 13.5px; font-weight: 600; border-bottom: 2px solid transparent;
}
.tabs button.active { color: var(--text); border-bottom-color: var(--gold); }

/* Timeline (notes / audit) */
.tl { position: relative; padding-left: 22px; }
.tl::before { content: ""; position: absolute; left: 6px; top: 4px; bottom: 4px; width: 2px; background: var(--line); }
.tl-item { position: relative; padding: 0 0 16px 2px; }
.tl-item::before {
  content: ""; position: absolute; left: -22px; top: 5px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--surface); border: 2px solid var(--gold);
}
.tl-item.dim::before { border-color: var(--faint); }

/* Login */
.auth-wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
.auth-card { width: 100%; max-width: 400px; padding: 30px; }
.auth-card .seal { width: 54px; height: 54px; font-size: 26px; margin: 0 auto 14px; }
.auth-card h1 { font-family: var(--serif); text-align: center; font-size: 22px; margin: 0 0 2px; }
.auth-card p.sub { text-align: center; color: var(--muted); font-size: 13px; margin: 0 0 22px; }
.err-box { background: var(--late-bg); border: 1px solid #4a2b2b; color: #E58A81; padding: 10px 12px; border-radius: 9px; font-size: 13px; }

/* Copy feedback */
.copied { color: var(--ok); }

/* ---------- Responsive -------------------------------------------------- */
.menu-btn { display: none; }
@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar {
    position: fixed; z-index: 50; width: 260px; transform: translateX(-100%);
    transition: transform .22s ease;
  }
  .sidebar.open { transform: none; }
  .scrim { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 45; }
  .menu-btn { display: inline-flex; }
  .g-4 { grid-template-columns: repeat(2, 1fr); }
  .g-3, .g-2 { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .content { padding: 16px 14px 50px; }
  .topbar { padding: 12px 14px; }
  .g-4 { grid-template-columns: 1fr; }
  .search { min-width: 0; }
}
