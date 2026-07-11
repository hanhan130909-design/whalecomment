#!/usr/bin/env node
/**
 * WhaleComment Admin CLI
 * 管理运营账号的命令行工具
 * 
 * Usage:
 *   node admin.js create <name> [quota] [days]
 *   node admin.js list
 *   node admin.js suspend <token>
 *   node admin.js resume <token>
 *   node admin.js delete <token>
 *   node admin.js suspend-all
 */

const API = 'https://prolific-adventure-production-9b13.up.railway.app';
const ADMIN_TOKEN = 'wc_admin_2026_secret_token';

async function request(method, path, body) {
  const url = API + path;
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-token': ADMIN_TOKEN
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const resp = await fetch(url, options);
  const data = await resp.json();
  
  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }
  
  return data;
}

// Create operator
async function createOperator(name, quota, days) {
  console.log(`\n🔧 Creating operator: ${name}`);
  
  const data = await request('POST', '/api/admin/operators', {
    name,
    quota: parseInt(quota) || 100,
    expires_days: parseInt(days) || 30
  });
  
  console.log('\n✅ Operator created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`姓名: ${data.operator.name}`);
  console.log(`Token: ${data.operator.token}`);
  console.log(`配额: ${data.operator.quota}/天`);
  console.log(`过期: ${new Date(data.operator.expires_at).toLocaleDateString('zh-CN')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  请将Token发送给运营人员（Token只显示一次）\n');
  
  return data.operator;
}

// List operators
async function listOperators() {
  console.log('\n📋 Operator List\n');
  
  const data = await request('GET', '/api/admin/operators');
  
  if (data.operators.length === 0) {
    console.log('No operators found.\n');
    return;
  }
  
  console.log('┌──────┬──────────────┬────────┬──────┬──────────┬────────────┐');
  console.log('│ 序号 │ 姓名         │ 状态   │ 配额 │ 已用     │ 过期时间   │');
  console.log('├──────┼──────────────┼────────┼──────┼──────────┼────────────┤');
  
  data.operators.forEach((op, i) => {
    const status = op.status === 'active' ? '✅活跃' : 
                   op.status === 'suspended' ? '⏸️暂停' : '❌过期';
    const remaining = op.quota - op.used_today;
    const expires = new Date(op.expires_at).toLocaleDateString('zh-CN');
    
    console.log(`│ ${(i+1).toString().padStart(4)} │ ${op.name.padEnd(12)} │ ${status.padEnd(6)} │ ${op.quota.toString().padStart(4)}/${remaining.toString().padStart(2)} │ ${op.used_today.toString().padStart(8)}/${op.quota} │ ${expires.padEnd(10)} │`);
  });
  
  console.log('└──────┴──────────────┴────────┴──────┴──────────┴────────────┘');
  console.log(`\n总计: ${data.total} 个运营账号\n`);
}

// Suspend operator
async function suspendOperator(token) {
  console.log(`\n⏸️  Suspending operator: ${token.substring(0, 12)}...`);
  
  const data = await request('PATCH', `/api/admin/operators/${token}`, {
    status: 'suspended'
  });
  
  console.log(`\n✅ Operator "${data.operator.name}" suspended\n`);
}

// Resume operator
async function resumeOperator(token) {
  console.log(`\n▶️  Resuming operator: ${token.substring(0, 12)}...`);
  
  const data = await request('PATCH', `/api/admin/operators/${token}`, {
    status: 'active'
  });
  
  console.log(`\n✅ Operator "${data.operator.name}" resumed\n`);
}

// Delete operator
async function deleteOperator(token) {
  console.log(`\n🗑️  Deleting operator: ${token.substring(0, 12)}...`);
  
  const data = await request('DELETE', `/api/admin/operators/${token}`);
  
  console.log(`\n✅ Operator deleted\n`);
}

// Suspend all
async function suspendAll() {
  console.log('\n⏸️  Suspending all operators...\n');
  
  const data = await request('POST', '/api/admin/operators/suspend-all');
  
  console.log(`✅ ${data.message}\n`);
}

// Show help
function showHelp() {
  console.log(`
WhaleComment Admin CLI

Usage:
  node admin.js <command> [args]

Commands:
  create <name> [quota] [days]   创建运营账号
                                 quota: 每日配额 (默认100)
                                 days: 有效期天数 (默认30)
  
  list                           查看所有运营账号
  
  suspend <token>                暂停运营账号
  
  resume <token>                 恢复运营账号
  
  delete <token>                 删除运营账号
  
  suspend-all                    暂停所有运营账号

Examples:
  node admin.js create 张三 100 30
  node admin.js list
  node admin.js suspend wc_op_abc123...
  node admin.js resume wc_op_abc123...
  node admin.js delete wc_op_abc123...
  node admin.js suspend-all

Environment:
  ADMIN_TOKEN=xxx                管理员Token (默认内置)
`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  try {
    switch (cmd) {
      case 'create':
        if (!args[1]) {
          console.error('❌ Error: Name is required');
          showHelp();
          process.exit(1);
        }
        await createOperator(args[1], args[2], args[3]);
        break;
        
      case 'list':
        await listOperators();
        break;
        
      case 'suspend':
        if (!args[1]) {
          console.error('❌ Error: Token is required');
          process.exit(1);
        }
        await suspendOperator(args[1]);
        break;
        
      case 'resume':
        if (!args[1]) {
          console.error('❌ Error: Token is required');
          process.exit(1);
        }
        await resumeOperator(args[1]);
        break;
        
      case 'delete':
        if (!args[1]) {
          console.error('❌ Error: Token is required');
          process.exit(1);
        }
        await deleteOperator(args[1]);
        break;
        
      case 'suspend-all':
        await suspendAll();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        if (cmd) {
          console.error(`❌ Unknown command: ${cmd}\n`);
        }
        showHelp();
        process.exit(cmd ? 1 : 0);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
