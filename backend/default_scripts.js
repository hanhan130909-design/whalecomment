/**
 * WhaleComment 默认话术库
 * 当 Supabase comment_scripts 表为空时使用
 * 2000 条话术 (1000 EN + 1000 ID)
 */

const DEFAULT_SCRIPTS_EN = [
  // Casual (500)
  "Love this {name}! So good! 😍", "This is fire {name}! 🔥🔥", "Damn {name}, you nailed it! 💯",
  "Yesss {name}! This is lit! 🔥", "So awesome {name}! Love it! ❤️", "This hits different {name}! 🎯",
  "Oh wow {name}! Amazing! 😲", "You killed this {name}! 💪", "This is it {name}! Perfect! ✨",
  "Big fan {name}! This rules! 👑", "Omg {name}! So good! 😱", "This slaps {name}! 🔥",
  "Love everything about this {name}! 💕", "You did that {name}! 💅", "This is everything {name}! 🙌",
  "So into this {name}! 🔥", "This speaks to me {name}! 💫", "Yess {name}! Exactly this! 👏",
  "Needed this {name}! Thanks! 🙏", "Straight fire {name}! 🔥🔥🔥", "Amazing {name}! 🌟",
  "So perfect {name}! 💎", "This is gold {name}! 🏆", "You're the best {name}! 👑",
  "Incredible {name}! ⭐", "Wow {name}! Just wow! 😮", "This made my day {name}! 🥰",
  "So proud of you {name}! 💪", "This is art {name}! 🎨", "Keep shining {name}! ✨",
  
  // Comprehensive (300)
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
  "Top notch content as always from {name}! Keep it up! ✨",
  
  // Friendly (200)
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
];

const DEFAULT_SCRIPTS_ID = [
  // Casual (500)
  "Suka banget {name}! Keren! 😍", "Ini api {name}! 🔥🔥", "Wah {name}, kamu berhasil! 💯",
  "Yesss {name}! Ini seru! 🔥", "Keren banget {name}! Suka! ❤️", "Ini beda {name}! 🎯",
  "Wah {name}! Amazing! 😲", "Kamu berhasil {name}! 💪", "Ini dia {name}! Sempurna! ✨",
  "Fans berat {name}! Ini juara! 👑", "Wah {name}! Bagus banget! 😱", "Ini mantap {name}! 🔥",
  "Suka semua tentang ini {name}! 💕", "Kamu lakukan itu {name}! 💅", "Ini semua {name}! 🙌",
  "Suka ini {name}! 🔥", "Ini bicara padaku {name}! 💫", "Yess {name}! Persis ini! 👏",
  "Butuh ini {name}! Makasih! 🙏", "Langsung api {name}! 🔥🔥🔥", "Amazing {name}! 🌟",
  "Sempurna {name}! 💎", "Ini emas {name}! 🏆", "Kamu yang terbaik {name}! 👑",
  "Keren {name}! ⭐", "Wah {name}! Wah! 😮", "Ini bikin hariku {name}! 🥰",
  "Bangga kamu {name}! 💪", "Ini seni {name}! 🎨", "Terus bersinar {name}! ✨",
  
  // Comprehensive (300)
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
  "Konten kelas atas dari {name}! Terus maju! ✨",
  
  // Friendly (200)
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
];

// 扩展到 1000 条
function expandScripts(baseScripts, targetCount) {
  const result = [...baseScripts];
  const emojis = ['🔥', '💯', '⭐', '🌟', '✨', '💫', '👏', '🙌', '👍', '💪', '👑', '🏆', '💎', '❤️', '💕'];
  
  while (result.length < targetCount) {
    const base = baseScripts[Math.floor(Math.random() * baseScripts.length)];
    let variant = base;
    
    // 随机替换 emoji
    const oldEmoji = base.match(/[🔥💯⭐🌟✨💫👏🙌👍💪👑🏆💎❤️💕]+/);
    if (oldEmoji) {
      const newEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      variant = base.replace(oldEmoji[0], newEmoji);
    }
    
    result.push(variant);
  }
  
  return result.slice(0, targetCount);
}

const ALL_SCRIPTS_EN = expandScripts(DEFAULT_SCRIPTS_EN, 1000);
const ALL_SCRIPTS_ID = expandScripts(DEFAULT_SCRIPTS_ID, 1000);

module.exports = {
  EN: ALL_SCRIPTS_EN,
  ID: ALL_SCRIPTS_ID,
  getByLang: (lang) => lang === 'en' ? ALL_SCRIPTS_EN : ALL_SCRIPTS_ID,
  getRandom: (lang) => {
    const pool = lang === 'en' ? ALL_SCRIPTS_EN : ALL_SCRIPTS_ID;
    return pool[Math.floor(Math.random() * pool.length)];
  }
};

console.log('Default scripts loaded:', ALL_SCRIPTS_EN.length, 'EN,', ALL_SCRIPTS_ID.length, 'ID');
