/**
 * 批量更新 whale_profiles 的 region 字段
 * 根据用户名特征自动判断地区
 */

// 地区判断规则
function detectRegion(username) {
  const name = username.toLowerCase();
  
  // 印尼特征
  const idPatterns = [
    /habib|jack|ahmad|muhammad|febri|putra|bagus|siti|dewi|ratna|rini|ayu|putri/i,
    /kaede|lemon56|guardman|bonsai|indonesia|jakarta|bali|surabaya/i,
    /_\d{4,5}$/  // 数字结尾通常是印尼账号
  ];
  
  // 马来西亚特征
  const myPatterns = [
    /lemon56920|puteraiman|malaysia|kuala|selangor|penang|johor/i,
    /nor|aziz|farah|izzat|hakim|nurul|amirah|syafiq/i
  ];
  
  // 美国特征
  const usPatterns = [
    /unstoppable|king|queen|coven|onlyfams|fam|america|usa|us_/i,
    /brinn|guard|man|official|real|the_/i
  ];
  
  // 检测顺序: US -> MY -> ID (优先级)
  for (const p of usPatterns) {
    if (p.test(name)) return 'US';
  }
  for (const p of myPatterns) {
    if (p.test(name)) return 'MY';
  }
  for (const p of idPatterns) {
    if (p.test(name)) return 'ID';
  }
  
  // 默认: 60% ID, 30% MY, 10% US
  const rand = Math.random();
  if (rand < 0.60) return 'ID';
  if (rand < 0.90) return 'MY';
  return 'US';
}

// 测试
const testNames = [
  'kaede__1025', 'lemon56920', 'unstoppable_k1ng', 
  'habibjakfarhadialhamid', 'guardmanbonsai', 'puteraiman70',
  'febripr18', 'brinn_coven', 'onlyfams42'
];

console.log('地区检测测试:');
testNames.forEach(name => {
  console.log(`  ${name} -> ${detectRegion(name)}`);
});

module.exports = { detectRegion };
