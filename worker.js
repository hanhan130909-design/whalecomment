// Worker — runs the auto-comment loop
var hostId = process.argv[2] || 'h_1783502518392';
var API = 'https://prolific-adventure-production-9b13.up.railway.app';
var puppeteer, StealthPlugin;

// Use WhaleSense's puppeteer
// Using local node_modules
puppeteer = require('puppeteer-extra');
StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function log(msg) { process.stdout.write(msg + '\n'); }

async function main() {
  log('[WC] Starting for ' + hostId);
  
  var exe = (process.env.LOCALAPPDATA || 'C:/Users/' + require('os').userInfo().username + '/AppData/Local') + '/Google/Chrome/Application/chrome.exe';
  var fs = require('fs');
  if (!fs.existsSync(exe)) exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!fs.existsSync(exe)) exe = undefined;
  
  var browser = await puppeteer.launch({
    headless: false,
    executablePath: exe,
    args: ['--no-sandbox', '--window-size=1280,800'],
    userDataDir: './wc_profile'
  });
  
  var page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  log('[WC] Opening TikTok...');
  await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
  log('[WC] Scan QR to login. Waiting 30s...');
  await sleep(30000);
  await page.goto('https://www.tiktok.com/foryou', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(5000);
  
  log('[WC] Starting comment loop');
  var count = 0;
  
  while (true) {
    try {
      var resp = await fetch(API + '/api/tasks/next?host_id=' + hostId + '&token=' + (process.argv[3] || '') + '&limit=1');
      var data = await resp.json();
      if (!data.tasks || !data.tasks.length) { process.stdout.write('.'); await sleep(30000); continue; }
      
      var task = data.tasks[0];
      log('[WC] ' + task.profileId + ' | ' + (task.commentText || '').substring(0, 40));
      
      await page.goto('https://www.tiktok.com/foryou', { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(3000);
      
      // Type comment
      document.body.click && await page.evaluate(function() { document.body.click(); });
      await sleep(500);
      await page.keyboard.press('KeyC');
      await sleep(2000);
      
      var typed = await page.evaluate(function(t) {
        var el = document.querySelector('div[contenteditable="true"], [role="textbox"]');
        if (!el) return false;
        el.focus(); el.textContent = t;
        el.dispatchEvent(new Event('input', {bubbles: true}));
        return true;
      }, task.commentText || 'Hai!');
      
      if (typed) {
        await sleep(1000);
        await page.evaluate(function() {
          var all = document.querySelectorAll('div,span,button');
          for (var i = 0; i < all.length; i++) {
            if (all[i].textContent && all[i].textContent.trim().toLowerCase() === 'post' && all[i].offsetParent) {
              all[i].click(); return;
            }
          }
        });
        await sleep(2000);
        count++;
        if (task.id) {
          fetch(API + '/api/tasks/' + task.id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status:'done'}) }).catch(function(){});
        }
      }
      
      log('[WC] Total: ' + count);
      var delay = 30000 + Math.random() * 60000;
      await sleep(delay);
      
    } catch(e) {
      log('[WC] Error: ' + e.message);
      await sleep(30000);
    }
  }
}

main().catch(function(e) { log('[WC] Fatal: ' + e.message); process.exit(1); });
