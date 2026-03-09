export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Not configured' });

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller || caller.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action, userId, role } = req.body || {};

    if (action === 'list-users') {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) return res.status(500).json({ error: error.message });
      const safe = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.user_metadata?.name || '',
        role: u.user_metadata?.role || 'user',
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at
      }));
      return res.status(200).json({ users: safe });
    }

    if (action === 'set-role') {
      if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'delete-user') {
      if (!userId) return res.status(400).json({ error: 'userId required' });
      if (userId === caller.id) return res.status(400).json({ error: 'Cannot delete yourself' });
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
