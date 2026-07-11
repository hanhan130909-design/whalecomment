/**
 * WhaleComment 金主地区分布
 * 60% 印尼 (ID), 30% 马来西亚 (MY), 10% 美国 (US)
 * 
 * 这个脚本修改 server.js 的 generate-tasks 逻辑
 */

const REGION_DISTRIBUTION = {
  ID: 0.60, // 60% 印尼
  MY: 0.30, // 30% 马来西亚
  US: 0.10  // 10% 美国
};

// 模拟金主选择逻辑
function selectWhaleByRegion(whales) {
  const rand = Math.random();
  let targetRegion;
  
  if (rand < 0.60) {
    targetRegion = 'ID';
  } else if (rand < 0.90) {
    targetRegion = 'MY';
  } else {
    targetRegion = 'US';
  }
  
  // 从该地区随机选一个
  const regionWhales = whales.filter(w => w.region === targetRegion);
  if (regionWhales.length > 0) {
    return regionWhales[Math.floor(Math.random() * regionWhales.length)];
  }
  
  // fallback: 随机选一个
  return whales[Math.floor(Math.random() * whales.length)];
}

// 根据地区选择话术语言
function getScriptLangByRegion(region) {
  const langMap = {
    ID: 'id', // 印尼 -> 印尼语
    MY: 'id', // 马来西亚 -> 印尼语 (接近)
    US: 'en'  // 美国 -> 英语
  };
  return langMap[region] || 'en';
}

module.exports = { REGION_DISTRIBUTION, selectWhaleByRegion, getScriptLangByRegion };

console.log('Region distribution:', REGION_DISTRIBUTION);
