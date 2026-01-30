/**
 * i18n — мультиязычность: en, ru, zh, hi, ar
 */

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ar', label: 'العربية' },
];

const STORAGE_KEY = 'monopolyLang';

function getStoredLang() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && SUPPORTED_LANGS.some((l) => l.code === s)) return s;
  } catch (_) {}
  return 'en';
}

let currentLang = getStoredLang();

export function getLang() {
  return currentLang;
}

export function setLang(code) {
  if (!SUPPORTED_LANGS.some((l) => l.code === code)) return;
  currentLang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (_) {}
  const html = document.documentElement;
  html.lang = code === 'zh' ? 'zh-CN' : code === 'ar' ? 'ar' : code;
  html.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', code === 'ar');
  applyPage();
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });
  if (typeof window.__onLangChange === 'function') window.__onLangChange();
}

/** Перевод по ключу */
export function t(key) {
  const dict = translations[currentLang] || translations.en;
  return dict[key] != null ? dict[key] : (translations.en[key] != null ? translations.en[key] : key);
}

/** Имя и описание клетки по индексу (0–19) */
export function getCellDisplay(index) {
  const dict = translations[currentLang] || translations.en;
  const cells = dict.cells;
  if (cells && cells[index]) {
    return { name: cells[index].name, description: cells[index].description };
  }
  const enCells = translations.en.cells;
  return enCells && enCells[index] ? enCells[index] : { name: `Cell ${index}`, description: '' };
}

/** Обновить все элементы с data-i18n */
export function applyPage() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('placeholder')) el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
}

const translations = {
  en: {
    lobby_title: 'Monopoly Online',
    lobby_subtitle: 'Create or join a game room',
    your_name: 'Your Name',
    enter_name: 'Enter your name',
    create_room: 'Create Room',
    or: 'or',
    room_code: 'Room Code',
    enter_code: 'Enter room code',
    join_room: 'Join Room',
    hall_theme: 'Hall theme',
    ready: "I'm Ready",
    share_code: 'Share this code with your friends',
    room_status_wait: 'Waiting for players. Click "I\'m ready" when everyone has joined.',
    room_status_ready: 'Everyone is ready! Start the game.',
    room_status_start: 'All ready! Game will start when host starts.',
    waiting_start: 'Waiting for game to start...',
    roll_dice: '🎲 Roll Dice',
    buy: 'Buy',
    skip: 'Skip',
    end_turn: 'End Turn',
    pay_50: 'Pay $50',
    wait: 'Wait',
    no_properties: 'No properties',
    waiting_for: 'Waiting for {name}...',
    your_turn: 'Your Turn!',
    landed_on: 'Landed on: {name}',
    you_win: '🎉 You Win!',
    game_over: 'Game Over',
    property: 'Property',
    close: 'Close',
    bankrupt: '💸 Bankrupt!',
    bankrupt_text: 'You have gone bankrupt!',
    continue_btn: 'Continue',
    victory: '🎉 Victory!',
    win_text: 'Congratulations! You won!',
    win_text_player: 'Congratulations {name}! You won!',
    awesome: 'Awesome!',
    chance: 'Chance',
    community_chest: 'Community Chest',
    card_title: 'Card Title',
    chat: 'Chat',
    type_message: 'Type a message...',
    recent_events: 'Recent Events',
    price: 'Price',
    rent: 'Rent',
    no_purchase: 'No purchase. Follow the cell rule.',
    reconnect: 'Reconnecting...',
    theme_toggle: 'Toggle theme',
    error_socket: 'Socket.IO not loaded. Please refresh the page.',
    error_enter_code: 'Enter room code',
    click_to_copy: 'Click to copy',
    copied: 'Copied!',
    cells: [
      { name: 'Go', description: 'Collect $200 salary as you pass. Start of the board.' },
      { name: 'Mediterranean Ave', description: 'Brown set. Lowest rent. Build houses and hotel.' },
      { name: 'Community Chest', description: 'Draw a card. Follow the instructions.' },
      { name: 'Baltic Ave', description: 'Brown set. Complete the set to double the rent.' },
      { name: 'Income Tax', description: 'Pay $200 or 10% of your total assets.' },
      { name: 'Reading Railroad', description: 'Rent: $25 (1), $50 (2), $100 (3), $200 (4 railroads).' },
      { name: 'Oriental Ave', description: 'Light Blue set. Rent $10. Build to increase rent.' },
      { name: 'Chance', description: 'Draw a Chance card. Advance, pay, receive, or go to Jail.' },
      { name: 'Vermont Ave', description: 'Light Blue set. Complete the color set for bonuses.' },
      { name: 'Jail', description: 'Just visiting — no penalty. Or you are in jail (wait or pay $50).' },
      { name: 'St. Charles Place', description: 'Pink set. Rent $14. Good for building.' },
      { name: 'Electric Company', description: 'Rent: 4× dice roll (one) or 10× (both utilities).' },
      { name: 'States Ave', description: 'Pink set. Rent $14.' },
      { name: 'Pennsylvania Railroad', description: 'Same rent scale as Reading.' },
      { name: 'Chance', description: 'Draw a Chance card.' },
      { name: 'Tennessee Ave', description: 'Orange set. Rent $18.' },
      { name: 'Community Chest', description: 'Draw a Community Chest card.' },
      { name: 'New York Ave', description: 'Orange set. Rent $20. Highest in the set.' },
      { name: 'Free Parking', description: 'Free rest. Sometimes house rule: collect the tax pool here.' },
      { name: 'Go to Jail', description: 'Go directly to Jail. Do not pass Go. Do not collect $200.' },
    ],
  },
  ru: {
    lobby_title: 'Монополия Онлайн',
    lobby_subtitle: 'Создайте или присоединитесь к комнате',
    your_name: 'Ваше имя',
    enter_name: 'Введите имя',
    create_room: 'Создать комнату',
    or: 'или',
    room_code: 'Код комнаты',
    enter_code: 'Введите код комнаты',
    join_room: 'Войти',
    hall_theme: 'Оформление зала',
    ready: 'Готов',
    share_code: 'Поделитесь кодом с друзьями',
    room_status_wait: 'Ожидание игроков. Нажмите «Готов», когда все присоединятся.',
    room_status_ready: 'Все готовы! Начинайте игру.',
    room_status_start: 'Все готовы! Игра начнётся, когда ведущий нажмёт старт.',
    waiting_start: 'Ожидание начала игры...',
    roll_dice: '🎲 Бросить кубики',
    buy: 'Купить',
    skip: 'Пропустить',
    end_turn: 'Завершить ход',
    pay_50: 'Заплатить $50',
    wait: 'Ждать',
    no_properties: 'Нет имущества',
    waiting_for: 'Ожидание {name}...',
    your_turn: 'Ваш ход!',
    landed_on: 'Вы на: {name}',
    you_win: '🎉 Вы победили!',
    game_over: 'Конец игры',
    property: 'Недвижимость',
    close: 'Закрыть',
    bankrupt: '💸 Банкрот!',
    bankrupt_text: 'Вы обанкротились!',
    continue_btn: 'Продолжить',
    victory: '🎉 Победа!',
    win_text: 'Поздравляем! Вы выиграли!',
    win_text_player: 'Поздравляем, {name}! Вы выиграли!',
    awesome: 'Отлично!',
    chance: 'Шанс',
    community_chest: 'Общая казна',
    card_title: 'Карта',
    chat: 'Чат',
    type_message: 'Введите сообщение...',
    recent_events: 'Последние события',
    price: 'Цена',
    rent: 'Аренда',
    reconnect: 'Переподключение...',
    theme_toggle: 'Сменить тему',
    error_socket: 'Socket.IO не загружен. Обновите страницу.',
    error_enter_code: 'Введите код комнаты',
    click_to_copy: 'Нажмите, чтобы скопировать',
    copied: 'Скопировано!',
    cells: [
      { name: 'Старт', description: 'Получите $200 при проходе. Начало доски.' },
      { name: 'Средиземноморская', description: 'Коричневая группа. Низкая аренда.' },
      { name: 'Общая казна', description: 'Возьмите карту и следуйте указаниям.' },
      { name: 'Балтийская', description: 'Коричневая группа. Две — двойная аренда.' },
      { name: 'Подоходный налог', description: 'Заплатите $200 или 10% активов.' },
      { name: 'Ж/д Ридинг', description: 'Аренда: $25 / $50 / $100 / $200.' },
      { name: 'Восточная', description: 'Голубая группа. Аренда $10.' },
      { name: 'Шанс', description: 'Возьмите карту «Шанс».' },
      { name: 'Вермонт', description: 'Голубая группа.' },
      { name: 'Тюрьма', description: 'В гостях — без штрафа. Или вы в тюрьме.' },
      { name: 'пл. Св. Чарльза', description: 'Розовая группа. Аренда $14.' },
      { name: 'Электросеть', description: 'Аренда: 4× кубики (одна) или 10× (обе).' },
      { name: 'Штаты', description: 'Розовая группа. Аренда $14.' },
      { name: 'Ж/д Пенсильвания', description: 'Та же шкала аренды.' },
      { name: 'Шанс', description: 'Возьмите карту «Шанс».' },
      { name: 'Теннесси', description: 'Оранжевая группа. Аренда $18.' },
      { name: 'Общая казна', description: 'Возьмите карту «Общая казна».' },
      { name: 'Нью-Йорк', description: 'Оранжевая группа. Аренда $20.' },
      { name: 'Бесплатная стоянка', description: 'Отдых. По правилам — иногда здесь забирают налог.' },
      { name: 'В тюрьму', description: 'Прямо в тюрьму. Не проходите «Старт».' },
    ],
  },
  zh: {
    lobby_title: '大富翁在线',
    lobby_subtitle: '创建或加入游戏房间',
    your_name: '您的名字',
    enter_name: '输入您的名字',
    create_room: '创建房间',
    or: '或',
    room_code: '房间代码',
    enter_code: '输入房间代码',
    join_room: '加入',
    hall_theme: '大厅主题',
    ready: '我准备好了',
    share_code: '与朋友分享此代码',
    room_status_wait: '等待玩家。所有人加入后点击「我准备好了」。',
    room_status_ready: '大家都准备好了！开始游戏。',
    room_status_start: '都准备好了！主持人点击后开始。',
    waiting_start: '等待游戏开始...',
    roll_dice: '🎲 掷骰子',
    buy: '购买',
    skip: '跳过',
    end_turn: '结束回合',
    pay_50: '支付 $50',
    wait: '等待',
    no_properties: '无房产',
    waiting_for: '等待 {name}...',
    your_turn: '您的回合！',
    landed_on: '落在：{name}',
    you_win: '🎉 您赢了！',
    game_over: '游戏结束',
    property: '房产',
    close: '关闭',
    bankrupt: '💸 破产！',
    bankrupt_text: '您已破产！',
    continue_btn: '继续',
    victory: '🎉 胜利！',
    win_text: '恭喜！您赢了！',
    win_text_player: '恭喜 {name}！您赢了！',
    awesome: '太棒了！',
    chance: '机会',
    community_chest: '公益金',
    card_title: '卡牌',
    chat: '聊天',
    type_message: '输入消息...',
    recent_events: '最近事件',
    price: '价格',
    rent: '租金',
    reconnect: '重新连接...',
    theme_toggle: '切换主题',
    error_socket: 'Socket.IO 未加载。请刷新页面。',
    error_enter_code: '请输入房间代码',
    click_to_copy: '点击复制',
    copied: '已复制！',
    cells: [
      { name: '起点', description: '经过时获得 $200。棋盘起点。' },
      { name: '地中海大道', description: '棕色组。最低租金。' },
      { name: '公益金', description: '抽一张卡并按说明执行。' },
      { name: '波罗的海大道', description: '棕色组。集齐加倍租金。' },
      { name: '所得税', description: '支付 $200 或总资产 10%。' },
      { name: '雷丁铁路', description: '租金：$25 / $50 / $100 / $200。' },
      { name: '东方大道', description: '浅蓝组。租金 $10。' },
      { name: '机会', description: '抽一张机会卡。' },
      { name: '佛蒙特大道', description: '浅蓝组。' },
      { name: '监狱', description: '探监——无罚。或您在狱中（等或付 $50）。' },
      { name: '圣查尔斯广场', description: '粉红组。租金 $14。' },
      { name: '电力公司', description: '租金：4×骰子（一个）或 10×（两个）。' },
      { name: '州大道', description: '粉红组。租金 $14。' },
      { name: '宾州铁路', description: '租金同雷丁。' },
      { name: '机会', description: '抽一张机会卡。' },
      { name: '田纳西大道', description: '橙色组。租金 $18。' },
      { name: '公益金', description: '抽一张公益金卡。' },
      { name: '纽约大道', description: '橙色组。租金 $20。' },
      { name: '免费停车', description: '休息。家规：有时在此收取税款。' },
      { name: '入狱', description: '直接入狱。不经过起点。' },
    ],
  },
  hi: {
    lobby_title: 'मोनोपॉली ऑनलाइन',
    lobby_subtitle: 'कमरा बनाएं या जुड़ें',
    your_name: 'आपका नाम',
    enter_name: 'अपना नाम दर्ज करें',
    create_room: 'कमरा बनाएं',
    or: 'या',
    room_code: 'कमरे का कोड',
    enter_code: 'कमरे का कोड दर्ज करें',
    join_room: 'जुड़ें',
    hall_theme: 'हॉल थीम',
    ready: 'मैं तैयार हूं',
    share_code: 'दोस्तों के साथ यह कोड साझा करें',
    room_status_wait: 'खिलाड़ियों का इंतजार। सभी के जुड़ने पर "मैं तैयार हूं" क्लिक करें।',
    room_status_ready: 'सभी तैयार! गेम शुरू करें।',
    room_status_start: 'सभी तैयार! होस्ट शुरू करने पर गेम शुरू होगा।',
    waiting_start: 'गेम शुरू होने का इंतजार...',
    roll_dice: '🎲 पासा फेंकें',
    buy: 'खरीदें',
    skip: 'छोड़ें',
    end_turn: 'चाल समाप्त',
    pay_50: '$50 दें',
    wait: 'इंतजार',
    no_properties: 'कोई संपत्ति नहीं',
    waiting_for: '{name} का इंतजार...',
    your_turn: 'आपकी चाल!',
    landed_on: 'पर उतरे: {name}',
    you_win: '🎉 आप जीते!',
    game_over: 'गेम खत्म',
    property: 'संपत्ति',
    close: 'बंद करें',
    bankrupt: '💸 दिवालिया!',
    bankrupt_text: 'आप दिवालिया हो गए!',
    continue_btn: 'जारी रखें',
    victory: '🎉 जीत!',
    win_text: 'बधाई! आप जीते!',
    win_text_player: 'बधाई {name}! आप जीते!',
    awesome: 'बढ़िया!',
    chance: 'मौका',
    community_chest: 'सामुदायिक खजाना',
    card_title: 'कार्ड',
    chat: 'चैट',
    type_message: 'संदेश लिखें...',
    recent_events: 'हाल की घटनाएं',
    price: 'कीमत',
    rent: 'किराया',
    reconnect: 'फिर से कनेक्ट...',
    theme_toggle: 'थीम बदलें',
    error_socket: 'Socket.IO लोड नहीं। पेज रिफ्रेश करें।',
    error_enter_code: 'कमरे का कोड दर्ज करें',
    click_to_copy: 'कॉपी करने के लिए क्लिक करें',
    copied: 'कॉपी हो गया!',
    cells: [
      { name: 'स्टार्ट', description: 'गुजरने पर $200 लें।' },
      { name: 'मेडिटेरेनियन एवेन्यू', description: 'भूरा सेट। कम किराया।' },
      { name: 'सामुदायिक खजाना', description: 'कार्ड खींचें। निर्देश पालन करें।' },
      { name: 'बाल्टिक एवेन्यू', description: 'भूरा सेट।' },
      { name: 'आय कर', description: '$200 या 10% संपत्ति दें।' },
      { name: 'रीडिंग रेलरोड', description: 'किराया: $25/$50/$100/$200।' },
      { name: 'ओरिएंटल एवेन्यू', description: 'हल्का नीला सेट।' },
      { name: 'मौका', description: 'मौका कार्ड खींचें।' },
      { name: 'वरमोंट एवेन्यू', description: 'हल्का नीला सेट।' },
      { name: 'जेल', description: 'दौरा — कोई जुर्माना नहीं। या जेल में।' },
      { name: 'सेंट चार्ल्स प्लेस', description: 'गुलाबी सेट।' },
      { name: 'इलेक्ट्रिक कंपनी', description: 'किराया: 4× पासा या 10×।' },
      { name: 'स्टेट्स एवेन्यू', description: 'गुलाबी सेट।' },
      { name: 'पेन्सिलवेनिया रेलरोड', description: 'वही किराया।' },
      { name: 'मौका', description: 'मौका कार्ड खींचें।' },
      { name: 'टेनेसी एवेन्यू', description: 'नारंगी सेट।' },
      { name: 'सामुदायिक खजाना', description: 'कार्ड खींचें।' },
      { name: 'न्यू यॉर्क एवेन्यू', description: 'नारंगी सेट।' },
      { name: 'मुफ्त पार्किंग', description: 'आराम।' },
      { name: 'जेल जाओ', description: 'सीधे जेल। स्टार्ट मत लो।' },
    ],
  },
  ar: {
    lobby_title: 'مونوبولي أونلاين',
    lobby_subtitle: 'أنشئ غرفة أو انضم إليها',
    your_name: 'اسمك',
    enter_name: 'أدخل اسمك',
    create_room: 'إنشاء غرفة',
    or: 'أو',
    room_code: 'رمز الغرفة',
    enter_code: 'أدخل رمز الغرفة',
    join_room: 'انضم',
    hall_theme: 'مظهر القاعة',
    ready: 'أنا مستعد',
    share_code: 'شارك الرمز مع الأصدقاء',
    room_status_wait: 'انتظار اللاعبين. اضغط «أنا مستعد» عندما ينضم الجميع.',
    room_status_ready: 'الجميع مستعد! ابدأ اللعبة.',
    room_status_start: 'الجميع مستعد! اللعبة تبدأ عندما يضغط المضيف.',
    waiting_start: 'انتظار بدء اللعبة...',
    roll_dice: '🎲 رمي النرد',
    buy: 'شراء',
    skip: 'تخطي',
    end_turn: 'إنهاء الدور',
    pay_50: 'ادفع $50',
    wait: 'انتظر',
    no_properties: 'لا ممتلكات',
    waiting_for: 'انتظار {name}...',
    your_turn: 'دورك!',
    landed_on: 'وقعت على: {name}',
    you_win: '🎉 فزت!',
    game_over: 'انتهت اللعبة',
    property: 'عقار',
    close: 'إغلاق',
    bankrupt: '💸 إفلاس!',
    bankrupt_text: 'أفلسْتَ!',
    continue_btn: 'متابعة',
    victory: '🎉 انتصار!',
    win_text: 'مبروك! فزت!',
    win_text_player: 'مبروك {name}! فزت!',
    awesome: 'رائع!',
    chance: 'فرصة',
    community_chest: 'الصندوق المشترك',
    card_title: 'البطاقة',
    chat: 'الدردشة',
    type_message: 'اكتب رسالة...',
    recent_events: 'الأحداث الأخيرة',
    price: 'السعر',
    rent: 'الإيجار',
    reconnect: 'إعادة الاتصال...',
    theme_toggle: 'تبديل المظهر',
    error_socket: 'Socket.IO لم يُحمّل. حدّث الصفحة.',
    error_enter_code: 'أدخل رمز الغرفة',
    click_to_copy: 'انقر للنسخ',
    copied: 'تم النسخ!',
    cells: [
      { name: 'الانطلاق', description: 'احصل على $200 عند المرور.' },
      { name: 'المتوسطية', description: 'المجموعة البنية.' },
      { name: 'الصندوق المشترك', description: 'اسحب بطاقة واتبع التعليمات.' },
      { name: 'بالتيك', description: 'المجموعة البنية.' },
      { name: 'ضريبة الدخل', description: 'ادفع $200 أو 10% من الأصول.' },
      { name: 'سكك ريدينغ', description: 'إيجار: $25/$50/$100/$200.' },
      { name: 'الشرقية', description: 'المجموعة الزرقاء الفاتحة.' },
      { name: 'فرصة', description: 'اسحب بطاقة فرصة.' },
      { name: 'فيرمونت', description: 'المجموعة الزرقاء الفاتحة.' },
      { name: 'السجن', description: 'زيارة — بلا غرامة. أو أنت في السجن.' },
      { name: 'ساحة تشارلز', description: 'المجموعة الوردية.' },
      { name: 'شركة الكهرباء', description: 'إيجار: 4× النرد أو 10×.' },
      { name: 'ولاية', description: 'المجموعة الوردية.' },
      { name: 'سكك بنسلفانيا', description: 'نفس مقياس الإيجار.' },
      { name: 'فرصة', description: 'اسحب بطاقة فرصة.' },
      { name: 'تينيسي', description: 'المجموعة البرتقالية.' },
      { name: 'الصندوق المشترك', description: 'اسحب بطاقة.' },
      { name: 'نيويورك', description: 'المجموعة البرتقالية.' },
      { name: 'موقف مجاني', description: 'راحة.' },
      { name: 'اذهب إلى السجن', description: 'مباشرة إلى السجن.' },
    ],
  },
};

/** Подставить {name} и т.п. */
export function tParams(key, params = {}) {
  let str = t(key);
  Object.keys(params).forEach((k) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
  });
  return str;
}
