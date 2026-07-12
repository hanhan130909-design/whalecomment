/** WhaleComment Backend v1.2.3 - NO EXTERNAL DEPENDENCIES */
require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const PORT = process.env.PORT || 3102;
const app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sxsmjfkxllepntgzfqbl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
let supa = null;

function getSupa() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return getSupaAnon();
  if (!supa) supa = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  return supa;
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4c21qZmt4bGxlcG50Z3pxYmwiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY1MTg2NjAyMCwiZXhwIjoxOTY3NDQyMDIwfQ.36-SD3W7c1rT94rH5XMB7PbQ7K8LvSsLXLYjvjapolU0';
let supaAnon = null;

function getSupaAnon() {
  if (!supaAnon) supaAnon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  return supaAnon;
}

const CURRENT_VERSION = '1.2.3';
const RELEASES_DIR = path.join(__dirname, 'public', 'releases');
if (!fs.existsSync(RELEASES_DIR)) fs.mkdirSync(RELEASES_DIR, { recursive: true });

// INLINE SCRIPTS
var SCRIPTS_ID = [
  'Kak {whale}, {host} lagi live nih! Gas terus !',
  'Eh jagoan! {host} butuh support kamu nih !',
  'Kak {whale} special guest kita! {host} ada surprise buat kamu !',
  'VIP alert! {host} nungguin kamu nih Kak {whale} !',
  'Kak {whale}, {host} lagi mega live! Ada gift spesial !',
  'Sultan {whale}, {host} live sekarang! Hadiah besar menanti !',
  '{whale}, {host} ada sesuatu yang bikin penasaran nih !',
  'Penasaran? {host} ada surprise spesial! Cek sekarang !',
  '{host} kangen sama kamu Kak {whale}! Mampir dong !',
  'Bestie {whale}! {host} lagi live, rame banget !',
  'Kak {whale} baik hati! {host} pengen kasih shoutout buat kamu !',
  'Wow {whale}, {host} live sekarang! Gift kamu selalu bikin dia senang !',
  'Kak {whale}, {host} lagi live seru! Mampir yuk !',
  '{host} live sekarang Kak {whale}! Jangan ketinggalan !',
  'Yuk mampir ke live {host}! Ditunggu ya !',
  'Jangan lupa mampir ke live {host} ya Kak {whale} !'
];

var SCRIPTS_EN = [
  "Hey {whale}! {host} is live right now! Come hang out !",
  "What is up {whale}! {host} needs your support in the live stream !",
  "Hey {whale}! You are our special guest tonight on {host} live !",
  "VIP alert! {host} has been waiting for you, {whale} !",
  "Hey {whale}! {host} is doing a mega live stream with special gifts !",
  "Sultan {whale}! {host} is live right now! Big prizes await !",
  "Hey {whale}! {host} has something exciting in store for you !",
  "Curious? {host} is live with amazing surprises! Check it out !",
  "Hey {whale}! {host} misses you! Come hang out !",
  "Bestie {whale}! {host} is live and the vibes are amazing !",
  "Hey {whale}! {host} wants to give you a special shoutout !",
  "Wow {whale}! {host} is live right now! Your gifts always make their day !",
  "Hey {whale}! Come join {host} live stream! Let us go !",
  "{host} is live right now, {whale}! Do not miss out !",
  "Come hang out at {host} live! See you there !",
  "Do not forget to check out {host} live, {whale} !"
];

var WHALES = [
  { username: 'the_real_dk28', nickname: 'DK', region: 'ID' },
  { username: 'unstoppable_k1ng', nickname: 'King', region: 'ID' },
  { username: 'toxictasha_2024', nickname: 'Tasha', region: 'ID' },
  { username: 'blessedqueen_x', nickname: 'Queen', region: 'ID' },
  { username: 'goldenboy_donatello', nickname: 'Don', region: 'ID' },
  { username: 'sultan_streamer22', nickname: 'Sultan', region: 'MY' },
  { username: 'malay_royalz', nickname: 'Roy', region: 'MY' },
  { username: 'billionairebabe', nickname: 'Babe', region: 'US' },
  { username: 'nyc_bigballer', nickname: 'NYC', region: 'US' },
  { username: 'richvibes_only', nickname: 'Rich', region: 'ID' }
];

function getScript(lang, hostName, whaleName) {
  var pool = lang === 'en' ? SCRIPTS_EN : SCRIPTS_ID;
  var s = pool[Math.floor(Math.random() * pool.length)];
  return s.replace(/\{host\}/g, hostName || 'kita').replace(/\{whale\}/g, whaleName || 'Kak');
}

// ROUTES
app.get('/', function(req, res) { res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); });
app.get('/api', function(req, res) { res.json({ service: 'WhaleComment API', version: CURRENT_VERSION }); });
app.get('/api/version/latest', function(req, res) {
  res.json({
    success: true,
    version: CURRENT_VERSION,
    releaseDate: new Date().toISOString(),
    downloadUrl: 'https://github.com/hanhan130909-design/whalecomment/releases/download/v1.1.7/WhaleComment-1.1.7-Portable.zip',
    forceUpdate: false
  });
});
app.get('/api/download/latest', function(req, res) {
  var portableZip = path.join(RELEASES_DIR, 'WhaleComment-1.1.7-Portable.zip');
  if (fs.existsSync(portableZip)) return res.download(portableZip);
  res.status(404).json({ error: 'Download file not found' });
});
app.get('/api/_debug/status', function(req, res) {
  res.json({
    version: CURRENT_VERSION,
    operators: operatorTokens.size,
    hostKeys: Object.keys(hostStore),
    taskKeys: Object.keys(taskStore),
    uptime: Math.floor(process.uptime())
  });
});

const ADMIN_TOKEN = 'wc_admin_2026_secret_token';
const operatorTokens = new Map();
const OPERATORS_FILE = path.join(__dirname, 'operators.json');

// Load operators asynchronously
getSupaAnon().from('comment_operators').select('*').then(function(r) {
  if (r.data && r.data.length) {
    r.data.forEach(function(o) {
      if (o.token) {
        var vd = o.valid_days || 30;
        var created = new Date(o.created_at || Date.now());
        var expiresAt = new Date(created.getTime() + vd * 86400000);
        operatorTokens.set(o.token, {
          id: o.id,
          name: o.display_name || o.name || 'Operator',
          token: o.token,
          quota: o.daily_limit || o.quota || 100,
          daily_limit: o.daily_limit || o.quota || 100,
          valid_days: vd,
          created: created.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: (o.active === false) ? 'suspended' : 'active',
          used_today: 0,
          remaining_today: o.daily_limit || o.quota || 100,
          permissions: o.permissions || ['comment', 'like'],
          active: o.active !== false
        });
      }
    });
  }
  console.log('[ADMIN] Loaded', operatorTokens.size, 'operators from Supabase');
}).catch(function(e) {
  console.log('[ADMIN] Supabase load failed:', e.message);
}).finally(function() {
  try {
    if (fs.existsSync(OPERATORS_FILE)) {
      var data = JSON.parse(fs.readFileSync(OPERATORS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(function(op) {
          if (op.token && !operatorTokens.has(op.token)) {
            operatorTokens.set(op.token, op);
          }
        });
      }
    }
  } catch(ex) {}
  console.log('[ADMIN] Operators ready:', operatorTokens.size);
});

function saveOperatorsToFile() {
  try {
    fs.writeFileSync(OPERATORS_FILE, JSON.stringify(Array.from(operatorTokens.values()), null, 2));
  } catch(e) {}
}

function authAdmin(req, res, next) {
  var tok = req.headers['authorization'] || req.headers['x-admin-token'] || req.query.admin_token;
  if (!tok || tok !== ADMIN_TOKEN) return res.status(403).json({ error: 'Admin access required' });
  next();
}

function validateOperatorToken(req, res, next) {
  var tok = req.query.token || req.headers['x-auth-token'] || (req.body && req.body.token);
  if (!tok) return res.status(401).json({ error: 'Token required' });
  var op = operatorTokens.get(tok);
  if (!op) return res.status(403).json({ error: 'Invalid token' });
  if (op.active === false) return res.status(403).json({ error: 'Token suspended' });
  req.operator = op;
  req.operatorToken = tok;
  next();
}

function genToken() {
  return 'wc_op_' + require('crypto').randomBytes(24).toString('hex');
}

app.post('/api/admin/operators', authAdmin, function(req, res) {
  var name = req.body.name, quota = req.body.quota;
  if (!name) return res.status(400).json({ error: 'Name required' });
  var token = genToken();
  var op = { id: 'op_' + Date.now(), name: name, token: token, status: 'active', quota: quota || 100, used_today: 0, created: new Date().toISOString() };
  operatorTokens.set(token, op);
  saveOperatorsToFile();
  getSupa().from('comment_operators').upsert({ email: token + '@op.wc', display_name: name, token: token, daily_limit: quota || 100, active: true }).then(function(){}).catch(function(e){});
  res.json({ success: true, operator: { name: op.name, token: op.token, quota: op.quota, status: op.status, created: op.created } });
});

app.get('/api/admin/operators', authAdmin, function(req, res) {
  res.json({
    success: true,
    operators: Array.from(operatorTokens.values()).map(function(op) {
      return { name: op.name, token: op.token, daily_limit: op.daily_limit || 100, active: op.active !== false };
    }),
    total: operatorTokens.size
  });
});

app.patch('/api/admin/operators/:token', authAdmin, function(req, res) {
  var op = operatorTokens.get(req.params.token);
  if (!op) return res.status(404).json({ error: 'Operator not found' });
  if (req.body.status !== undefined) { op.status = req.body.status; op.active = (req.body.status === 'active'); }
  if (req.body.quota !== undefined) op.quota = req.body.quota;
  saveOperatorsToFile();
  res.json({ success: true });
});

app.delete('/api/admin/operators/:token', authAdmin, function(req, res) {
  operatorTokens.delete(req.params.token);
  saveOperatorsToFile();
  res.json({ success: true });
});

app.get('/api/operator/validate', validateOperatorToken, function(req, res) {
  var op = req.operator;
  res.json({
    success: true,
    operator: { id: op.id, name: op.name, status: op.status || 'active', quota: op.daily_limit || 100, remaining_today: (op.daily_limit || 100) - (op.used_today || 0), permissions: op.permissions || ['comment', 'like'] }
  });
});

app.get('/api/health', function(req, res) {
  getSupa().from('comment_tasks').select('*', { count: 'exact', head: true }).then(function(r) {
    res.json({ ok: true, db: 'connected', tasks: r.count, operators: operatorTokens.size, version: CURRENT_VERSION });
  }).catch(function() {
    res.json({ ok: true, operators: operatorTokens.size, version: CURRENT_VERSION });
  });
});

const hostStore = {};
app.get('/api/hosts', function(req, res) {
  var hosts = Object.values(hostStore).flat();
  res.json({ success: true, hosts: hosts.map(function(h) { return { id: h.id, tiktok_username: h.tiktok_username, status: h.status || 'offline', daily_comment_count: h.daily_comment_count || 0 }; }) });
});

app.post('/api/hosts', function(req, res) {
  var opId = req.body.operator_id, tu = req.body.tiktok_username, dn = req.body.display_name;
  if (!opId || !tu) return res.status(400).json({ error: 'operator_id and tiktok_username required' });
  if (!hostStore[opId]) hostStore[opId] = [];
  var h = { id: 'h_' + Date.now(), operator_id: opId, tiktok_username: tu, display_name: dn || tu, host_token: require('crypto').randomBytes(16).toString('hex'), status: 'offline', daily_comment_count: 0 };
  hostStore[opId].push(h);
  res.json({ success: true, host: h });
});

app.post('/api/hosts/:id/session', function(req, res) {
  var hid = req.params.id;
  if (hid && !hid.startsWith('h_')) {
    for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
      var f = ops[oi].find(function(x) { return x.tiktok_username === hid; });
      if (f) { hid = f.id; break; }
    }
  }
  var ts = req.body.tiktok_session, dn = req.body.display_name;
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var h = ops[oi].find(function(x) { return x.id === hid || x.tiktok_username === hid; });
    if (h) { h.status = 'online'; if (ts) h.tiktok_session = ts; if (dn) h.display_name = dn; break; }
  }
  res.json({ success: true });
});

app.post('/api/hosts/:id/start', function(req, res) {
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var h = ops[oi].find(function(x) { return x.id === req.params.id; });
    if (h) { h.status = 'running'; h.started_at = new Date().toISOString(); break; }
  }
  res.json({ success: true });
});

app.post('/api/hosts/:id/stop', function(req, res) {
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var h = ops[oi].find(function(x) { return x.id === req.params.id; });
    if (h) { h.status = 'online'; break; }
  }
  res.json({ success: true });
});

app.patch('/api/hosts/:id', function(req, res) {
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var h = ops[oi].find(function(x) { return x.id === req.params.id; });
    if (h) { Object.assign(h, req.body || {}); break; }
  }
  res.json({ success: true });
});

const taskStore = {};

// GENERATE TASKS - main worker endpoint
app.post('/api/hosts/:id/generate-tasks', function(req, res) {
  var hostId = req.params.id;
  var token = req.query.token || (req.body && req.body.token);
  var limit = parseInt(req.body && req.body.limit) || 10;

  if (!token) return res.status(401).json({ error: 'Token required' });
  var auth = operatorTokens.get(token);
  if (!auth) return res.status(401).json({ error: 'Invalid token' });
  if (auth.active === false) return res.status(403).json({ error: 'Token suspended' });

  var host = null;
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var f = ops[oi].find(function(h) { return h.id === hostId || h.tiktok_username === hostId; });
    if (f) { host = f; break; }
  }

  var idCount = Math.floor(limit * 0.60);
  var myCount = Math.floor(limit * 0.30);
  var usCount = limit - idCount - myCount;

  var allW = WHALES.filter(function(w) { return w.region === 'ID'; }).slice(0, idCount);
  allW = allW.concat(WHALES.filter(function(w) { return w.region === 'MY'; }).slice(0, myCount));
  allW = allW.concat(WHALES.filter(function(w) { return w.region === 'US'; }).slice(0, usCount));

  // Shuffle
  for (var i = allW.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = allW[i]; allW[i] = allW[j]; allW[j] = tmp;
  }
  if (!allW.length) allW = WHALES.slice(0, limit);

  if (!taskStore[hostId]) taskStore[hostId] = [];

  var existNames = {};
  for (var ti = 0; ti < taskStore[hostId].length; ti++) {
    var t = taskStore[hostId][ti];
    existNames[t.profileId || t.username || t.whale_username] = 1;
  }

  var count = 0;
  var hostName = (host && (host.display_name || host.tiktok_username)) || 'kita';
  var personas = ['challenger', 'vip', 'high_spender', 'comprehensive'];

  for (var wi = 0; wi < allW.length; wi++) {
    var w = allW[wi];
    if (existNames[w.username]) continue;
    if (count >= limit) break;
    var region = w.region || 'ID';
    var lang = (region === 'US') ? 'en' : 'id';
    var persona = personas[Math.floor(Math.random() * personas.length)];
    var scriptText = getScript(lang, hostName, w.nickname || w.username);
    taskStore[hostId].push({
      id: 't_' + Date.now() + '_' + count,
      profileId: w.username,
      username: w.username,
      whale_username: w.username,
      videoUrl: 'https://www.tiktok.com/@' + w.username,
      script: scriptText,
      lang: lang,
      region: region,
      whale_persona: persona,
      status: 'pending',
      priority: 50
    });
    existNames[w.username] = 1;
    count++;
  }

  res.json({ success: true, count: count, total: allW.length, source: 'inline' });
});

app.post('/api/tasks/batch', function(req, res) {
  var hid = req.body.host_id, wus = req.body.whale_usernames;
  if (!hid || !wus || !wus.length) return res.status(400).json({ error: 'host_id and whale_usernames required' });
  if (!taskStore[hid]) taskStore[hid] = [];
  var exist = {};
  for (var ti = 0; ti < taskStore[hid].length; ti++) {
    var t = taskStore[hid][ti];
    exist[t.whale_username || t.profileId] = 1;
  }
  var count = 0;
  for (var ui = 0; ui < wus.length; ui++) {
    var u = wus[ui];
    if (exist[u]) continue;
    taskStore[hid].push({ id: 't_' + Date.now() + '_' + count, host_id: hid, profileId: u, whale_username: u, videoUrl: 'https://www.tiktok.com/@' + u, whale_persona: 'comprehensive', status: 'pending', priority: 50 });
    exist[u] = 1;
    count++;
  }
  res.json({ success: true, count: count, skipped: wus.length - count });
});

app.get('/api/tasks/next', validateOperatorToken, function(req, res) {
  var hid = req.query.host_id;
  req.operator.used_today = req.operator.used_today || 0;
  var tasks = (taskStore[hid] || []).filter(function(t) { return t.status === 'pending' || t.status === 'ready'; }).slice(0, parseInt(req.query.limit) || 5);
  res.json({ success: true, tasks: tasks });
});

app.patch('/api/tasks/:id', function(req, res) {
  var tok = req.query.token;
  if (tok) {
    var op = operatorTokens.get(tok);
    if (!op || op.active === false) return res.status(403).json({ error: 'Invalid token' });
  }
  for (var keys = Object.keys(taskStore), ki = 0; ki < keys.length; ki++) {
    var tasks = taskStore[keys[ki]];
    for (var ti = 0; ti < tasks.length; ti++) {
      var t = tasks[ti];
      if (t.id === req.params.id) {
        Object.assign(t, req.body || {});
        if (req.body.status === 'completed') {
          for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
            var h = ops[oi].find(function(x) { return x.id === keys[ki]; });
            if (h) { h.daily_comment_count = (h.daily_comment_count || 0) + 1; break; }
          }
        }
        res.json({ success: true });
        return;
      }
    }
  }
  res.json({ success: true });
});

app.get('/api/tasks/progress', function(req, res) {
  var hid = req.query.host_id;
  var tasks = taskStore[hid] || [];
  var done = 0, fail = 0, pend = 0;
  for (var ti = 0; ti < tasks.length; ti++) {
    var t = tasks[ti];
    if (t.status === 'completed') done++;
    else if (t.status === 'failed') fail++;
    else pend++;
  }
  res.json({ success: true, total: tasks.length, completed: done, failed: fail, pending: pend });
});

app.post('/api/hosts/:id/regenerate-token', function(req, res) {
  var nt = require('crypto').randomBytes(16).toString('hex');
  for (var ops = Object.values(hostStore), oi = 0; oi < ops.length; oi++) {
    var h = ops[oi].find(function(x) { return x.id === req.params.id; });
    if (h) { h.host_token = nt; res.json({ success: true, host_token: nt }); return; }
  }
  res.status(404).json({ error: 'host not found' });
});

app.get('/api/verify-token', function(req, res) {
  var tok = req.query.token;
  if (!tok) return res.json({ valid: false });
  var op = operatorTokens.get(tok);
  if (!op) return res.json({ valid: false, error: 'Invalid token' });
  if (op.active === false) return res.json({ valid: false, error: 'Token suspended' });
  res.json({ valid: true, name: op.name, daily_limit: op.daily_limit });
});

app.listen(PORT, function() {
  console.log('[WhaleComment] API v' + CURRENT_VERSION + ' running on port ' + PORT);
  console.log('[WhaleComment] Operators ready: ' + operatorTokens.size);
  console.log('[WhaleComment] Scripts: ' + SCRIPTS_ID.length + ' ID + ' + SCRIPTS_EN.length + ' EN inline');
});
