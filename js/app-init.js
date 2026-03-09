/* ═══════════════════════════════════════════════════════════════════════
   APP INITIALIZATION — Auth, navigation, alerts
   REACH-only platform with Supabase auth
   ═══════════════════════════════════════════════════════════════════════ */

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  reach: 'Registration',
  alerts: 'Alerts',
  settings: 'Settings',
  admin: 'Admin'
};

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + id);
  if (view) view.classList.add('active');

  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.sb-item[data-view="${id}"]`);
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.mn-item[data-view]').forEach(b => b.classList.remove('active'));
  const mnBtn = document.querySelector(`.mn-item[data-view="${id}"]`);
  if (mnBtn) mnBtn.classList.add('active');

  const bc = document.getElementById('tbBreadcrumb');
  if (bc) bc.innerHTML = `<span class="tb-bc-root">3Worlds</span><span class="tb-sep">/</span><span class="tb-bc-current">${VIEW_TITLES[id] || id}</span>`;

  if (id === 'admin') loadAdminUsers();
  closeSidebar();
}

function switchReachTab() { switchView('reach'); }
function switchH2Tab() {}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count), dur = 1200, start = performance.now();
    function ease(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function upd(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(ease(p) * target);
      if (p < 1) requestAnimationFrame(upd);
    }
    requestAnimationFrame(upd);
  });
}

// ─── ALERTS ──────────────────────────────────────────────────────────────
const ALERTS_DATA = [
  { title: "Bisphenol A — Restriction Proposal", type: "Restriction", date: "2026-03-05", substance: "Bisphenol A (80-05-7)", body: "ECHA has published a restriction proposal for Bisphenol A under REACH Annex XVII. The proposal targets thermal paper and other consumer applications. Public consultation open until June 2026." },
  { title: "PFAS Universal Restriction — RAC/SEAC Update", type: "SVHC Candidate", date: "2026-02-28", substance: "PFAS group (various CAS)", body: "The five-country PFAS restriction proposal continues through SEAC and RAC evaluation. Scope covers ~10,000 substances. Transitional periods of 5-12 years proposed for critical uses." },
  { title: "Chromium Trioxide — Authorization Review", type: "Authorization", date: "2026-02-15", substance: "Chromium Trioxide (1333-82-0)", body: "Review reports due for existing Annex XIV authorizations for functional chrome plating. Companies must demonstrate continued need and progress on substitution." },
  { title: "Formaldehyde — OEL Revision (Directive 2019/983)", type: "OEL Update", date: "2026-01-20", substance: "Formaldehyde (50-00-0)", body: "Revised OEL: 0.3 ppm (8h TWA) and 0.6 ppm (STEL). Member states must transpose by 2027. Impact on SDS Section 8." },
  { title: "Lead — REACH Restriction Extension (Ammunition)", type: "Restriction", date: "2026-01-10", substance: "Lead (7439-92-1)", body: "Extension of lead restrictions to cover ammunition and fishing tackle. Transitional period: 3 years for hunting ammunition, 5 years for fishing weights." },
  { title: "ECHA — Updated IUCLID Validation Rules v4.2", type: "Technical", date: "2025-12-18", substance: "All substances", body: "ECHA has released updated IUCLID validation rules (v4.2). Key changes: stricter checks on endpoint study record completeness, new validation for nano-form reporting." }
];

function renderAlerts(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const typeColors = { Restriction: 'red', 'SVHC Candidate': 'gold', Authorization: 'purple', 'OEL Update': 'blue', Technical: 'green' };
  el.innerHTML = ALERTS_DATA.map(a => `<div class="alert-item" onclick="this.classList.toggle('open')">
    <div class="alert-header"><div><div class="alert-title">${a.title}</div><div style="margin-top:.2rem"><span class="pill pill-${typeColors[a.type] || 'gold'}">${a.type}</span><span style="font-size:.62rem;color:var(--t3);margin-left:.3rem">${a.substance}</span></div></div>
    <span class="alert-date">${a.date}</span></div>
    <div class="alert-body">${a.body}</div></div>`).join('');
}

// ─── AUTH INTEGRATION ────────────────────────────────────────────────────
async function initAuth() {
  try {
    if (typeof checkAuth === 'function') {
      const user = await checkAuth();
      if (!user) {
        // Supabase not configured or no session — show app anyway
        document.getElementById('app').style.display = 'flex';
        return;
      }
      populateUserUI(user);
    } else {
      document.getElementById('app').style.display = 'flex';
    }
  } catch (e) {
    document.getElementById('app').style.display = 'flex';
  }
}

function populateUserUI(user) {
  document.getElementById('app').style.display = 'flex';

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const role = user?.user_metadata?.role || 'user';
  const initial = name.charAt(0).toUpperCase();

  const sbName = document.getElementById('sbUserName');
  const sbEmail = document.getElementById('sbUserEmail');
  const sbAvatar = document.getElementById('sbAvatar');
  if (sbName) sbName.textContent = name;
  if (sbEmail) sbEmail.textContent = email;
  if (sbAvatar) sbAvatar.textContent = initial;

  const sName = document.getElementById('settingsName');
  const sEmail = document.getElementById('settingsEmail');
  const sRole = document.getElementById('settingsRole');
  const sSince = document.getElementById('settingsSince');
  if (sName) sName.textContent = name;
  if (sEmail) sEmail.textContent = email;
  if (sRole) sRole.innerHTML = `<span class="pill pill-${role === 'admin' ? 'gold' : 'blue'}">${role}</span>`;
  if (sSince) sSince.textContent = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—';

  if (role === 'admin') {
    const adminNav = document.getElementById('adminNav');
    const adminDivider = document.getElementById('adminDivider');
    if (adminNav) adminNav.style.display = 'flex';
    if (adminDivider) adminDivider.style.display = 'block';
  }
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────
async function loadAdminUsers() {
  const container = document.getElementById('adminUserList');
  if (!container) return;

  const client = getSupabase();
  if (!client) {
    container.innerHTML = '<div class="card"><h3 class="card-title">Admin Panel</h3><p class="page-desc">Supabase not configured. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.</p></div>';
    return;
  }

  const { data: { session } } = await client.auth.getSession();
  if (!session) return;

  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'list-users' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    container.innerHTML = `<h3 class="card-title">Users (${data.users.length})</h3>
      <div style="overflow-x:auto">
      <table class="settings-table" style="min-width:500px">
        <thead><tr style="font-size:.65rem;text-transform:uppercase;letter-spacing:1px;color:var(--t3)"><td>User</td><td>Role</td><td>Joined</td><td>Last Login</td><td></td></tr></thead>
        <tbody>${data.users.map(u => `<tr>
          <td><div style="font-weight:600;font-size:.78rem">${u.name || '—'}</div><div style="font-size:.65rem;color:var(--t3)">${u.email}</div></td>
          <td><span class="pill pill-${u.role === 'admin' ? 'gold' : 'blue'}">${u.role}</span></td>
          <td style="font-size:.7rem;color:var(--t3)">${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
          <td style="font-size:.7rem;color:var(--t3)">${u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString() : 'Never'}</td>
          <td style="text-align:right"><button class="btn btn-sm btn-outline" onclick="toggleUserRole('${u.id}','${u.role}')">${u.role === 'admin' ? 'Demote' : 'Make Admin'}</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  } catch (e) {
    container.innerHTML = `<h3 class="card-title">Admin Panel</h3><p class="page-desc" style="color:var(--red)">${e.message}</p>`;
  }
}

async function toggleUserRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  if (!confirm(`Change this user's role to "${newRole}"?`)) return;

  const client = getSupabase();
  const { data: { session } } = await client.auth.getSession();

  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'set-role', userId, role: newRole })
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    loadAdminUsers();
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuth();

  // Sidebar nav
  document.querySelectorAll('.sb-item[data-view]').forEach(b =>
    b.addEventListener('click', () => switchView(b.dataset.view))
  );

  // Mobile nav
  document.querySelectorAll('.mn-item[data-view]').forEach(b =>
    b.addEventListener('click', () => switchView(b.dataset.view))
  );

  // Topbar menu (mobile)
  const tbMenu = document.getElementById('tbMenu');
  if (tbMenu) tbMenu.addEventListener('click', openSidebar);

  // Sidebar overlay
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Logout
  const logoutBtn = document.getElementById('sbLogout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (typeof signOut === 'function') signOut();
    else window.location.href = 'auth.html';
  });

  // Init modules
  animateCounters();
  initSubstanceSearch();
  if (typeof initESDSGenerator === 'function') initESDSGenerator();
  initCopilot();
  renderAlerts('fullAlertsList');

  // AI panel
  const copilotToggle = document.getElementById('copilotToggle');
  if (copilotToggle) copilotToggle.addEventListener('click', toggleCopilot);
  const copilotSend = document.getElementById('copilotSend');
  if (copilotSend) copilotSend.addEventListener('click', sendCopilotMessage);

  // AI suggestions
  document.querySelectorAll('.ai-sug').forEach(s =>
    s.addEventListener('click', () => askCopilot(s.textContent))
  );

  // Auto-resize AI input
  const aiInput = document.getElementById('copilotInput');
  if (aiInput) {
    aiInput.addEventListener('input', () => {
      aiInput.style.height = 'auto';
      aiInput.style.height = Math.min(aiInput.scrollHeight, 100) + 'px';
    });
  }
});
