// v1.2.3 EXE compatible endpoints
module.exports = function(app, getSupa, taskStore, operatorTokens) {
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
          commentText: 'Hai ' + (w.nickname || w.username) + '! Mampir ke live ya \\u{1F525}',
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
};
