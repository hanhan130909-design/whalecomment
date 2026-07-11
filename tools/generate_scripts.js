/**
 * WhaleComment 话术生成器
 * 生成 2000 条话术 (1000 英语 + 1000 印尼语)
 * 按 persona 分类: comprehensive, casual, formal, friendly
 */

const fs = require('fs');

// 英语话术模板 (按 persona 分类)
const englishTemplates = {
  comprehensive: [
    "Your content is absolutely amazing! {name}, you're killing it! 🔥",
    "This is exactly what I needed to see today! Thanks {name}! 💎",
    "Wow! {name}, you never disappoint! This is gold! ⭐",
    "Incredible work as always! You're the best {name}! 🌟",
    "This deserves way more attention! {name} you're a star! ✨",
    "Quality content right here! {name} keep doing what you're doing! 💪",
    "This is the kind of content I live for! Thanks {name}! 🙌",
    "{name}, you just made my day! This is incredible! 💫",
    "Hands down one of the best posts I've seen! {name}! 👏",
    "This is pure gold! {name}, you're a genius! 🏆",
    "Every post from {name} is a masterpiece! 🎨",
    "I can't get enough of your content {name}! This is amazing! 💯",
    "You're on another level {name}! This is brilliant! 🚀",
    "This is why I follow you {name}! Always top tier! 👑",
    "Absolutely stunning! {name}, you've outdone yourself! 💎",
    "This deserves to go viral! {name} is a legend! 🔥",
    "My jaw dropped seeing this! {name}, incredible! 😮",
    "You're setting the standard {name}! This is perfect! 📈",
    "I'm speechless! {name}, this is phenomenal! 🌟",
    "Top notch content as always from {name}! Keep it up! ✨"
  ],
  casual: [
    "Love this {name}! So good! 😍",
    "This is fire {name}! 🔥🔥",
    "Damn {name}, you nailed it! 💯",
    "Yesss {name}! This is lit! 🔥",
    "So awesome {name}! Love it! ❤️",
    "This hits different {name}! 🎯",
    "Oh wow {name}! Amazing! 😲",
    "You killed this {name}! 💪",
    "This is it {name}! Perfect! ✨",
    "Big fan {name}! This rules! 👑",
    "Omg {name}! So good! 😱",
    "This slaps {name}! 🔥",
    "Love everything about this {name}! 💕",
    "You did that {name}! 💅",
    "This is everything {name}! 🙌",
    "So into this {name}! 🔥",
    "This speaks to me {name}! 💫",
    "Yess {name}! Exactly this! 👏",
    "Needed this {name}! Thanks! 🙏",
    "Straight fire {name}! 🔥🔥🔥"
  ],
  formal: [
    "Excellent content, {name}. Very well done. 👏",
    "This is truly impressive work, {name}. 👌",
    "Outstanding quality as always, {name}. 🌟",
    "Thank you for sharing this, {name}. Very valuable. 📚",
    "This demonstrates great skill, {name}. Well executed. 💼",
    "I appreciate the quality of this content, {name}. 📈",
    "This is professionally done, {name}. Very impressive. 🎯",
    "Your work continues to excel, {name}. Keep it up. 📊",
    "This is a fine example of great content, {name}. 🏆",
    "Remarkable effort, {name}. This shows dedication. 💪",
    "Your content standard is remarkable, {name}. 🌟",
    "This is thoroughly well-made, {name}. Quality work. ✅",
    "Your consistency is admirable, {name}. Well done. 📋",
    "This reflects great attention to detail, {name}. 🎨",
    "Your expertise shows, {name}. Very professional. 💎",
    "This is commendable work, {name}. Keep progressing. 📈",
    "Your content delivery is excellent, {name}. 🎬",
    "This meets high standards, {name}. Very good. ✨",
    "Your effort is evident, {name}. Quality post. 📝",
    "This is noteworthy content, {name}. Well crafted. 🏅"
  ],
  friendly: [
    "Hey {name}! This made my day so much better! 🥰",
    "You always know how to brighten things up {name}! ☀️",
    "Sending love {name}! This is wonderful! 💕",
    "You're the best {name}! Thanks for sharing! 🤗",
    "This brought such a smile to my face {name}! 😊",
    "You're amazing {name}! Never forget that! 💫",
    "So happy to see this {name}! You're wonderful! 🌈",
    "Your content always makes me happy {name}! 💝",
    "You deserve all the love {name}! This is great! 💖",
    "What a joy to see your content {name}! 🎉",
    "You're a blessing {name}! Thanks for this! 🙏",
    "This made me feel so good {name}! 🥹",
    "You're so talented {name}! Keep shining! ⭐",
    "Your positivity is contagious {name}! 🌟",
    "You make the world better {name}! Love this! 💗",
    "So grateful for your content {name}! 🙌",
    "You're inspiring {name}! This is beautiful! 🌸",
    "Thanks for being you {name}! Amazing content! 💫",
    "Your energy is wonderful {name}! Love it! 💚",
    "You're such a light {name}! Beautiful post! ✨"
  ]
};

// 印尼语话术模板 (按 persona 分类)
const indonesianTemplates = {
  comprehensive: [
    "Kontennya luar biasa banget! {name}, kamu juara! 🔥",
    "Ini yang aku butuh lihat hari ini! Makasih {name}! 💎",
    "Wah! {name}, kamu nggak pernah ngecewain! Ini mahal! ⭐",
    "Keren banget kayak biasanya! Kamu yang terbaik {name}! 🌟",
    "Ini layak perhatian lebih! {name} kamu bintang! ✨",
    "Konten berkualitas di sini! {name} terus berkarya! 💪",
    "Ini jenis konten yang aku cari! Makasih {name}! 🙌",
    "{name}, kamu buat hariku! Ini keren banget! 💫",
    "Salah satu konten terbaik yang aku lihat! {name}! 👏",
    "Ini emas murni! {name}, kamu genius! 🏆",
    "Setiap postingan dari {name} adalah mahakarya! 🎨",
    "Aku nggak bisa berhenti lihat kontenmu {name}! Ini amazing! 💯",
    "Kamu di level lain {name}! Ini brilian! 🚀",
    "Ini alasan aku follow kamu {name}! Selalu top! 👑",
    "Luar biasa memukau! {name}, kamu melebihi ekspektasi! 💎",
    "Ini layak viral! {name} adalah legenda! 🔥",
    "Rahangku turun lihat ini! {name}, keren! 😮",
    "Kamu set standar {name}! Ini sempurna! 📈",
    "Aku nggak bisa berkata-kata! {name}, ini fenomenal! 🌟",
    "Konten kelas atas dari {name}! Terus maju! ✨"
  ],
  casual: [
    "Suka banget {name}! Keren! 😍",
    "Ini api {name}! 🔥🔥",
    "Wah {name}, kamu berhasil! 💯",
    "Yesss {name}! Ini seru! 🔥",
    "Keren banget {name}! Suka! ❤️",
    "Ini beda {name}! 🎯",
    "Wah {name}! Amazing! 😲",
    "Kamu berhasil {name}! 💪",
    "Ini dia {name}! Sempurna! ✨",
    "Fans berat {name}! Ini juara! 👑",
    "Wah {name}! Bagus banget! 😱",
    "Ini mantap {name}! 🔥",
    "Suka semua tentang ini {name}! 💕",
    "Kamu lakukan itu {name}! 💅",
    "Ini semua {name}! 🙌",
    "Suka ini {name}! 🔥",
    "Ini bicara padaku {name}! 💫",
    "Yess {name}! Persis ini! 👏",
    "Butuh ini {name}! Makasih! 🙏",
    "Langsung api {name}! 🔥🔥🔥"
  ],
  formal: [
    "Konten yang sangat baik, {name}. Sangat bagus. 👏",
    "Ini benar-benar karya mengesankan, {name}. 👌",
    "Kualitas luar biasa seperti biasanya, {name}. 🌟",
    "Terima kasih sudah berbagi ini, {name}. Sangat berharga. 📚",
    "Ini menunjukkan keahlian besar, {name}. Eksekusi bagus. 💼",
    "Saya menghargai kualitas konten ini, {name}. 📈",
    "Ini dikerjakan secara profesional, {name}. Sangat mengesankan. 🎯",
    "Karya Anda terus berkembang, {name}. Terus maju. 📊",
    "Ini contoh bagus dari konten hebat, {name}. 🏆",
    "Usaha yang luar biasa, {name}. Ini menunjukkan dedikasi. 💪",
    "Standar konten Anda luar biasa, {name}. 🌟",
    "Ini dibuat dengan sangat baik, {name}. Karya berkualitas. ✅",
    "Konsistensi Anda mengagumkan, {name}. Bagus sekali. 📋",
    "Ini menunjukkan perhatian detail besar, {name}. 🎨",
    "Keahlian Anda terlihat, {name}. Sangat profesional. 💎",
    "Ini karya terpuji, {name}. Terus maju. 📈",
    "Penyampaian konten Anda sangat baik, {name}. 🎬",
    "Ini memenuhi standar tinggi, {name}. Sangat bagus. ✨",
    "Usaha Anda terlihat, {name}. Postingan berkualitas. 📝",
    "Ini konten yang patut dicatat, {name}. Dibuat dengan baik. 🏅"
  ],
  friendly: [
    "Hai {name}! Ini bikin hariku lebih baik! 🥰",
    "Kamu selalu tahu cara bikin suasana cerah {name}! ☀️",
    "Kirim cinta {name}! Ini luar biasa! 💕",
    "Kamu yang terbaik {name}! Makasih sudah berbagi! 🤗",
    "Ini bikin senyum di wajahku {name}! 😊",
    "Kamu amazing {name}! Jangan lupa itu! 💫",
    "Senang lihat ini {name}! Kamu hebat! 🌈",
    "Kontenmu selalu bikin aku senang {name}! 💝",
    "Kamu layak semua cinta {name}! Ini bagus! 💖",
    "Senang lihat kontenmu {name}! 🎉",
    "Kamu adalah berkah {name}! Makasih untuk ini! 🙏",
    "Ini bikin aku merasa baik {name}! 🥹",
    "Kamu berbakat {name}! Terus bersinar! ⭐",
    "Positivitasmu menular {name}! 🌟",
    "Kamu bikin dunia lebih baik {name}! Suka ini! 💗",
    "Berterima kasih untuk kontenmu {name}! 🙌",
    "Kamu menginspirasi {name}! Ini indah! 🌸",
    "Makasih jadi dirimu {name}! Konten amazing! 💫",
    "Energimu luar biasa {name}! Suka! 💚",
    "Kamu cahaya {name}! Postingan indah! ✨"
  ]
};

// Emoji 集合
const emojis = {
  fire: ['🔥', '🔥🔥', '🔥🔥🔥', '💯', '⚡', '💥', '✨', '🌟', '⭐', '💫'],
  love: ['❤️', '💕', '💖', '💗', '💝', '💘', '🥰', '😍', '🥹', '💕'],
  praise: ['👏', '🙌', '👍', '💪', '👑', '🏆', '🥇', '✨', '🌟', '💎'],
  casual: ['😎', '🤩', '😋', '🤗', '😉', '😊', '🥳', '🎉', '🎊', '✨']
};

// 变体生成函数
function generateVariants(baseText, lang, persona, count) {
  const variants = [];
  const emojiPool = [...emojis.fire, ...emojis.love, ...emojis.praise, ...emojis.casual];
  
  for (let i = 0; i < count; i++) {
    let text = baseText;
    
    // 随机替换 emoji
    const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
    
    // 添加随机变体
    if (i % 3 === 0) {
      text = text.replace(/[🔥💯⭐🌟✨💫👏🙌👑🏆💎]+/g, randomEmoji);
    }
    
    // 添加语气变体
    const prefixes = lang === 'en' 
      ? ['', 'Wow! ', 'Amazing! ', 'Incredible! ', 'Love it! ', 'So good! ', 'Yess! ', 'Finally! ', 'Beautiful! ', 'Perfect! ']
      : ['', 'Wah! ', 'Keren! ', 'Bagus! ', 'Suka! ', 'Mantap! ', 'Yess! ', 'Akhirnya! ', 'Indah! ', 'Sempurna! '];
    
    if (i % 5 === 0 && i > 0) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      text = prefix + text.charAt(0).toLowerCase() + text.slice(1);
    }
    
    variants.push({
      content: text,
      lang: lang,
      persona: persona,
      success_rate: 0.75 + Math.random() * 0.24, // 0.75 - 0.99
      created_at: new Date().toISOString()
    });
  }
  
  return variants;
}

// 主生成函数
function generateAllScripts() {
  const allScripts = [];
  
  // 英语话术
  Object.entries(englishTemplates).forEach(([persona, templates]) => {
    templates.forEach(template => {
      // 每个模板生成 12 个变体 (20 templates * 4 personas * 12 = 960)
      const variants = generateVariants(template, 'en', persona, 12);
      allScripts.push(...variants);
    });
  });
  
  // 印尼语话术
  Object.entries(indonesianTemplates).forEach(([persona, templates]) => {
    templates.forEach(template => {
      // 每个模板生成 12 个变体 (20 templates * 4 personas * 12 = 960)
      const variants = generateVariants(template, 'id', persona, 12);
      allScripts.push(...variants);
    });
  });
  
  // 补充到 2000
  while (allScripts.length < 2000) {
    const lang = Math.random() > 0.5 ? 'en' : 'id';
    const personas = ['comprehensive', 'casual', 'formal', 'friendly'];
    const persona = personas[Math.floor(Math.random() * personas.length)];
    const templates = lang === 'en' ? englishTemplates[persona] : indonesianTemplates[persona];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const variant = generateVariants(template, lang, persona, 1)[0];
    variant.success_rate = 0.70 + Math.random() * 0.29;
    allScripts.push(variant);
  }
  
  // 打乱顺序
  for (let i = allScripts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allScripts[i], allScripts[j]] = [allScripts[j], allScripts[i]];
  }
  
  return allScripts.slice(0, 2000);
}

// 生成并保存
const scripts = generateAllScripts();
const output = {
  generated_at: new Date().toISOString(),
  total: scripts.length,
  by_lang: {
    en: scripts.filter(s => s.lang === 'en').length,
    id: scripts.filter(s => s.lang === 'id').length
  },
  by_persona: {
    comprehensive: scripts.filter(s => s.persona === 'comprehensive').length,
    casual: scripts.filter(s => s.persona === 'casual').length,
    formal: scripts.filter(s => s.persona === 'formal').length,
    friendly: scripts.filter(s => s.persona === 'friendly').length
  },
  scripts: scripts
};

fs.writeFileSync('comment_scripts_2000.json', JSON.stringify(output, null, 2));
console.log('✅ Generated', scripts.length, 'scripts');
console.log('📊 By language:', output.by_lang);
console.log('📊 By persona:', output.by_persona);
console.log('📁 Saved to comment_scripts_2000.json');
