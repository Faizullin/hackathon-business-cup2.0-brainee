import type { Locale } from "./types";

// Seeded demo content is US English (the main audience). These [en, ru] pairs translate
// seed strings and game titles at display time; parent-typed text is shown as written.
const PAIRS: readonly (readonly [string, string])[] = [
  ["Sunday", "Воскресенье"],
  ["15 minutes of logic games", "15 минут логических игр"],
  ["Tidy up your room", "Убраться в комнате"],
  ["Read a book before bed", "Прочитать книжку перед сном"],
  ["Play outside for 30 minutes", "Поиграть на улице 30 минут"],
  ["Logic", "Логика"],
  ["Responsibility", "Ответственность"],
  ["Reading", "Чтение"],
  ["Motor skills", "Моторика"],
  ["Attention", "Внимание"],
  ["Speech", "Речь"],
  ["Memory", "Память"],
  ["Tidy up", "Убраться"],
  ["Outdoors", "Улица"],
  ["Book", "Книжка"],
  ["Homework solo", "Домашка сам"],
  ["Top grade", "Пятёрка"],
  ["Do the hard thing", "Делай сложное"],
  ["Brainy's eyes", "Глаза Брейни"],
  ["Brainy's mouth", "Рот Брейни"],
  ["Hero cape", "Плащ героя"],
  [
    "Usually drops attention tasks after 4–5 minutes.",
    "Чаще всего бросает задания на внимание через 4–5 минут.",
  ],
  ["Build a 60-piece puzzle together", "Собрать пазл из 60 деталей вместе с вами"],
  ["Play “Freeze” on a walk", "Игра «Замри» на прогулке"],
  [
    "At the start, picks “other games” 30% of the time.",
    "На входе выбирает «другие игры» в 30% случаев.",
  ],
  [
    "Make a clay figure you have never tried before",
    "Слепить из пластилина фигурку, которую ещё не пробовал",
  ],
  [
    "Growing slower than average: +8 this month vs +12 for peers.",
    "Растёт медленнее среднего: +8 за месяц при +12 у сверстников.",
  ],
  ["Read 5 street signs on the way home", "Прочитать 5 вывесок по дороге домой"],
  ["10 min", "10 мин"],
  ["20 min", "20 мин"],
  ["25 min", "25 мин"],
  ["Movie night out", "Поход в кино"],
  ["Ice cream", "Мороженое"],
  ["Sticker pack", "Набор наклеек"],
  ["Pick tonight's cartoon", "Выбрать мультик на вечер"],
  ["Amusement park", "Парк аттракционов"],
  ["Snake", "Змейка"],
  ["Spatial thinking", "Пространственное мышление"],
  ["Rocket Runner", "Ракета-раннер"],
  ["Reaction speed", "Скорость реакции"],
  ["Rhythm Drums", "Ритм-барабаны"],
  ["Sense of rhythm", "Чувство ритма"],
  ["Catapult", "Катапульта"],
  ["Aim", "Меткость"],
  ["Maze Racers", "Лабиринт-гонки"],
  ["Hand dexterity", "Ловкость рук"],
  ["How a Volcano Works", "Как устроен вулкан"],
  ["Cartoon · 22 min", "Мультфильм · 22 мин"],
  ["A Raindrop's Journey", "Путешествие капельки"],
  ["Cartoon · 18 min", "Мультфильм · 18 мин"],
  ["The Brave Little Hedgehog", "Сказка о смелом ёжике"],
  ["Audio story · 15 min", "Аудиосказка · 15 мин"],
  ["Ocean Mysteries", "Тайны океана"],
  ["Who is the biggest animal in the ocean?", "Кто самый большой житель океана?"],
  ["Blue whale", "Синий кит"],
  ["Shark", "Акула"],
  ["Octopus", "Осьминог"],
  ["How Bees Live", "Как живут пчёлы"],
  ["What do bees make from nectar?", "Что пчёлы делают из нектара?"],
  ["Wax", "Воск"],
  ["Honey", "Мёд"],
  ["Sugar", "Сахар"],
  ["Journey to Mars", "Путешествие к Марсу"],
  ["What color is Mars?", "Какого цвета Марс?"],
  ["Blue", "Синего"],
  ["Green", "Зелёного"],
  ["Red", "Красного"],
  ["The Last Days of the Dinosaurs", "Последние дни динозавров"],
  [
    "According to most scientists, what hit the Earth?",
    "Что, по главной версии учёных, упало на Землю?",
  ],
  ["An asteroid", "Астероид"],
  ["The Moon", "Луна"],
  ["An iceberg", "Ледяная гора"],
  ["Odd One Out · 1", "Найди лишний · 1"],
  ["+5 min this month", "+5 мин за месяц"],
  ["record", "рекорд"],
  ["+15 pts this month", "+15 п.п. за месяц"],
  ["logic", "логика"],
  ["attention", "внимание"],
  ["Long game", "Долгая игра"],
  ["Learning machine", "Машина обучения"],
  ["Learn from mistakes", "Учусь на ошибках"],
  ["Mon", "Пн"],
  ["Tue", "Вт"],
  ["Wed", "Ср"],
  ["Thu", "Чт"],
  ["Fri", "Пт"],
  ["Sat", "Сб"],
  ["Sun", "Вс"],
  [
    "#3 for growth among 312 kids in the neighborhood · top 1%",
    "3-е место по росту из 312 детей района · топ-1%",
  ],
  ["#14 of 312 · top 5% of the neighborhood", "14-е место из 312 · топ-5% района"],
  ["#41 for growth of 4,820 · top 1%", "41-е место по росту из 4 820 · топ-1%"],
  ["#187 of 4,820 · top 4%", "187-е место из 4 820 · топ-4%"],
  ["#266 for growth of 38,150 · top 1%", "266-е место по росту из 38 150 · топ-1%"],
  ["#1,204 of 38,150 · top 4%", "1 204-е место из 38 150 · топ-4%"],
  ["November", "Ноябрь"],
  ["Logic +18 this month", "Логика +18 за месяц"],
  ["12 days in a row", "12 дней подряд"],
  ["23 recommended games finished", "23 рекомендованные игры пройдены"],
  ["Play a learning game", "Сыграть в учебную игру"],
  ["Demo history", "Демонстрационная история"],
  ["Odd One Out", "Найди лишний"],
  ["Continue the Pattern", "Продолжи узор"],
  ["Picture Puzzle", "Собери картинку"],
];

const toRu = new Map(PAIRS.map(([en, ru]) => [en, ru]));
const toEn = new Map(PAIRS.map(([en, ru]) => [ru, en]));

/** One content string in the given locale; unknown text is returned unchanged. */
export function translateContent(text: string, locale: Locale) {
  return (locale === "ru" ? toRu.get(text) : toEn.get(text)) ?? text;
}

/** Deep copy of seeded content with every known string translated. */
export function localizeContent<T>(value: T, locale: Locale): T {
  if (typeof value === "string") return translateContent(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => localizeContent(item, locale)) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeContent(item, locale)]),
    ) as T;
  return value;
}
