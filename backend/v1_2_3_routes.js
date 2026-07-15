// v1.2.3 EXE compatible + Admin Ops with Supabase persistence
module.exports = function(app, getSupa, taskStore, operatorTokens) {
  app.get('/api/tasks/reset', function(req, res) {
    var hostId = req.query.host_id;
    if (hostId) {
      taskStore[hostId] = [];
      res.json({ success: true, message: 'Tasks cleared for ' + hostId });
    } else {
      res.json({ success: false, error: 'host_id required' });
    }
  });


  // === Supabase-backed Admin Ops ===
  app.get('/api/admin/ops', async function(req, res) {
    try {
      var s = getSupa();
      var { data } = await s.from('operator_tokens').select('*').order('created', { ascending: false });
      var ops = (data || []).map(function(o) {
        return { name: o.name, token: o.token, active: o.active !== false, daily_limit: o.daily_limit || 100, valid_days: o.valid_days || 30, created: o.created };
      });
      res.json({ success: true, operators: ops });
    } catch(e) { res.json({ success: true, operators: Array.from(operatorTokens.values()) }); }
  });

  app.post('/api/admin/ops', async function(req, res) {
    try {
      var { name, daily_limit, valid_days } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name required' });
      var crypto = require('crypto');
      var token = 'wc_op_' + crypto.randomBytes(24).toString('hex');
      var op = { token: token, name: name, daily_limit: parseInt(daily_limit) || 100, valid_days: parseInt(valid_days) || 30, created: new Date().toISOString(), active: true };
      
      var s = getSupa();
      await s.from('operator_tokens').insert(op);
      
      operatorTokens.set(token, { name: name, token: token, daily_limit: op.daily_limit, valid_days: op.valid_days, created: op.created, active: true, status: 'active', quota: op.daily_limit, permissions: ['comment','like'], quota_date: new Date().toISOString().split('T')[0], used_today: 0 });
      
      res.json({ success: true, operator: op });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/admin/ops/:token', async function(req, res) {
    try {
      var token = req.params.token;
      var { active, daily_limit, valid_days } = req.body || {};
      var update = {};
      if (active !== undefined) update.active = active;
      if (daily_limit) update.daily_limit = parseInt(daily_limit);
      if (valid_days) update.valid_days = parseInt(valid_days);
      
      var s = getSupa();
      await s.from('operator_tokens').update(update).eq('token', token);
      
      var op = operatorTokens.get(token);
      if (op) {
        if (active !== undefined) { op.active = active; op.status = active ? 'active' : 'suspended'; }
        if (daily_limit) op.daily_limit = parseInt(daily_limit);
        if (valid_days) op.valid_days = parseInt(valid_days);
      }
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/admin/ops/:token', async function(req, res) {
    try {
      var token = req.params.token;
      var s = getSupa();
      await s.from('operator_tokens').delete().eq('token', token);
      operatorTokens.delete(token);
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // === v1.2.3 Compat ===
  app.get('/api/hosts/register', function(req, res) {
    var hostId = req.query.host_id;
    if (!hostId) return res.status(400).json({ error: 'host_id required' });
    if (!taskStore[hostId]) taskStore[hostId] = [];
    res.json({ success: true, host_id: hostId, status: 'registered' });
  });

  app.get('/api/tasks/generate', async function(req, res) {
    try {
      var hostId = req.query.host_id || 'rachelliyagtha03';
      var limit = parseInt(req.query.limit) || 30;
      if (!taskStore[hostId]) taskStore[hostId] = [];
      var s = getSupa();
      var { data: whales } = await s.from('whale_profiles').select('*').order('total_gifts', { ascending: false }).limit(limit);
      if (!whales || !whales.length) return res.json({ success: true, count: 0 });
      
      var { data: templates } = await s.from('script_templates').select('content').eq('lang', 'id').limit(50);
      
      var existing = new Set((taskStore[hostId] || []).map(function(t) { return t.profileId; }));
      var count = 0;
      for (var i = 0; i < whales.length; i++) {
        var w = whales[i];
        if (existing.has(w.username)) continue;
        
        var persona = w.persona || 'recognizer';
        var pool = (templates || []).length > 0 ? templates : [{ content: 'Hai ' + (w.nickname || w.username) + '! Mampir ke live kita ya! 🔥' }];
        var picked = pool[Math.floor(Math.random() * pool.length)];
        var text = (picked.content || 'Hai! 🔥').replace(/\{whale\}/g, w.nickname || w.username).replace(/\{host\}/g, hostId);
        
        taskStore[hostId].push({
          id: 't_' + Date.now() + '_' + count, taskId: 't_' + Date.now() + '_' + count,
          host_id: hostId, profileId: w.username, videoUrl: 'https://www.tiktok.com/@' + w.username,
          commentText: text, whale_persona: persona, status: 'pending', created_at: new Date().toISOString()
        });
        existing.add(w.username); count++;
      }
      res.json({ success: true, count: count });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
};
