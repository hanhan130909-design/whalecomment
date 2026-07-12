/**
 * WhaleComment Backend API
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const PORT = process.env.PORT || 3102;
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sxsmjfkxllepntgzfqbl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
let supa = null;
function getSupa() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[getSupa] WARNING: SUPABASE_URL or SUPABASE_KEY not set, using anon client');
    return getSupaAnon();
  }
  if (!supa) supa = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return supa;
}

const ARK_API_KEY = process.env.ARK_API_KEY || '';
const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_MODEL = process.env.ARK_MODEL || 'doubao-smart-router-250928';

// ============================================================
// DOWNLOAD & VERSION MANAGEMENT
// ============================================================
const CURRENT_VERSION = '1.2.1';
const DEFAULT_SCRIPTS = require('./default_scripts.js');
const API = 'https://prolific-adventure-production-9b13.up.railway.app';
const RELEASES_DIR = path.join(__dirname, 'public', 'releases');

if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

const downloadStats = {};

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); });
app.get('/api', (req, res) => { res.json({ service: 'WhaleComment API', version: '1.1.8' }); });

app.get('/api/version/latest', (req, res) => {
  res.json({
    success: true,
    version: CURRENT_VERSION,
    releaseDate: new Date().toISOString(),
    downloadUrl: 'https://github.com/hanhan130909-design/whalecomment/releases/download/v1.1.7/WhaleComment-1.1.7-Portable.zip',
    releaseNotes: [
      'BUG FIX: likeVideo() found the like button but NEVER clicked it - like count stuck at 0',
      'Fixed: now executes real page.click() on like button + verifies red fill (#fe2c55) after click',
      'Commenting logic unchanged (v1.1.6 was correct)'
    ],
    forceUpdate: false
  });
});

app.get('/api/download/latest', (req, res) => {
  const operatorName = req.query.operator || 'unknown';
  const downloadKey = operatorName + '_' + new Date().toISOString().split('T')[0];
  downloadStats[downloadKey] = (downloadStats[downloadKey] || 0) + 1;
  console.log('[DOWNLOAD]', operatorName, 'downloaded version', CURRENT_VERSION);

  const portableZip = path.join(RELEASES_DIR, 'WhaleComment-1.1.7-Portable.zip');
  if (fs.existsSync(portableZip)) {
    return res.download(portableZip, 'WhaleComment-1.1.6-Portable.zip');
  }
  res.status(404).json({ error: 'Download file not found', version: CURRENT_VERSION });
});

// ============================================================
// OPERATOR TOKEN PERMISSION SYSTEM
// ============================================================
const ADMIN_TOKEN = 'wc_admin_2026_secret_token'; // Fixed for client/admin.html compatibility
console.log('[ADMIN] Using fixed admin token (env ignored)');
const operatorTokens = new Map();
const OPERATORS_FILE = path.join(__dirname, 'operators.json');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4c21qZmt4bGxlcG50Z3pxYmwiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY1MTg2NjAyMCwiZXhwIjoxOTY3NDQyMDIwfQ.36-SD3W7c1rT94rH5XMB7PbQ7K8LvSsLXLYjvjapolU0';
let supaAnon = null;
function getSupaAnon() {
  if (!supaAnon) supaAnon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return supaAnon;
}

(async function loadOperators() {
  try {
    var s = getSupaAnon();
    var r = await s.from('comment_operators').select('*');
    if (r.data && r.data.length) {
      r.data.forEach(function(o) {
        if (o.token) {
          var validDays = o.valid_days || 30;
          var created = new Date(o.created_at || Date.now());
          var expiresAt = new Date(created.getTime() + validDays * 86400000);
          operatorTokens.set(o.token, {
            id: o.id,
            name: o.display_name || o.name || 'Operator',
            token: o.token,
            quota: o.daily_limit || o.quota || 100,
            daily_limit: o.daily_limit || o.quota || 100,
            valid_days: validDays,
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
      console.log('[ADMIN] Loaded', r.data.length, 'operators from Supabase');
    }
  } catch(e) { console.log('[ADMIN] Supabase load failed:', e.message); }

  try {
    if (fs.existsSync(OPERATORS_FILE)) {
      var data = JSON.parse(fs.readFileSync(OPERATORS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach(function(op) {
          if (op.token && !operatorTokens.has(op.token)) {
            if (!op.expires_at && op.valid_days && op.created) {
              var created = new Date(op.created);
              if (!isNaN(created.getTime())) {
                op.expires_at = new Date(created.getTime() + op.valid_days * 86400000).toISOString();
              }
            }
            operatorTokens.set(op.token, op);
          }
        });
        console.log('[ADMIN] File fallback: total', operatorTokens.size, 'operators');
      }
    }
  } catch(e) { console.log('[ADMIN] File error:', e.message); }
  console.log('[ADMIN] Operators ready:', operatorTokens.size);
})();

function saveOperatorsToFile() {
  try {
    fs.writeFileSync(OPERATORS_FILE, JSON.stringify(Array.from(operatorTokens.values()), null, 2), 'utf8');
  } catch(e) { console.log('[ADMIN] File save error:', e.message); }
}

function authAdmin(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-admin-token'] || req.query.admin_token;
  if (!token || token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Admin access required' });
  next();
}

function validateOperatorToken(req, res, next) {
  const token = req.query.token || req.headers['x-auth-token'] || req.body && req.body.token;
  if (!token) return res.status(401).json({ error: 'Token required', code: 'TOKEN_REQUIRED' });
  const operator = operatorTokens.get(token);
  if (!operator) return res.status(403).json({ error: 'Invalid token', code: 'TOKEN_INVALID' });
  if (operator.active === false) return res.status(403).json({ error: 'Token suspended', code: 'TOKEN_SUSPENDED' });
  if (operator.valid_days && operator.created) {
    var created = new Date(operator.created);
    if (!isNaN(created.getTime())) {
      var expires = new Date(created.getTime() + operator.valid_days * 86400000);
      if (Date.now() > expires.getTime()) {
        operator.active = false;
        saveOperatorsToFile();
        return res.status(403).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
    }
  }
  req.operator = operator;
  req.operatorToken = token;
  next();
}

function generateSecureToken() {
  const crypto = require('crypto');
  return 'wc_op_' + crypto.randomBytes(24).toString('hex');
}

// ============================================================
// ADMIN API: Operator Management
// ============================================================
app.post('/api/admin/operators', authAdmin, async (req, res) => {
  try {
    const { name, quota, permissions, expires_days, email } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const token = generateSecureToken();
    const expiresDays = expires_days || 30;
    const operator = {
      id: 'op_' + Date.now(),
      name, email: email || '', token,
      status: 'active',
      quota: quota || 100,
      used_today: 0,
      quota_date: new Date().toISOString().split('T')[0],
      total_used: 0,
      permissions: permissions || ['comment', 'like'],
      created_at: Date.now(),
      expires_at: Date.now() + expiresDays * 86400000,
      last_active: null,
      hosts: [],
      metadata: {}
    };
    operatorTokens.set(token, operator);
    saveOperatorsToFile();
    try {
      var s = getSupa();
      var insertData = {
        email: token + '@op.wc',
        display_name: name,
        token: token,
        daily_limit: quota || 100,
        active: true,
        created_at: new Date().toISOString()
      };
      var insRes = await s.from('comment_operators').upsert(insertData, { onConflict: 'token' });
      if (insRes.error) console.log('[ADMIN] Supabase insert error:', insRes.error.message);
      else console.log('[ADMIN] Supabase saved');
    } catch(e) { console.log('[ADMIN] Supabase sync failed:', e.message); }
    console.log('[ADMIN] Created operator:', name, 'Token:', token.substring(0, 12) + '...');
    res.json({ success: true, operator: { ...operator, token } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/operators', authAdmin, (req, res) => {
  try {
    const list = Array.from(operatorTokens.entries()).map(([token, op]) => ({
      name: op.name, token: token,
      daily_limit: op.daily_limit || 100,
      valid_days: op.valid_days || 30,
      active: op.active !== false,
      created: op.created || new Date().toISOString()
    }));
    res.json({ success: true, operators: list, total: list.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/operators/:token', authAdmin, async (req, res) => {
  try {
    const operator = operatorTokens.get(req.params.token);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    const { status, quota, name, expires_days, permissions } = req.body || {};
    if (status !== undefined) {
      operator.status = status;
      operator.active = (status === 'active');
    }
    if (quota !== undefined) operator.quota = quota;
    if (name) operator.name = name;
    if (permissions) operator.permissions = permissions;
    if (expires_days !== undefined) operator.expires_at = Date.now() + expires_days * 86400000;
    saveOperatorsToFile();
    try {
      var s = getSupa();
      var updateData = {
        display_name: operator.name,
        active: operator.active !== false,
        daily_limit: operator.quota || 100
      };
      await s.from('comment_operators').update(updateData).eq('token', req.params.token);
    } catch(e) { console.log('[ADMIN] Supabase update sync failed:', e.message); }
    console.log('[ADMIN] Updated operator:', operator.name, 'Status:', operator.status);
    res.json({ success: true, operator });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/operators/:token', authAdmin, async (req, res) => {
  try {
    const operator = operatorTokens.get(req.params.token);
    if (!operator) return res.status(404).json({ error: 'Operator not found' });
    operatorTokens.delete(req.params.token);
    saveOperatorsToFile();
    try {
      var s = getSupa();
      await s.from('comment_operators').delete().eq('token', req.params.token);
    } catch(e) { console.log('[ADMIN] Supabase delete sync failed:', e.message); }
    console.log('[ADMIN] Deleted operator:', operator.name);
    res.json({ success: true, message: 'Operator deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/operators/suspend-all', authAdmin, (req, res) => {
  let count = 0;
  operatorTokens.forEach(function(op, token) {
    if (op.status === 'active') { op.status = 'suspended'; count++; }
  });
  console.log('[ADMIN] Suspended', count, 'operators');
  saveOperatorsToFile();
  res.json({ success: true, message: 'Suspended ' + count + ' operators' });
});

// ============================================================
// OPERATOR API: Token Validation & Info
// ============================================================
app.get('/api/operator/validate', validateOperatorToken, (req, res) => {
  var op = req.operator;
  var quota = op.quota || op.daily_limit || 100;
  var usedToday = op.used_today || 0;
  var expiresAt = null;
  if (op.expires_at) {
    expiresAt = new Date(op.expires_at).toISOString();
  } else if (op.valid_days && op.created) {
    var created = new Date(op.created);
    if (!isNaN(created.getTime())) {
      expiresAt = new Date(created.getTime() + op.valid_days * 86400000).toISOString();
    }
  }
  var status = op.status || (op.active === false ? 'suspended' : 'active');
  res.json({
    success: true,
    operator: {
      id: op.id, name: op.name, status: status,
      quota: quota, used_today: usedToday,
      remaining_today: quota - usedToday,
      expires_at: expiresAt,
      permissions: op.permissions || ['comment', 'like']
    }
  });
});

// ============================================================
// HEALTH & AUTH ENDPOINTS
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    const s = getSupa();
    const r = await s.from('comment_tasks').select('*', { count: 'exact', head: true });
    res.json({ ok: true, db: 'connected', tasks: r.count, operators: operatorTokens.size, uptime: Math.floor(process.uptime()) });
  } catch(e) {
    res.json({ ok: false, error: e.message, operators: operatorTokens.size });
  }
});

const otps = {};
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = { code, expires: Date.now() + 300000 };
    console.log('[OTP]', email, code);
    res.json({ success: true, code });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const operators = {};
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const s = otps[email];
    if (!s) return res.status(400).json({ error: 'Code expired' });
    if (Date.now() > s.expires) { delete otps[email]; return res.status(400).json({ error: 'Code expired' }); }
    if (s.code !== code) return res.status(400).json({ error: 'Code wrong' });
    delete otps[email];
    const username = email.split('@')[0];
    let user = operators[email];
    if (!user) {
      user = { id: 'op_' + Date.now(), email, display_name: username, created_at: new Date().toISOString() };
      operators[email] = user;
    }
    user.updated_at = new Date().toISOString();
    res.json({ success: true, user: { id: user.id, email, display_name: user.display_name } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// HOSTS
// ============================================================
const hostStore = {};

app.get('/api/hosts', async (req, res) => {
  try {
    const { operator_id } = req.query;
    if (!operator_id) return res.status(400).json({ error: 'operator_id required' });
    let hosts = (hostStore[operator_id] || []).map(function(h) { return Object.assign({}, h); });
    try {
      const s = getSupa();
      const { data: dbHosts } = await s.from('comment_hosts').select('*').order('last_login_at', { ascending: false }).limit(50);
      if (dbHosts) {
        for (const dh of dbHosts) {
          const mapped = {
            id: dh.tiktok_username,
            operator_id: dh.operator_id,
            tiktok_username: dh.tiktok_username,
            display_name: dh.display_name || dh.tiktok_username,
            status: dh.status || 'offline',
            is_logged_in: dh.status === 'online' || dh.status === 'running',
            daily_comment_count: dh.daily_comment_count || 0,
            daily_comment_limit: dh.daily_comment_limit || 30,
            daily_comment_date: dh.daily_comment_date || new Date().toISOString().split('T')[0],
            last_login_at: dh.last_login_at
          };
          const exists = hosts.find(function(h) { return h.id === mapped.id || h.tiktok_username === mapped.tiktok_username; });
          if (!exists) hosts.push(mapped); else Object.assign(exists, mapped);
        }
      }
    } catch(e) {}
    res.json({ success: true, hosts });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hosts', async (req, res) => {
  try {
    const { operator_id, tiktok_username, display_name } = req.body || {};
    if (!operator_id || !tiktok_username) return res.status(400).json({ error: 'operator_id and tiktok_username required' });
    if (!hostStore[operator_id]) hostStore[operator_id] = [];
    var crypto = require('crypto');
    var hostToken = crypto.randomBytes(16).toString('hex');
    const host = {
      id: 'h_' + Date.now(), operator_id, tiktok_username,
      display_name: display_name || tiktok_username,
      host_token: hostToken,
      status: 'offline',
      daily_comment_count: 0,
      daily_comment_limit: 30,
      daily_comment_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    hostStore[operator_id].push(host);
    res.json({ success: true, host });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hosts/:id/session', async (req, res) => {
  try {
    var hostId = req.params.id;
    if (hostId && !hostId.startsWith('h_')) {
      for (const opHosts of Object.values(hostStore)) {
        var found = opHosts.find(function(h) { return h.tiktok_username === hostId; });
        if (found) { hostId = found.id; break; }
      }
    }
    const { tiktok_session, display_name, operator_id } = req.body || {};
    const s = getSupa();
    const { data: existing } = await s.from('comment_hosts').select('id').eq('tiktok_username', hostId).limit(1);
    if (existing && existing.length > 0) {
      await s.from('comment_hosts').update({
        tiktok_session, status: 'online', last_login_at: new Date().toISOString(),
        display_name: display_name || existing[0].display_name
      }).eq('id', existing[0].id);
    } else {
      let opId = operator_id;
      if (!opId) {
        const { data: ops } = await s.from('comment_operators').select('id').limit(1);
        if (ops && ops.length > 0) opId = ops[0].id;
        else {
          const { data: newOp } = await s.from('comment_operators').insert({ email: 'auto@whalecomment.app', display_name: 'Auto' }).select('id').single();
          if (newOp) opId = newOp.id;
        }
      }
      await s.from('comment_hosts').insert({
        operator_id: opId, tiktok_username: hostId,
        display_name: display_name || hostId,
        tiktok_session, status: 'online', last_login_at: new Date().toISOString()
      });
    }
    for (const opHosts of Object.values(hostStore)) {
      const h = opHosts.find(function(x) { return x.id === hostId || x.tiktok_username === hostId; });
      if (h) { h.status = 'online'; h.last_login_at = new Date().toISOString(); break; }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hosts/:id/start', (req, res) => {
  for (const opHosts of Object.values(hostStore)) {
    const h = opHosts.find(function(x) { return x.id === req.params.id; });
    if (h) { h.status = 'running'; h.started_at = new Date().toISOString(); break; }
  }
  res.json({ success: true });
});

app.post('/api/hosts/:id/stop', (req, res) => {
  for (const opHosts of Object.values(hostStore)) {
    const h = opHosts.find(function(x) { return x.id === req.params.id; });
    if (h) { h.status = 'online'; break; }
  }
  res.json({ success: true });
});

app.patch('/api/hosts/:id', async (req, res) => {
  try {
    for (const opHosts of Object.values(hostStore)) {
      const h = opHosts.find(function(x) { return x.id === req.params.id; });
      if (h) { Object.assign(h, req.body || {}); break; }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// TASKS
// ============================================================
const taskStore = {};

app.post('/api/tasks/batch', async (req, res) => {
  try {
    const { host_id, whale_usernames } = req.body || {};
    if (!host_id || !whale_usernames || !whale_usernames.length) return res.status(400).json({ error: 'host_id and whale_usernames required' });
    if (!taskStore[host_id]) taskStore[host_id] = [];
    const existing = new Set(taskStore[host_id].map(function(t) { return t.whale_username || t.profileId; }));
    let count = 0;
    for (const un of whale_usernames) {
      if (existing.has(un)) continue;
      taskStore[host_id].push({
        id: 't_' + Date.now() + '_' + count,
        host_id,
        profileId: un,
        whale_username: un,
        videoUrl: 'https://www.tiktok.com/@' + un,
        whale_persona: 'comprehensive',
        status: 'pending',
        priority: 50,
        created_at: new Date().toISOString()
      });
      count++;
    }
    res.json({ success: true, count, skipped: whale_usernames.length - count });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tasks/next', validateOperatorToken, async (req, res) => {
  try {
    const { host_id, limit } = req.query;
    req.operator.last_active = Date.now();
    const tasks = (taskStore[host_id] || []).filter(function(t) { return t.status === 'ready' || t.status === 'pending'; }).slice(0, parseInt(limit) || 5);
    res.json({ success: true, tasks });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/tasks/:id', async (req, res) => {
  var token = req.query.token;
  if (token) {
    var op = operatorTokens.get(token);
    if (!op || op.active === false) return res.status(403).json({ error: 'Invalid token' });
  }
  try {
    for (const [hid, tasks] of Object.entries(taskStore)) {
      const t = tasks.find(function(x) { return x.id === req.params.id; });
      if (t) {
        Object.assign(t, req.body || {});
        if (req.operator) { t.operator = req.operator.name; t.operator_id = req.operator.id; }
        if (req.body.status === 'completed') {
          for (const opHosts of Object.values(hostStore)) {
            const h = opHosts.find(function(x) { return x.id === hid; });
            if (h) { h.daily_comment_count = (h.daily_comment_count || 0) + 1; break; }
          }
        }
        break;
      }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tasks/progress', async (req, res) => {
  try {
    const { host_id } = req.query;
    const tasks = taskStore[host_id] || [];
    const done = tasks.filter(function(t) { return t.status === 'completed'; }).length;
    const fail = tasks.filter(function(t) { return t.status === 'failed'; }).length;
    const pend = tasks.filter(function(t) { return t.status === 'pending' || t.status === 'ready'; }).length;
    let dailyCount = 0, dailyLimit = 30;
    for (const opHosts of Object.values(hostStore)) {
      const h = opHosts.find(function(x) { return x.id === host_id; });
      if (h) { dailyCount = h.daily_comment_count || 0; dailyLimit = h.daily_comment_limit || 30; break; }
    }
    res.json({ success: true, total: tasks.length, completed: done, failed: fail, pending: pend, daily_count: dailyCount, daily_limit: dailyLimit });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// GENERATE TASKS FROM WHALE_PROFILES
// ============================================================
app.post('/api/hosts/:hostId/generate-tasks', async (req, res) => {
  var hostId = req.params.hostId;
  var token = req.query.token || req.body.token;
  var limit = parseInt(req.body.limit) || 10;

  var auth = operatorTokens.get(token);
  if (!auth) return res.status(401).json({ error: 'Invalid token' });
  if (auth.active === false) return res.status(403).json({ error: 'Token suspended' });
  var op = auth;
  var used = dailyUsage.get(op.name) || 0;
  if (used >= op.daily_limit) return res.json({ success: false, error: 'Daily limit reached' });

  var host = hostStore[hostId];
  if (!host) return res.status(404).json({ error: 'Host not found' });

  // Always use hardcoded whale list (no Supabase dependency)
  var hardcodedWhales = [
    { username: 'the_real_dk28', nickname: 'DK', region: 'ID', video_url: 'https://www.tiktok.com/@the_real_dk28' },
    { username: 'unstoppable_k1ng', nickname: 'King', region: 'ID', video_url: 'https://www.tiktok.com/@unstoppable_k1ng' },
    { username: 'toxictasha_2024', nickname: 'Tasha', region: 'ID', video_url: 'https://www.tiktok.com/@toxictasha_2024' },
    { username: 'blessedqueen_x', nickname: 'Queen', region: 'ID', video_url: 'https://www.tiktok.com/@blessedqueen_x' },
    { username: 'goldenboy_donatello', nickname: 'Don', region: 'ID', video_url: 'https://www.tiktok.com/@goldenboy_donatello' },
    { username: 'sultan_streamer22', nickname: 'Sultan', region: 'MY', video_url: 'https://www.tiktok.com/@sultan_streamer22' },
    { username: 'malay_royalz', nickname: 'Roy', region: 'MY', video_url: 'https://www.tiktok.com/@malay_royalz' },
    { username: 'billionairebabe', nickname: 'Babe', region: 'US', video_url: 'https://www.tiktok.com/@billionairebabe' },
    { username: 'nyc_bigballer', nickname: 'NYC', region: 'US', video_url: 'https://www.tiktok.com/@nyc_bigballer' },
    { username: 'richvibes_only', nickname: 'Rich', region: 'ID', video_url: 'https://www.tiktok.com/@richvibes_only' }
  ];
  var idCount = Math.floor(limit * 0.60);
  var myCount = Math.floor(limit * 0.30);
  var usCount = limit - idCount - myCount;
  var allWhales = [];
  var idWhales = hardcodedWhales.filter(function(w){ return w.region === 'ID'; });
  var myWhales = hardcodedWhales.filter(function(w){ return w.region === 'MY'; });
  var usWhales = hardcodedWhales.filter(function(w){ return w.region === 'US'; });
  allWhales = allWhales.concat(idWhales.slice(0, idCount));
  allWhales = allWhales.concat(myWhales.slice(0, myCount));
  allWhales = allWhales.concat(usWhales.slice(0, usCount));

  // Shuffle
  for (var i = allWhales.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = allWhales[i]; allWhales[i] = allWhales[j]; allWhales[j] = tmp;
  }

  // Fallback if no whales
  if (!allWhales.length) {
    allWhales = [
      { username: 'the_real_dk28', nickname: 'DK', region: 'ID', video_url: 'https://www.tiktok.com/@the_real_dk28' },
      { username: 'unstoppable_k1ng', nickname: 'King', region: 'ID', video_url: 'https://www.tiktok.com/@unstoppable_k1ng' },
      { username: 'toxictasha_2024', nickname: 'Tasha', region: 'ID', video_url: 'https://www.tiktok.com/@toxictasha_2024' }
    ];
    allWhales = allWhales.slice(0, limit);
  }

  // Use only DEFAULT_SCRIPTS (no Supabase query to avoid hangs)
  var useDefault = true;
  var scripts = [];

  if (!taskStore[hostId]) taskStore[hostId] = [];
  var existing = new Set(taskStore[hostId].map(function(t) { return t.profileId || t.username || t.whale_username; }));
  var count = 0;
  var hostName = host.display_name || host.tiktok_username || 'kita';

  for (var wi = 0; wi < allWhales.length; wi++) {
    var w = allWhales[wi];
    if (existing.has(w.username)) continue;
    if (count >= limit) break;

    var region = w.region || 'ID';
    var lang = (region === 'US') ? 'en' : 'id';
    var persona = w.persona || 'comprehensive';

    var pool = [];
    if (!useDefault && scripts.length > 0) {
      pool = scripts.filter(function(s) { return s.lang === lang; });
      if (pool.length === 0) pool = scripts;
    }

    var scriptText = '';
    if (pool.length > 0) {
      var picked = pool[Math.floor(Math.random() * pool.length)];
      scriptText = (picked.content || '');
    } else {
      scriptText = DEFAULT_SCRIPTS.getRandom(lang);
    }

    scriptText = scriptText.replace(/\{host\}/g, hostName).replace(/\{whale\}/g, w.nickname || w.username).replace(/\{name\}/g, w.nickname || w.username);

    taskStore[hostId].push({
      profileId: w.username || w.profileId || 'unknown',
      username: w.username || 'unknown',
      videoUrl: w.video_url || ('https://www.tiktok.com/@' + (w.username || 'unknown')),
      script: scriptText,
      lang: lang,
      region: region,
      persona: persona,
      status: 'pending'
    });
    count++;
  }

  res.json({ success: true, count: count, total: allWhales.length, source: 'default' });
});
app.post('/api/hosts/:id/regenerate-token', (req, res) => {
  try {
    var crypto = require('crypto');
    var newToken = crypto.randomBytes(16).toString('hex');
    for (const opHosts of Object.values(hostStore)) {
      const h = opHosts.find(function(x) { return x.id === req.params.id; });
      if (h) { h.host_token = newToken; res.json({ success: true, host_token: newToken }); return; }
    }
    res.status(404).json({ error: 'host not found' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// SCRIPTS IMPORT API
// ============================================================
app.post('/api/admin/import-scripts', authAdmin, async (req, res) => {
  try {
    const { scripts, clear_existing } = req.body || {};
    if (!scripts || !Array.isArray(scripts)) {
      return res.status(400).json({ error: 'scripts array required' });
    }
    
    const s = getSupa();
    
    // å¯éï¼æ¸ç©ºç°æè¯æ¯
    if (clear_existing) {
      await s.from('comment_scripts').delete().neq('id', 0);
      console.log('[ADMIN] Cleared existing scripts');
    }
    
    // æ¹éæå¥ (æ¯æ¹ 100 æ?
    const batchSize = 100;
    let imported = 0;
    let failed = 0;
    
    for (let i = 0; i < scripts.length; i += batchSize) {
      const batch = scripts.slice(i, i + batchSize);
      const { data, error } = await s.from('comment_scripts').insert(batch);
      if (error) {
        console.log('[ADMIN] Batch import error:', error.message);
        failed += batch.length;
      } else {
        imported += batch.length;
      }
    }
    
    console.log('[ADMIN] Imported', imported, 'scripts,', failed, 'failed');
    res.json({ success: true, imported, failed, total: scripts.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// UPDATE WHALE REGIONS
// ============================================================
app.post('/api/admin/update-whale-regions', authAdmin, async (req, res) => {
  try {
    const s = getSupa();
    
    // è·åææéä¸?    const { data: whales, error } = await s.from('whale_profiles').select('username, region');
    if (error) return res.status(500).json({ error: error.message });
    
    // å°åºå¤æ­å½æ°
    function detectRegion(username) {
      const name = (username || '').toLowerCase();
      
      // å°å°¼ç¹å¾
      const idPatterns = [/habib|jack|ahmad|muhammad|febri|putra|bagus|siti|dewi|ratna|rini|ayu|putri|kaede|guardman|bonsai/i];
      // é©¬æ¥è¥¿äºç¹å¾
      const myPatterns = [/lemon56920|puteraiman|malaysia|kuala|nor|aziz|farah|izzat|hakim|nurul|amirah/i];
      // ç¾å½ç¹å¾
      const usPatterns = [/unstoppable|king|queen|coven|onlyfams|brinn|official|real|the_/i];
      
      for (const p of usPatterns) if (p.test(name)) return 'US';
      for (const p of myPatterns) if (p.test(name)) return 'MY';
      for (const p of idPatterns) if (p.test(name)) return 'ID';
      
      // é»è®¤éæºåå¸
      const rand = Math.random();
      if (rand < 0.60) return 'ID';
      if (rand < 0.90) return 'MY';
      return 'US';
    }
    
    // æ¹éæ´æ°
    let updated = 0;
    for (const w of (whales || [])) {
      if (w.region) continue; // å·²æ region è·³è¿
      
      const newRegion = detectRegion(w.username);
      const { error: updErr } = await s.from('whale_profiles')
        .update({ region: newRegion })
        .eq('username', w.username);
      
      if (!updErr) updated++;
    }
    
    console.log('[ADMIN] Updated', updated, 'whale regions');
    res.json({ success: true, updated, total: whales?.length || 0 });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// SCRIPTS
// ============================================================
app.post('/api/scripts/generate', async (req, res) => {
  try {
    const { persona, host_name, whale_username, whale_region } = req.body || {};
    if (!persona) return res.status(400).json({ error: 'persona required' });
    const s = getSupa();
    const { data: c } = await s.from('comment_scripts').select('content').eq('persona', persona).eq('lang', 'id').order('success_rate', { ascending: false }).limit(5);
    let script = '';
    if (c && c.length) {
      script = c[Math.floor(Math.random() * c.length)].content;
      script = script.replace(/\{host\}/g, host_name || 'kita').replace(/\{whale\}/g, whale_username || 'Kak');
      script = addFlavor(script, persona);
      return res.json({ success: true, script, persona_style: persona, from_cache: true });
    }
    script = getFallback(persona, host_name, whale_username);
    script = addFlavor(script, persona);
    res.json({ success: true, script, persona_style: persona, from_cache: false });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/scripts/generate-batch', async (req, res) => {
  try {
    const { tasks } = req.body || {};
    if (!tasks || !tasks.length) return res.status(400).json({ error: 'tasks required' });
    const s = getSupa();
    const rr = [];
    for (const t of tasks.slice(0, 10)) {
      try {
        const hostName = t.host_display_name || 'kita';
        const script = getFallback(t.whale_persona || 'comprehensive', hostName, t.whale_username);
        await s.from('comment_tasks').update({
          generated_script: script,
          generated_persona_style: t.whale_persona || 'comprehensive',
          status: 'ready',
          updated_at: new Date().toISOString()
        }).eq('id', t.id);
        rr.push({ task_id: t.id, script, status: 'ready' });
      } catch(er) { rr.push({ task_id: t.id, error: er.message, status: 'error' }); }
    }
    res.json({ success: true, results: rr });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// STATS
// ============================================================
app.get('/api/stats', async (req, res) => {
  try {
    const { host_id } = req.query;
    const tasks = host_id ? (taskStore[host_id] || []) : Object.values(taskStore).flat();
    const ok = tasks.filter(function(t) { return t.status === 'completed'; }).length;
    const fail = tasks.filter(function(t) { return t.status === 'failed'; }).length;
    const recent = tasks.filter(function(t) { return t.status === 'completed'; }).slice(-20).map(function(t) {
      return { action: 'comment_success', whale_username: t.whale_username, created_at: t.executed_at || t.updated_at || t.created_at };
    });
    res.json({
      success: true,
      total_logs: tasks.length,
      comments_success: ok,
      comments_failed: fail,
      success_rate: ok + fail > 0 ? Math.round(ok / (ok + fail) * 100) : 0,
      recent
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// HELPERS
// ============================================================
function calcPriority(p) {
  let s = 50;
  if (p.persona === 'high_spender') s += 30; else if (p.persona === 'vip') s += 25; else if (p.persona === 'challenger') s += 20; else if (p.persona === 'gift_giver') s += 15; else if (p.persona === 'active') s += 10;
  if ((p.total_gifts || 0) > 5000000) s += 20; else if ((p.total_gifts || 0) > 1000000) s += 10;
  return Math.min(100, s);
}

function addFlavor(script, persona) {
  const em = {
    challenger: ['⭐','🔥','💪','🎯','✨'],
    vip: ['ð','ð','ð','ð','ð'],
    high_spender: ['ð°','ð¤','ð¸','ð','ðª'],
    curious: ['🤔','❓','💭','🎁','🎈'],
    active: ['🙋','👋','🤝','✅','🎊'],
    gift_giver: ['ð','ð','ð¹','ð','ð'],
    comprehensive: ['✅','🏆','💕','🙌','🎉']
  };
  const pool = em[persona] || em.comprehensive;
  const sf = ' ' + pool[Math.floor(Math.random() * pool.length)] + pool[Math.floor(Math.random() * pool.length)];
  const fl = [' Yuk mampir!', ' Ditunggu ya!', ' Jangan lupa mampir~', ' See you there!', ''];
  return script.trim() + sf + fl[Math.floor(Math.random() * fl.length)];
}

function getFallback(persona, hostName, whaleName) {
  const t = {
    challenger: [
      'Kak ' + whaleName + ', ' + hostName + ' lagi live nih! Siap-siap battle seru !',
      'Eh jagoan! ' + hostName + ' butuh support kamu nih di live sekarang !'
    ],
    vip: [
      'Kak ' + whaleName + ' special guest kita! ' + hostName + ' ada kejutan buat kamu !',
      'VIP alert! ' + hostName + ' nungguin kamu nih Kak ' + whaleName + ' !'
    ],
    high_spender: [
      'Kak ' + whaleName + ', ' + hostName + ' lagi mega live! Ada gift spesial nih buat kamu !',
      'Sultan ' + whaleName + ', ' + hostName + ' live sekarang! Hadiah besar menanti !'
    ],
    curious: [
      whaleName + ', ' + hostName + ' ada sesuatu yang bikin penasaran nih di live !',
      'Penasaran? ' + hostName + ' lagi live dengan surprise spesial! Cek sekarang !'
    ],
    active: [
      hostName + ' kangen sama kamu Kak ' + whaleName + '! Mampir dong !',
      'Bestie ' + whaleName + '! ' + hostName + ' lagi live, vibes-nya rame banget !'
    ],
    gift_giver: [
      'Kak ' + whaleName + ' baik hati! ' + hostName + ' pengen kasih shoutout spesial buat kamu !',
      'Wow ' + whaleName + ', ' + hostName + ' lagi live! Gift kamu selalu bikin dia senang !'
    ],
    comprehensive: [
      'Kak ' + whaleName + ', ' + hostName + ' lagi live seru nih! Mampir yuk !',
      hostName + ' live sekarang Kak ' + whaleName + '! Jangan ketinggalan serunya !'
    ]
  };
  const pool = t[persona] || t.comprehensive;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// DEBUG: test Supabase scripts query
app.get('/api/_debug/scripts', async (req, res) => {
  try {
    const s = getSupa();
    const r = await s.from('comment_scripts').select('*').limit(1);
    res.json({ ok: true, rows: r.data ? r.data.length : 'null', status: r.status });
  } catch(e) {
    res.json({ ok: false, err: e.message });
  }
});

// TOKEN VERIFICATION & STARTUP
// ============================================================
app.get('/api/verify-token', (req, res) => {
  var token = req.query.token;
  if (!token) return res.json({ valid: false, error: 'Token required' });
  var op = operatorTokens.get(token);
  if (!op) return res.json({ valid: false, error: 'Invalid token' });
  if (op.active === false) return res.json({ valid: false, error: 'Token suspended' });
  res.json({ valid: true, name: op.name, daily_limit: op.daily_limit });
});

app.get('/api/_debug/generate-test', (req, res) => {
  var hostId = req.query.hostId || 'h_test';
  var token = req.query.token || '';
  var auth = operatorTokens.get(token);
  if (!auth) return res.status(401).json({ error: 'Invalid token' });
  var host = hostStore[hostId];
  if (!host) return res.status(404).json({ error: 'Host not found' });
  var hardcodedWhales = [
    { username: 'the_real_dk28', nickname: 'DK', region: 'ID', video_url: 'https://www.tiktok.com/@the_real_dk28' },
    { username: 'unstoppable_k1ng', nickname: 'King', region: 'ID', video_url: 'https://www.tiktok.com/@unstoppable_k1ng' },
    { username: 'toxictasha_2024', nickname: 'Tasha', region: 'ID', video_url: 'https://www.tiktok.com/@toxictasha_2024' },
    { username: 'sultan_streamer22', nickname: 'Sultan', region: 'MY', video_url: 'https://www.tiktok.com/@sultan_streamer22' },
    { username: 'billionairebabe', nickname: 'Babe', region: 'US', video_url: 'https://www.tiktok.com/@billionairebabe' }
  ];
  var hostName = host.display_name || host.tiktok_username || 'kita';
  var tasks = hardcodedWhales.slice(0, 3).map(function(w) {
    var lang = (w.region === 'US') ? 'en' : 'id';
    var script = DEFAULT_SCRIPTS.getRandom(lang).replace(/\{host\}/g, hostName).replace(/\{whale\}/g, w.nickname || w.username);
    return { profileId: w.username, username: w.username, videoUrl: w.video_url, script: script, lang: lang, status: 'ready' };
  });
  taskStore[hostId] = tasks;
  res.json({ success: true, count: tasks.length, tasks: tasks });
});

// TEMP: minimal async generate-tasks test
app.post('/api/_debug/gt', async (req, res) => {
  try {
    var token = req.query.token || req.body.token;
    var auth = operatorTokens.get(token);
    if (!auth) return res.status(401).json({ error: 'Invalid token' });
    var hostId = req.params.hostId || 'h_test';
    var host = hostStore[hostId];
    var hardcodedWhales = [
      { username: 'the_real_dk28', nickname: 'DK', region: 'ID', video_url: 'https://www.tiktok.com/@the_real_dk28' },
      { username: 'sultan_streamer22', nickname: 'Sultan', region: 'MY', video_url: 'https://www.tiktok.com/@sultan_streamer22' },
      { username: 'billionairebabe', nickname: 'Babe', region: 'US', video_url: 'https://www.tiktok.com/@billionairebabe' }
    ];
    var hostName = host ? (host.display_name || host.tiktok_username || 'kita') : 'kita';
    var tasks = hardcodedWhales.map(function(w) {
      var lang = (w.region === 'US') ? 'en' : 'id';
      return { profileId: w.username, videoUrl: w.video_url, script: DEFAULT_SCRIPTS.getRandom(lang).replace(/\{host\}/g, hostName).replace(/\{whale\}/g, w.nickname || w.username), status: 'ready' };
    });
    if (hostId) taskStore[hostId] = tasks;
    res.json({ success: true, count: tasks.length });
  } catch(e) {
    console.error('[GT-ERR]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log('WhaleComment API running on port ' + PORT);
  console.log('Supabase: ' + SUPABASE_URL);
});
