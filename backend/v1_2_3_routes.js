// v1.2.3 EXE compatible endpoints
module.exports = function(app, getSupa, taskStore, operatorTokens) {
  // Sync Supabase operators into in-memory store on startup
  (async function() {
    try {
      var s = getSupa();
      var result = await s.from('operator_tokens').select('*');
      var data = result.data || [];
      if (data.length) {
        data.forEach(function(o) {
          if (o.token && !operatorTokens.has(o.token)) {
            operatorTokens.set(o.token, {
              name: o.name, token: o.token,
              daily_limit: o.daily_limit || 100,
              valid_days: o.valid_days || 30,
              quota: o.daily_limit || 100,
              status: o.active !== false ? 'active' : 'suspended',
              created: o.created || new Date().toISOString(),
              active: o.active !== false,
              permissions: ['comment', 'like'],
              quota_date: new Date().toISOString().split('T')[0],
              used_today: 0
            });
          }
        });
        console.log('[V1.2.3] Synced ' + data.length + ' operators from Supabase to memory');
      }
    } catch(e) { console.log('[V1.2.3] Supabase sync error:', e.message); }
  })();

  app.get('/api/tasks/generate', async function(req, res) {
    try {
      var hostId = req.query.host_id || 'h_1783502518392';
      var token = req.query.token;
      if (token) { var op = operatorTokens.get(token); if (!op || op.active === false) return res.status(403).json({ error: 'Invalid token' }); }
      var limit = parseInt(req.query.limit) || 30;
      if (!taskStore[hostId]) taskStore[hostId] = [];
      var s = getSupa();
      var result = await s.from('whale_profiles').select('*').order('total_gifts', { ascending: false }).limit(limit);
      var whales = result.data || [];
      var existing = new Set((taskStore[hostId] || []).map(function(t) { return t.profileId; }));
      var count = 0;
      for (var i = 0; i < whales.length; i++) {
        var w = whales[i];
        if (existing.has(w.username)) continue;
        taskStore[hostId].push({
          id: 't_' + Date.now() + '_' + count, taskId: 't_' + Date.now() + '_' + count,
          host_id: hostId, profileId: w.username, videoUrl: 'https://www.tiktok.com/@' + w.username,
          commentText: 'Hai ' + (w.nickname || w.username) + '! Mampir ke live ya!',
          status: 'pending', created_at: new Date().toISOString()
        });
        existing.add(w.username); count++;
      }
      res.json({ success: true, count: count });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/hosts/register', function(req, res) {
    var hostId = req.query.host_id;
    if (!hostId) return res.status(400).json({ error: 'host_id required' });
    if (!taskStore[hostId]) taskStore[hostId] = [];
    res.json({ success: true, host_id: hostId, status: 'registered' });
  });

  app.get('/api/operator/validate', async function(req, res) {
    var token = req.query.token;
    if (!token) return res.json({ success: false, error: 'Token required' });
    var op = operatorTokens.get(token);
    if (!op) {
      try {
        var s = getSupa();
        var result = await s.from('operator_tokens').select('*').eq('token', token).limit(1);
        var data = result.data || [];
        if (data.length > 0) {
          var o = data[0];
          if (o.active === false) return res.json({ success: false, error: 'Token suspended' });
          op = { name: o.name, token: o.token, status: 'active', quota: o.daily_limit || 100, remaining_today: o.daily_limit || 100, permissions: ['comment', 'like'] };
          operatorTokens.set(token, op);
        }
      } catch(e) {}
    }
    if (!op || op.status !== 'active') return res.json({ success: false, error: 'Invalid token' });
    res.json({ success: true, operator: { name: op.name, status: op.status, quota: op.quota || 100, remaining_today: op.remaining_today || 100, permissions: op.permissions || ['comment', 'like'] } });
  });
};
