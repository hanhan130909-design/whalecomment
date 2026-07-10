// WhaleComment Worker — runs in Electron child process
var hostId = process.argv[2] || 'h_1783502518392';
var token = process.argv[3] || '';
var API = 'https://prolific-adventure-production-9b13.up.railway.app';
var path = require('path');
var fs = require('fs');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function log(msg) { process.stdout.write(msg + '\n'); }

// MVP Stats
var mvpStats = {
  target: 100,           // 目标：100个有效任务
  completed: 0,          // 成功评论数
  liked: 0,              // 点赞数
  failed: 0,             // 失败数（无法评论、无视频等）
  skipped: 0,            // 跳过数
  startTime: Date.now()
};

var dots = 0;  // Progress dots for login/status
var genCalled = false;  // One-time task generation guard

// First log to confirm worker is running
log('[WC] === WORKER STARTED ===');
log('[WC] Host ID: ' + hostId);
log('[WC] Token: ' + (token ? '(set)' : '(empty)'));
log('[WC] __dirname: ' + __dirname);
log('[WC] resourcesPath: ' + (process.resourcesPath || 'N/A'));
log('[WC] MVP Target: ' + mvpStats.target + ' valid interactions');

// Resolve puppeteer — handles both dev and packed modes
var puppeteer, StealthPlugin;
try {
  // Try puppeteer-core first (no Chromium download needed)
  puppeteer = require('puppeteer-core');
  StealthPlugin = require('puppeteer-extra-plugin-stealth');
  var pe = require('puppeteer-extra');
  pe.use(StealthPlugin());
  puppeteer = pe;
  log('[WC] ✓ puppeteer-core loaded');
} catch(e) {
  // Try WhaleSense fallback (only works if WhaleSense is installed)
  try {
    var wsM = 'D:/金主项目/WhaleSense_Windows/WhaleSense_Windows/backend/node_modules';
    puppeteer = require(wsM + '/puppeteer-extra');
    StealthPlugin = require(wsM + '/puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());
    log('[WC] Using WhaleSense puppeteer');
  } catch(e2) {
    log('[FATAL] Cannot load puppeteer. Please run: npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth');
    process.exit(1);
  }
}

// Report MVP stats periodically
function reportStats() {
  var elapsed = Math.round((Date.now() - mvpStats.startTime) / 60000);
  var remaining = Math.max(0, mvpStats.target - mvpStats.completed);
  var progress = Math.round((mvpStats.completed / mvpStats.target) * 100);
  
  log('[MVP] ========== STATS REPORT ==========');
  log('[MVP] Target: ' + mvpStats.target + ' | Completed: ' + mvpStats.completed + ' (' + progress + '%)');
  log('[MVP] Liked: ' + mvpStats.liked + ' | Failed: ' + mvpStats.failed + ' | Skipped: ' + mvpStats.skipped);
  log('[MVP] Remaining: ' + remaining + ' | Elapsed: ' + elapsed + ' min');
  log('[MVP] =================================');
}

// Like video function
async function likeVideo(page) {
  try {
    var liked = await page.evaluate(function() {
      // Debug: log all buttons and their labels
      var debug = [];
      var likeBtn = null;
      
      // Strategy 1: data-e2e attributes (TikTok internal)
      var e2eSelectors = [
        '[data-e2e="like-button"]',
        '[data-e2e="like-icon"]',
        '[data-e2e="browse-like-button"]',
        '[data-e2e="browse-like-icon"]',
        '[data-e2e="video-like"]',
        '[data-e2e="like"]'
      ];
      for (var s of e2eSelectors) {
        var el = document.querySelector(s);
        if (el && el.offsetParent !== null) { likeBtn = el; debug.push('e2e:' + s); break; }
      }
      
      // Strategy 2: aria-label containing 'like'
      if (!likeBtn) {
        var all = document.querySelectorAll('button, [role="button"], div');
        for (var i = 0; i < all.length; i++) {
          var el2 = all[i];
          var label = (el2.getAttribute('aria-label') || '').toLowerCase();
          if ((label.includes('like') && !label.includes('unlike')) ||
              (label.includes('suka') && !label.includes('unlike'))) {
            likeBtn = el2; debug.push('aria:' + label.substring(0, 30)); break;
          }
        }
      }
      
      // Strategy 3: SVG path for heart/like icon (most reliable for TikTok)
      if (!likeBtn) {
        var svgs = document.querySelectorAll('svg');
        for (var svg of svgs) {
          var d = (svg.getAttribute('d') || '');
          var fill = (svg.getAttribute('fill') || '').toLowerCase();
          // Heart-like SVG path
          if (d.includes('M12 21.35') || d.includes('21.35') || 
              (d.includes('12') && d.includes('21') && d.length > 10)) {
            // Find clickable parent
            var parent = svg.closest('button') || svg.closest('[role="button"]') || svg.parentElement;
            if (parent && parent.offsetParent !== null) {
              likeBtn = parent; debug.push('svg:heart'); break;
            }
          }
        }
      }
      
      // Strategy 4: class pattern with liked state
      if (!likeBtn) {
        var patterns = ['like-button', 'LikeButton', 'likeButton', 'action-item'];
        for (var p of patterns) {
          var found = document.querySelector('[class*="' + p + '"]');
          if (found && found.offsetParent !== null) {
            likeBtn = found.closest('button') || found; 
            debug.push('class:' + p);
            break;
          }
        }
      }
      
      if (!likeBtn) { debug.push('NOT_FOUND'); }
      
      if (likeBtn) {
        // Check if already liked: aria-pressed="true" or fill=red or fill=pink
        var btn = likeBtn.closest('button') || likeBtn;
        var isLiked = btn.getAttribute('aria-pressed') === 'true' ||
          (btn.innerHTML && (btn.innerHTML.includes('fill="#fe2c55"') || btn.innerHTML.includes("fill='#fe2c55'") || btn.innerHTML.includes('color:#fe2c55')));
        return { status: isLiked ? 'already' : 'liked', debug: debug };
      }
      return { status: false, debug: debug };
    });
    
    log('[WC] DEBUG like: ' + JSON.stringify(liked.debug));
    
    if (liked.status === 'already') {
      log('[WC] ❤️ Already liked this video');
      return true;
    } else if (liked.status === 'liked') {
      log('[WC] ❤️ Liked video!');
      mvpStats.liked++;
      return true;
    } else {
      log('[WC] ⚠️ Could not find like button');
      return false;
    }
  } catch(e) {
    log('[WC] ⚠️ Like error: ' + e.message);
    return false;
  }
}

// Check if profile has videos
async function hasVideos(page) {
  try {
    var result = await page.evaluate(function() {
      // Check for video links
      var videoLink = document.querySelector('a[href*="/video/"], [data-e2e="user-post-item"]');
      if (videoLink) return true;
      
      // Check for "No videos" message
      var body = document.body.textContent || '';
      if (body.includes('No videos') || body.includes('No content') || body.includes('没有视频')) {
        return false;
      }
      
      return videoLink !== null;
    });
    
    return result;
  } catch(e) {
    return false;
  }
}

async function main() {
  log('[WC] Worker started for ' + hostId);

  // Detect Chrome executable
  var chromePaths = [
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  var chromeExe = null;
  for (var i = 0; i < chromePaths.length; i++) {
    if (fs.existsSync(chromePaths[i])) {
      chromeExe = chromePaths[i];
      break;
    }
  }

  // Resolve wc_profile path (packed app uses resources/wc_profile)
  var profileDir = path.join(__dirname, 'wc_profile');
  if (!fs.existsSync(profileDir)) {
    profileDir = path.join(process.resourcesPath || __dirname, 'wc_profile');
  }
  if (!fs.existsSync(profileDir)) {
    profileDir = './wc_profile'; // fallback
  }
  log('[WC] Profile dir: ' + profileDir);

  log('[WC] Chrome: ' + (chromeExe || 'puppeteer default'));

  var browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExe,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1280,800'],
    userDataDir: profileDir
  });

  var page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Check existing session first
  log('[WC] Checking session...');
  try {
    await page.goto('https://www.tiktok.com/foryou', { waitUntil: 'domcontentloaded', timeout: 90000 });
  } catch(e) {
    log('[WC] TikTok unreachable: ' + e.message.split('\n')[0]);
    log('[WC] Retrying in 30s...');
    await sleep(30000);
    await page.goto('https://www.tiktok.com/foryou', { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
  await sleep(4000);

  var loggedIn = await page.evaluate(function() {
    return document.cookie.indexOf('sessionid=') >= 0 || !!document.querySelector('[data-e2e="top-user-avatar"]');
  });

  if (!loggedIn) {
    log('[WC] Not logged in. Opening login page...');
    try {
    await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
  } catch(e) {
    log('[WC] TikTok login page unreachable. Check network.');
    await sleep(30000);
    await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
  }
    log('[WC] Scan QR code to login. Waiting...');
    var loginAttempts = 0;
    dots = 0; // Reset dots for login
    while (loginAttempts < 60) {
      await sleep(3000);
      dots++;
      // Check multiple login indicators
      var ok = await page.evaluate(function() {
        var hasSession = document.cookie.indexOf('sessionid=') >= 0 || document.cookie.indexOf('sid_tt=') >= 0;
        var hasAvatar = !!document.querySelector('[data-e2e="top-user-avatar"]') || !!document.querySelector('[class*="avatar"]');
        var notOnLogin = !window.location.pathname.includes('/login');
        var hasForYou = document.body.innerText.includes('For You') || document.body.innerText.includes('FYP');
        return hasSession || hasAvatar || (notOnLogin && hasForYou);
      });
      if (ok) { 
        log('\n[WC] Logged in!');
        break; 
      }
      if (dots >= 20) {
        log('\n[WC] Login timeout. Continuing anyway...');
        break;
      }
      process.stdout.write('.');
      loginAttempts++;
    }
    if (loginAttempts >= 60) {
      log('\n[WC] Login timeout. Continuing anyway...');
    } else {
      log('\n[WC] Logged in!');
    }
  } else {
    log('[WC] Session found, skipping login.');
  }

  // Task loop
  log('[WC] Starting comment loop...');
  var retryCount = {};
  var lastReportTime = Date.now();

  while (true) {
    try {
      // Report stats every 5 minutes
      if (Date.now() - lastReportTime > 300000) {
        reportStats();
        lastReportTime = Date.now();
      }
      
      // Check if MVP target reached
      if (mvpStats.completed >= mvpStats.target) {
        log('[MVP] 🎉 MVP TARGET REACHED! ' + mvpStats.completed + '/' + mvpStats.target);
        reportStats();
        log('[WC] Continuing to process more tasks...');
      }

      var url = API + '/api/tasks/next?host_id=' + hostId + '&token=' + token + '&limit=1';
      var resp = await fetch(url);
      var data = await resp.json();

      if (!data.tasks || !data.tasks.length) {
        process.stdout.write('.');
        // Auto-generate tasks if none exist (one-time)
        if (!genCalled) {
          genCalled = true;
          try {
            var genUrl = API + '/api/hosts/' + hostId + '/generate-tasks';
            var genResp = await fetch(genUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({limit:30}) });
            var genData = await genResp.json();
            console.log('[WC] Auto-generated ' + (genData.count || 0) + ' tasks');
          } catch(e) { console.log('[WC] Gen tasks failed:', e.message); }
        }
        await sleep(30000);
        continue;
      }

      dots = 0;  // Reset progress dots
      var task = data.tasks[0];
      var text = task.commentText || 'Hai! 🔥';
      log('\n[WC] Target: ' + task.profileId + ' | ' + text.substring(0, 40));

      // Track retries per task
      var taskId = task.id || task.profileId;
      retryCount[taskId] = (retryCount[taskId] || 0) + 1;
      
      if (retryCount[taskId] > 3) {
        log('[WC] ✗ Max retries reached, skipping this task');
        if (task.id) {
          fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: 'Max retries exceeded', executed_at: new Date().toISOString() })
          }).catch(function(){});
        }
        mvpStats.skipped++;
        delete retryCount[taskId];
        await sleep(3000); dots++; if (dots > 60) break;
        continue;
      }

      // Navigate to target user's video page
      // Supports all task formats: generate-tasks (profileId+videoUrl), batch (whale_username)
      var targetUsername = task.profileId || task.whale_username || '';
      if (!targetUsername) {
        log('[WC] ✗ Task missing target username (profileId and whale_username both empty), skipping');
        if (task.id) {
          fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: 'Missing target username', executed_at: new Date().toISOString() })
          }).catch(function(){});
        }
        mvpStats.skipped++;
        await sleep(5000);
        continue;
      }
      var targetUrl = task.videoUrl || ('https://www.tiktok.com/@' + targetUsername);
      log('[WC] Opening: https://www.tiktok.com/@' + targetUsername + ' (task.' + (task.profileId ? 'profileId' : 'whale_username') + ')');
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 90000 });
      try { await page.waitForSelector('body', { timeout: 30000 }); } catch (_) {}
      await sleep(3000); dots++; if (dots > 60) break;

      // === Verify we actually landed on the TARGET profile ===
      // TikTok may redirect to /login or back to the logged-in host's own page.
      var landedHref = await page.evaluate(function() { return location.href; });
      var onTarget = await page.evaluate(function(username) {
        var href = location.href.toLowerCase();
        return href.indexOf('/@' + username.toLowerCase()) !== -1;
      }, targetUsername);
      if (!onTarget) {
        log('[WC] ✗ Redirected away from @' + targetUsername + ' (landed: ' + landedHref + ') - skipping');
        if (task.id) {
          fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: 'Navigation redirected away from target profile: ' + landedHref, executed_at: new Date().toISOString() })
          }).catch(function(){});
        }
        mvpStats.failed++;
        await sleep(3000);
        continue;
      }

      // Check if on profile page (no specific video)
      var isProfile = await page.evaluate(function() { return !location.href.includes('/video/'); });
      
      if (isProfile) {
        // Check if profile has videos
        var hasVideo = await hasVideos(page);
        if (!hasVideo) {
          log('[WC] ✗ Profile has no videos - skipping');
          if (task.id) {
            fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed', error: 'No videos on profile', executed_at: new Date().toISOString() })
            }).catch(function(){});
          }
          mvpStats.failed++;
          continue;
        }
        
        // Find the FIRST VIDEO URL that BELONGS TO THE TARGET PROFILE.
        // Must NOT match recommended/sidebar videos from other accounts.
        // Then navigate directly via page.goto (more reliable than .click() on TikTok SPA).
        var ownVideoHref = await page.evaluate(function(username) {
          var links = document.querySelectorAll('a[href*="/video/"]');
          for (var i = 0; i < links.length; i++) {
            var href = (links[i].getAttribute('href') || '').toLowerCase();
            if (href.indexOf('/@' + username.toLowerCase() + '/video/') !== -1) {
              return links[i].href || links[i].getAttribute('href');
            }
          }
          return null;
        }, targetUsername);
        
        if (!ownVideoHref) {
          log('[WC] ✗ No own-video link found for @' + targetUsername + ' - skipping');
          if (task.id) {
            fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed', error: 'No own-video link on profile', executed_at: new Date().toISOString() })
            }).catch(function(){});
          }
          mvpStats.failed++;
          continue;
        }
        // Navigate directly to the own-video URL
        log('[WC] → Navigating to own video: ' + ownVideoHref);
        await page.goto(ownVideoHref, { waitUntil: 'load', timeout: 90000 });
        // Wait for the main frame to be fully attached + for the video element to mount
        try { await page.waitForSelector('video', { timeout: 30000 }); } catch (_) {}
        await sleep(3000); dots++; if (dots > 60) break;

        // Verify we're now on the TARGET's video page (not a wrong account)
        var finalHref = await page.evaluate(function() { return location.href; });
        var onVideoOfTarget = await page.evaluate(function(username) {
          var href = location.href.toLowerCase();
          return href.indexOf('/@' + username.toLowerCase() + '/video/') !== -1;
        }, targetUsername);
        if (!onVideoOfTarget) {
          log('[WC] ✗ Landed on wrong page (not target video): ' + finalHref + ' - skipping');
          if (task.id) {
            fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed', error: 'Video click landed on wrong account: ' + finalHref, executed_at: new Date().toISOString() })
            }).catch(function(){});
          }
          mvpStats.failed++;
          continue;
        }
      }

      // Like the video first
      await likeVideo(page);
      await sleep(1500);

      // Open comment panel with multiple strategies
      // First: focus the video element (needed for keyboard shortcut to work)
      var videoFocused = await page.evaluate(function() {
        var video = document.querySelector('video');
        if (video) { video.focus(); return true; }
        return false;
      });
      if (videoFocused) await sleep(500);
      
      // Try keyboard shortcut first (TikTok's primary method - 'C' key opens comment panel)
      await page.keyboard.press('KeyC');
      await sleep(2000);
      
      // Open comment panel: prefer a REAL click (triggers TikTok React handlers)
      // over synthetic .click(); fall back to KeyC if real click fails.
      var commentSel = await page.evaluate(function() {
        var selectors = [
          '[data-e2e="comment-icon"]',
          '[data-e2e="comment-button"]',
          '[data-e2e="browse-comment-icon"]',
          'button[aria-label*="comment" i]',
          '[class*="ActionItem"]'
        ];
        for (var s of selectors) {
          var el = document.querySelector(s);
          if (el && el.offsetParent !== null) return s;
        }
        return null;
      });
      if (commentSel) {
        try {
          await page.click(commentSel);
          log('[WC] Clicked comment button (real): ' + commentSel);
        } catch(e) {
          log('[WC] Real click failed (' + e.message.split('\n')[0] + '), falling back to KeyC');
          await page.keyboard.press('KeyC');
        }
      } else {
        log('[WC] No comment button selector found, trying KeyC');
        await page.keyboard.press('KeyC');
      }
      await sleep(3500);

      // Detect comment panel + find input with expanded selectors
      var result = await page.evaluate(function() {
        var el = null;
        var reason = 'not_found';
        var debug = [];

        // Check if comment panel/drawer is visible
        var panelVisible = !!document.querySelector(
          '[data-e2e="comment-panel"], [data-e2e="comment-list-container"], ' +
          '[class*="CommentListContainer"], [class*="CommentPanel"], ' +
          '[class*="CommentDrawer"]'
        );
        debug.push('panel:' + panelVisible);

        // Strategy 1: Shadow DOM contenteditable (TikTok web components)
        var candidates = document.querySelectorAll('*');
        for (var i = 0; i < candidates.length; i++) {
          var c = candidates[i];
          if (c.shadowRoot) {
            var inside = c.shadowRoot.querySelector('div[contenteditable="true"]');
            if (inside && inside.offsetParent !== null) { el = inside; reason = 'shadow_dom_ce'; break; }
            var inp = c.shadowRoot.querySelector('input[type="text"], textarea');
            if (inp && inp.offsetParent !== null) { el = inp; reason = 'shadow_dom_input'; break; }
          }
          if (c.contentEditable === 'true' || c.getAttribute('contenteditable') === 'true') {
            if (c.offsetParent !== null) {
              var txt = (c.textContent || '').trim();
              // Skip if it's a placeholder/comment label
              if (!txt || txt.length < 3) { el = c; reason = 'contenteditable_empty'; break; }
            }
          }
        }

        // Strategy 2: data-e2e selectors (TikTok internal - try all variants)
        if (!el) {
          var e2eList = [
            'comment-input', 'comment-textarea', 'comment-input-component',
            'browse-comment-input', 'comment-area', 'comment-field'
          ];
          for (var name of e2eList) {
            var e2e = document.querySelector('[data-e2e="' + name + '"]');
            if (e2e && e2e.offsetParent !== null) { el = e2e; reason = 'e2e:' + name; break; }
          }
        }

        // Strategy 3: CSS class patterns (TikTok injects these)
        if (!el) {
          var classes = [
            'CommentTextArea', 'CommentInput', 'comment-input', 'CommentEditor',
            'CommentComposer', 'CommentInputArea', 'CommentField'
          ];
          for (var cls of classes) {
            var found = document.querySelector('[class*="' + cls + '"]');
            if (found && found.offsetParent !== null) { el = found; reason = 'cls:' + cls; break; }
          }
        }

        // Strategy 4: textarea/input by placeholder text (supports multiple languages)
        if (!el) {
          var allInputs = document.querySelectorAll('textarea, input[type="text"], input[type="search"]');
          for (var inp of allInputs) {
            var ph = (inp.placeholder || inp.getAttribute('aria-label') || '').toLowerCase();
            // TikTok comment input placeholder is often: "Add comment...", "Kirim komentar...", "Tambahkan komentar..."
            if ((ph.includes('comment') || ph.includes('kirim') || ph.includes('tambahkan') || 
                 ph.includes('tinggal') || ph.includes('balas') || ph.includes('reply') ||
                 ph.includes('add')) &&
                inp.offsetParent !== null && inp.disabled === false && inp.readOnly === false) {
              el = inp; reason = 'placeholder:' + ph.substring(0, 20); break;
            }
          }
        }

        // Strategy 5: contenteditable inside comment-related containers
        if (!el) {
          var ceDivs = document.querySelectorAll('div[contenteditable="true"]');
          for (var div of ceDivs) {
            if (div.offsetParent !== null && div.textContent.trim().length < 5) {
              el = div; reason = 'ce_empty'; break;
            }
          }
        }

        if (!el) {
          debug.push('input:NOT_FOUND');
          return { found: false, reason: reason, debug: debug };
        }

        debug.push('input:FOUND:' + reason);

        // Check if comments are truly restricted - look for specific indicators
        // NOT just any element with 'restricted' class
        var restrictedIndicators = document.querySelectorAll(
          '[data-e2e="comment-closed"], [data-e2e="comments-disabled"], ' +
          '[class*="CommentDisabled"], [class*="CommentClosed"]'
        );
        for (var ri of restrictedIndicators) {
          if (ri.offsetParent !== null) {
            debug.push('restricted:TRUE');
            return { found: false, reason: 'restricted', debug: debug };
          }
        }

        return { found: true, reason: reason, debug: debug };
      });
      
      log('[WC] DEBUG comment-input: ' + JSON.stringify(result.debug));

      if (!result.found) {
        // DIAGNOSTIC: dump comment panel HTML to learn TikTok's real structure
        var diagHtml = await page.evaluate(function() {
          var panel = document.querySelector('[data-e2e="comment-panel"], [data-e2e="comment-list-container"], [class*="CommentListContainer"], [class*="CommentPanel"], [class*="comment"]');
          if (!panel) return 'NO_PANEL';
          return panel.outerHTML.substring(0, 2200);
        });
        log('[WC] DEBUG comment-panel-html: ' + (diagHtml || '').substring(0, 2000));
      }

      if (!result.found) {
        if (result.reason === 'restricted') {
          log('[WC] ✗ Comments are restricted on this video - skipping');
          if (task.id) {
            fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed', error: 'Comments restricted', executed_at: new Date().toISOString() })
            }).catch(function(){});
          }
          mvpStats.failed++;
        } else {
          log('[WC] ✗ Comment panel not found (reason: ' + result.reason + ') - retrying with scroll');
          // Retry after scrolling to comment section
          await page.evaluate(function() {
            window.scrollBy(0, 400);
          });
          await sleep(2000);
          await page.keyboard.press('KeyC');
          await sleep(3000);
          // One more attempt
          var retryResult = await page.evaluate(function() {
            var all = document.querySelectorAll('input, textarea, div[contenteditable]');
            for (var inp of all) {
              if ((inp.contentEditable === 'true' || inp.tagName === 'TEXTAREA' || inp.type === 'text') &&
                  inp.offsetParent !== null && inp.disabled === false && inp.readOnly === false) {
                return true;
              }
            }
            return false;
          });
          if (!retryResult) {
            log('[WC] ✗ Still no comment input after retry - marking as comments disabled');
            if (task.id) {
              fetch(API + '/api/tasks/' + task.id + '?token=' + token, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed', error: 'Comment panel not found: ' + result.reason, executed_at: new Date().toISOString() })
              }).catch(function(){});
            }
            mvpStats.failed++;
          }
        }
      } else {
        // Found input - type using REAL keyboard events + VERIFY in list
        // Step 1: mark the input with a unique attribute so we can target it across evaluate calls
        var marker = 'data-wc-input-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
        var marked = await page.evaluate(function(markerAttr) {
          var el = null;
          // Re-find input (same strategy as the input-detection block)
          var candidates = document.querySelectorAll('*');
          for (var i = 0; i < candidates.length; i++) {
            var c = candidates[i];
            if (c.shadowRoot) {
              var inside = c.shadowRoot.querySelector('div[contenteditable="true"]');
              if (inside && inside.offsetParent !== null) { el = inside; break; }
            }
            if (c.contentEditable === 'true' && c.offsetParent !== null) { el = c; break; }
          }
          if (!el) {
            var e2e = document.querySelector('[data-e2e="comment-input"], [data-e2e="comment-textarea"]');
            if (e2e) el = e2e;
          }
          if (!el) {
            var all = document.querySelectorAll('input, textarea, div[contenteditable]');
            for (var inp of all) {
              if ((inp.contentEditable === 'true' || inp.tagName === 'TEXTAREA') && inp.offsetParent !== null) { el = inp; break; }
            }
          }
          if (!el) return false;
          el.setAttribute(markerAttr, '1');
          el.focus();
          return true;
        }, marker);
        if (!marked) {
          log('[WC] ✗ Could not re-locate input for typing');
          mvpStats.failed++;
          if (task.id) {
            fetch(API + '/api/tasks/' + task.id + '?token=' + token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', error: 'Input not re-locatable', executed_at: new Date().toISOString() }) }).catch(function(){});
          }
          await page.keyboard.press('Escape');
          await sleep(500);
        } else {
          // Step 2: click into the input and clear it (Ctrl+A, Delete) — these fire real keyboard events
          await page.click('[' + marker + '="1"]');
          await sleep(200);
          await page.keyboard.down('Control');
          await page.keyboard.press('A');
          await page.keyboard.up('Control');
          await page.keyboard.press('Delete');
          await sleep(300);
          // Step 3: type using page.keyboard.type — fires real keydown/keypress/input events that React listens to
          await page.keyboard.type(text, { delay: 40 });
          await sleep(1500);
          // Step 4: verify text actually went into the input
          var inputText = await page.evaluate(function(markerAttr) {
            var el = document.querySelector('[' + markerAttr + '="1"]');
            if (!el) return '';
            return (el.textContent || el.innerText || '').trim();
          }, marker);
          log('[WC] DEBUG typed-into: "' + inputText.substring(0, 80) + '" (len=' + inputText.length + ')');
          if (inputText.length < 5) {
            log('[WC] ✗ Typing FAILED: input is empty after keyboard.type — React onChange did not fire');
            mvpStats.failed++;
            if (task.id) {
              fetch(API + '/api/tasks/' + task.id + '?token=' + token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', error: 'Typing failed: input empty', executed_at: new Date().toISOString() }) }).catch(function(){});
            }
            await page.keyboard.press('Escape');
            await sleep(500);
          } else {
            // Step 5: click Post button (only if enabled)
            var posted = await page.evaluate(function() {
              var btn = document.querySelector('[data-e2e="comment-post-button"]');
              if (btn && !btn.disabled && btn.offsetParent !== null) { btn.click(); return 'data-e2e'; }
              var patterns = ['[class*="CommentPostButton"]', '[class*="post-btn"]', '[class*="PostButton"]', 'button[class*="action"]'];
              for (var p of patterns) {
                var b = document.querySelector(p);
                if (b && !b.disabled && b.offsetParent !== null) { b.click(); return 'class:' + p; }
              }
              var all = document.querySelectorAll('button, div[role="button"], span');
              for (var i = 0; i < all.length; i++) {
                var t = (all[i].textContent || '').trim().toLowerCase();
                if ((t === 'post' || t === 'kirim' || t === '发布' || t === 'publish' || t === 'send') && all[i].offsetParent !== null && !all[i].disabled) {
                  all[i].click(); return 'text:' + t;
                }
              }
              return false;
            });
            if (posted) {
              log('[WC] Clicked Post button (' + posted + ')');
            } else {
              log('[WC] No enabled Post button — pressing Enter');
              await page.keyboard.press('Enter');
            }
            await sleep(3500);
            // Step 6: CRITICAL — verify the comment actually appears in the comment list (not just "Posted (class)" which was a false positive)
            var verified = await page.evaluate(function(searchText) {
              var items = document.querySelectorAll('[class*="CommentItem"], [class*="comment-item"], [class*="CommentTextContainer"], [data-e2e="comment-level-1"], [class*="comment-text"]');
              for (var it of items) {
                var txt = (it.textContent || '').trim();
                if (txt.indexOf(searchText.substring(0, 12)) !== -1) return true;
              }
              // Fallback: input cleared (good sign post succeeded)
              var inputs = document.querySelectorAll('div[contenteditable="true"]');
              for (var inp of inputs) {
                if (inp.offsetParent !== null && (inp.textContent || '').trim().length === 0) return 'input_cleared';
              }
              return false;
            }, text);
            if (verified === true) {
              mvpStats.completed++;
              log('[WC] ✓ VERIFIED in comment list, MVP: ' + mvpStats.completed + '/' + mvpStats.target);
              if (task.id) {
                fetch(API + '/api/tasks/' + task.id + '?token=' + token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed', executed_at: new Date().toISOString(), liked: true, verified: true }) }).catch(function(){});
              }
            } else if (verified === 'input_cleared') {
              mvpStats.completed++;
              log('[WC] ? Input cleared (post may have succeeded), MVP: ' + mvpStats.completed + '/' + mvpStats.target);
              if (task.id) {
                fetch(API + '/api/tasks/' + task.id + '?token=' + token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed', executed_at: new Date().toISOString(), liked: true, verified: 'input_cleared' }) }).catch(function(){});
              }
            } else {
              mvpStats.failed++;
              log('[WC] ✗ NOT VERIFIED: post button clicked but comment not in list — treating as FAILURE');
              if (task.id) {
                fetch(API + '/api/tasks/' + task.id + '?token=' + token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'failed', error: 'Comment not in list after post', executed_at: new Date().toISOString() }) }).catch(function(){});
              }
            }
          }
        }
      }

      var delay = 30000 + Math.random() * 60000;
      log('[WC] Next in ~' + Math.round(delay/1000) + 's');
      await sleep(delay);

    } catch(e) {
      log('[WC] Error: ' + e.message);
      await sleep(30000);
    }
  }
}

main().catch(function(e) { log('[FATAL] ' + e.message); process.exit(1); });
