/**
 * 将 2000 条话术导入 Supabase
 * 需要先在 Render 设置环境变量，或直接通过 API
 */

const fs = require('fs');
const https = require('https');

// Supabase 配置
const SUPABASE_URL = 'https://sxsmjfkxllepntgzfqbl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_d30e83ittDALlQtv0nJF4w_Cz7xpTLt';

// 读取生成的话术
const data = JSON.parse(fs.readFileSync('comment_scripts_2000.json', 'utf8'));
const scripts = data.scripts;

console.log('Total scripts to import:', scripts.length);

// 批量导入函数
async function importBatch(batch) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(batch);
    const options = {
      hostname: 'sxsmjfkxllepntgzfqbl.supabase.co',
      port: 443,
      path: '/rest/v1/comment_scripts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, count: batch.length });
        } else {
          resolve({ success: false, status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 分批导入
async function importAll() {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < scripts.length; i += batchSize) {
    batches.push(scripts.slice(i, i + batchSize));
  }
  
  console.log('Total batches:', batches.length);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Importing batch ${i + 1}/${batches.length}...`);
    const result = await importBatch(batches[i]);
    
    if (result.success) {
      success += result.count;
      console.log(`  ✅ Batch ${i + 1}: ${result.count} scripts`);
    } else {
      failed += batches[i].length;
      console.log(`  ❌ Batch ${i + 1} failed:`, result.status, result.body.substring(0, 100));
    }
    
    // 避免 rate limit
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n=== Import Complete ===');
  console.log('Success:', success);
  console.log('Failed:', failed);
}

importAll().catch(console.error);
