/* Supabase Auth — config loaded from env via API, with local fallback */

const SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

let _supabaseClient = null;
let _authReady = false;

async function loadSupabaseConfig() {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-config' })
    });
    if (res.ok) {
      const data = await res.json();
      SUPABASE_CONFIG.url = data.url;
      SUPABASE_CONFIG.anonKey = data.anonKey;
      return true;
    }
  } catch (e) { /* API not available */ }
  return false;
}

function initSupabase(url, anonKey) {
  if (_supabaseClient) return _supabaseClient;
  const u = url || SUPABASE_CONFIG.url;
  const k = anonKey || SUPABASE_CONFIG.anonKey;
  if (!u || !k) return null;
  _supabaseClient = window.supabase.createClient(u, k);
  return _supabaseClient;
}

function getSupabase() {
  return _supabaseClient;
}

async function checkAuth() {
  const loaded = await loadSupabaseConfig();
  if (!loaded || !SUPABASE_CONFIG.url) {
    _authReady = true;
    return null;
  }
  const client = initSupabase();
  if (!client) { _authReady = true; return null; }

  const { data: { session } } = await client.auth.getSession();
  _authReady = true;
  if (!session) {
    window.location.href = 'auth.html';
    return null;
  }
  return session.user;
}

async function getUserProfile() {
  const client = getSupabase();
  if (!client) return null;
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    role: user.user_metadata?.role || 'user'
  };
}

async function signOut() {
  const client = getSupabase();
  if (client) await client.auth.signOut();
  window.location.href = 'auth.html';
}

async function isAdmin() {
  const client = getSupabase();
  if (!client) return false;
  const { data: { user } } = await client.auth.getUser();
  return user?.user_metadata?.role === 'admin';
}
