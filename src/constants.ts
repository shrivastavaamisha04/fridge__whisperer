
export const DEFAULT_HOUSEHOLD_ID = 'my-happy-home';

// Each entry covers: English, transliterated Hindi/regional, and native script variants
// so that voice-transcribed Indian language names hit the local fallback
// instead of always making an API call.
export const FALLBACK_FOOD_DATA: Record<string, { days: number; category: string; emoji: string }> = {

  // ── Dairy ────────────────────────────────────────────────────────────────────
  'milk':         { days: 7,  category: 'Dairy',     emoji: '🥛' },
  'doodh':        { days: 7,  category: 'Dairy',     emoji: '🥛' }, // Hindi transliteration
  'दूध':           { days: 7,  category: 'Dairy',     emoji: '🥛' }, // Hindi
  'பால்':          { days: 7,  category: 'Dairy',     emoji: '🥛' }, // Tamil
  'పాలు':          { days: 7,  category: 'Dairy',     emoji: '🥛' }, // Telugu
  'দুধ':           { days: 7,  category: 'Dairy',     emoji: '🥛' }, // Bengali
  'eggs':         { days: 21, category: 'Dairy',     emoji: '🥚' },
  'anda':         { days: 21, category: 'Dairy',     emoji: '🥚' },
  'अंडा':          { days: 21, category: 'Dairy',     emoji: '🥚' },
  'yogurt':       { days: 14, category: 'Dairy',     emoji: '🥛' },
  'curd':         { days: 5,  category: 'Dairy',     emoji: '🥛' },
  'dahi':         { days: 5,  category: 'Dairy',     emoji: '🥛' },
  'दही':           { days: 5,  category: 'Dairy',     emoji: '🥛' },
  'தயிர்':          { days: 5,  category: 'Dairy',     emoji: '🥛' }, // Tamil
  'పెరుగు':         { days: 5,  category: 'Dairy',     emoji: '🥛' }, // Telugu
  'paneer':       { days: 5,  category: 'Dairy',     emoji: '🧀' },
  'पनीर':          { days: 5,  category: 'Dairy',     emoji: '🧀' },
  'butter':       { days: 30, category: 'Dairy',     emoji: '🧈' },
  'makhan':       { days: 30, category: 'Dairy',     emoji: '🧈' },
  'मक्खन':         { days: 30, category: 'Dairy',     emoji: '🧈' },
  'cheese':       { days: 14, category: 'Dairy',     emoji: '🧀' },

  // ── Vegetables ───────────────────────────────────────────────────────────────
  'tomato':       { days: 7,  category: 'Vegetable', emoji: '🍅' },
  'tamatar':      { days: 7,  category: 'Vegetable', emoji: '🍅' },
  'टमाटर':         { days: 7,  category: 'Vegetable', emoji: '🍅' },
  'தக்காளி':        { days: 7,  category: 'Vegetable', emoji: '🍅' }, // Tamil
  'టమాటా':         { days: 7,  category: 'Vegetable', emoji: '🍅' }, // Telugu
  'টমেটো':         { days: 7,  category: 'Vegetable', emoji: '🍅' }, // Bengali
  'onion':        { days: 30, category: 'Vegetable', emoji: '🧅' },
  'pyaaz':        { days: 30, category: 'Vegetable', emoji: '🧅' },
  'pyaz':         { days: 30, category: 'Vegetable', emoji: '🧅' },
  'प्याज':          { days: 30, category: 'Vegetable', emoji: '🧅' },
  'வெங்காயம்':      { days: 30, category: 'Vegetable', emoji: '🧅' }, // Tamil
  'ఉల్లిపాయ':       { days: 30, category: 'Vegetable', emoji: '🧅' }, // Telugu
  'potato':       { days: 30, category: 'Vegetable', emoji: '🥔' },
  'aloo':         { days: 30, category: 'Vegetable', emoji: '🥔' },
  'alu':          { days: 30, category: 'Vegetable', emoji: '🥔' },
  'आलू':           { days: 30, category: 'Vegetable', emoji: '🥔' },
  'உருளைக்கிழங்கு': { days: 30, category: 'Vegetable', emoji: '🥔' }, // Tamil
  'బంగాళాదుంప':     { days: 30, category: 'Vegetable', emoji: '🥔' }, // Telugu
  'spinach':      { days: 5,  category: 'Vegetable', emoji: '🥬' },
  'palak':        { days: 5,  category: 'Vegetable', emoji: '🥬' },
  'पालक':          { days: 5,  category: 'Vegetable', emoji: '🥬' },
  'capsicum':     { days: 7,  category: 'Vegetable', emoji: '🫑' },
  'shimla mirch': { days: 7,  category: 'Vegetable', emoji: '🫑' },
  'शिमला मिर्च':    { days: 7,  category: 'Vegetable', emoji: '🫑' },
  'carrot':       { days: 21, category: 'Vegetable', emoji: '🥕' },
  'gajar':        { days: 21, category: 'Vegetable', emoji: '🥕' },
  'गाजर':          { days: 21, category: 'Vegetable', emoji: '🥕' },
  'cucumber':     { days: 7,  category: 'Vegetable', emoji: '🥒' },
  'kheera':       { days: 7,  category: 'Vegetable', emoji: '🥒' },
  'खीरा':          { days: 7,  category: 'Vegetable', emoji: '🥒' },
  'garlic':       { days: 30, category: 'Vegetable', emoji: '🧄' },
  'lahsun':       { days: 30, category: 'Vegetable', emoji: '🧄' },
  'लहसुन':         { days: 30, category: 'Vegetable', emoji: '🧄' },
  'ginger':       { days: 21, category: 'Vegetable', emoji: '🫚' },
  'adrak':        { days: 21, category: 'Vegetable', emoji: '🫚' },
  'अदरक':          { days: 21, category: 'Vegetable', emoji: '🫚' },
  'cauliflower':  { days: 7,  category: 'Vegetable', emoji: '🥦' },
  'gobhi':        { days: 7,  category: 'Vegetable', emoji: '🥦' },
  'फूलगोभी':       { days: 7,  category: 'Vegetable', emoji: '🥦' },
  'brinjal':      { days: 7,  category: 'Vegetable', emoji: '🍆' },
  'eggplant':     { days: 7,  category: 'Vegetable', emoji: '🍆' },
  'baingan':      { days: 7,  category: 'Vegetable', emoji: '🍆' },
  'बैंगन':          { days: 7,  category: 'Vegetable', emoji: '🍆' },

  // ── Fruits ───────────────────────────────────────────────────────────────────
  'banana':       { days: 5,  category: 'Fruit',     emoji: '🍌' },
  'bananas':      { days: 5,  category: 'Fruit',     emoji: '🍌' },
  'kela':         { days: 5,  category: 'Fruit',     emoji: '🍌' },
  'केला':          { days: 5,  category: 'Fruit',     emoji: '🍌' },
  'வாழைப்பழம்':     { days: 5,  category: 'Fruit',     emoji: '🍌' }, // Tamil
  'apple':        { days: 30, category: 'Fruit',     emoji: '🍎' },
  'apples':       { days: 30, category: 'Fruit',     emoji: '🍎' },
  'seb':          { days: 30, category: 'Fruit',     emoji: '🍎' },
  'सेब':           { days: 30, category: 'Fruit',     emoji: '🍎' },
  'mango':        { days: 5,  category: 'Fruit',     emoji: '🥭' },
  'aam':          { days: 5,  category: 'Fruit',     emoji: '🥭' },
  'आम':            { days: 5,  category: 'Fruit',     emoji: '🥭' },
  'மாம்பழம்':       { days: 5,  category: 'Fruit',     emoji: '🥭' }, // Tamil
  'మామిడిపండు':     { days: 5,  category: 'Fruit',     emoji: '🥭' }, // Telugu
  'strawberry':   { days: 4,  category: 'Fruit',     emoji: '🍓' },
  'strawberries': { days: 4,  category: 'Fruit',     emoji: '🍓' },
  'avocado':      { days: 4,  category: 'Fruit',     emoji: '🥑' },
  'grapes':       { days: 7,  category: 'Fruit',     emoji: '🍇' },
  'angoor':       { days: 7,  category: 'Fruit',     emoji: '🍇' },
  'अंगूर':          { days: 7,  category: 'Fruit',     emoji: '🍇' },
  'orange':       { days: 14, category: 'Fruit',     emoji: '🍊' },
  'santra':       { days: 14, category: 'Fruit',     emoji: '🍊' },
  'संतरा':          { days: 14, category: 'Fruit',     emoji: '🍊' },
  'watermelon':   { days: 7,  category: 'Fruit',     emoji: '🍉' },
  'tarbuz':       { days: 7,  category: 'Fruit',     emoji: '🍉' },
  'तरबूज':          { days: 7,  category: 'Fruit',     emoji: '🍉' },
  'papaya':       { days: 5,  category: 'Fruit',     emoji: '🍈' },
  'papita':       { days: 5,  category: 'Fruit',     emoji: '🍈' },
  'पपीता':         { days: 5,  category: 'Fruit',     emoji: '🍈' },
  'lemon':        { days: 21, category: 'Fruit',     emoji: '🍋' },
  'nimbu':        { days: 21, category: 'Fruit',     emoji: '🍋' },
  'नींबू':          { days: 21, category: 'Fruit',     emoji: '🍋' },

  // ── Meat & Protein ───────────────────────────────────────────────────────────
  'chicken':      { days: 2,  category: 'Meat',      emoji: '🍗' },
  'murgi':        { days: 2,  category: 'Meat',      emoji: '🍗' },
  'मुर्गी':          { days: 2,  category: 'Meat',      emoji: '🍗' },
  'fish':         { days: 2,  category: 'Meat',      emoji: '🐟' },
  'machli':       { days: 2,  category: 'Meat',      emoji: '🐟' },
  'मछली':          { days: 2,  category: 'Meat',      emoji: '🐟' },
  'மீன்':          { days: 2,  category: 'Meat',      emoji: '🐟' }, // Tamil
  'mutton':       { days: 2,  category: 'Meat',      emoji: '🥩' },
  'gosht':        { days: 2,  category: 'Meat',      emoji: '🥩' },
  'गोश्त':          { days: 2,  category: 'Meat',      emoji: '🥩' },

  // ── Pantry / Grains ──────────────────────────────────────────────────────────
  'rice':         { days: 365, category: 'Pantry',   emoji: '🍚' },
  'chawal':       { days: 365, category: 'Pantry',   emoji: '🍚' },
  'चावल':          { days: 365, category: 'Pantry',   emoji: '🍚' },
  'அரிசி':         { days: 365, category: 'Pantry',   emoji: '🍚' }, // Tamil
  'బియ్యం':         { days: 365, category: 'Pantry',   emoji: '🍚' }, // Telugu
  'flour':        { days: 180, category: 'Pantry',   emoji: '🌾' },
  'aata':         { days: 180, category: 'Pantry',   emoji: '🌾' },
  'atta':         { days: 180, category: 'Pantry',   emoji: '🌾' },
  'आटा':           { days: 180, category: 'Pantry',   emoji: '🌾' },
  'dal':          { days: 365, category: 'Pantry',   emoji: '🫘' },
  'daal':         { days: 365, category: 'Pantry',   emoji: '🫘' },
  'दाल':           { days: 365, category: 'Pantry',   emoji: '🫘' },
  'பருப்பு':         { days: 365, category: 'Pantry',   emoji: '🫘' }, // Tamil
  'oil':          { days: 365, category: 'Pantry',   emoji: '🫙' },
  'tel':          { days: 365, category: 'Pantry',   emoji: '🫙' },
  'तेल':           { days: 365, category: 'Pantry',   emoji: '🫙' },
  'bread':        { days: 6,  category: 'Bakery',    emoji: '🍞' },
  'roti':         { days: 1,  category: 'Bakery',    emoji: '🫓' },
  'रोटी':          { days: 1,  category: 'Bakery',    emoji: '🫓' },
  'chapati':      { days: 1,  category: 'Bakery',    emoji: '🫓' },
  'சப்பாத்தி':       { days: 1,  category: 'Bakery',    emoji: '🫓' }, // Tamil
};

export const CATEGORIES = ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Other'];
