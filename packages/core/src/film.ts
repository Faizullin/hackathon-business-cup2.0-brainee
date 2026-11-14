// Interactive films: an mp3 plus a JSON script that the browser draws (docs/dev/films.md).
// Pure format checks and timeline lookups; art keys are passed in by the caller.

export const FILM_SKILLS = ["attention", "reading", "logic", "memory", "speech"] as const;
export const FILM_SPOTS = ["left", "center", "right"] as const;
export const FILM_VOICES = ["brainy", "guest"] as const;
/** Language of the audio; captions and questions use the same language. The product is English-only. */
export const FILM_LANGS = ["en"] as const;
/** The prop shown a few seconds before every question. */
export const FILM_QUESTION_PROP = "question";

export type FilmSkill = (typeof FILM_SKILLS)[number];
export type FilmSpot = (typeof FILM_SPOTS)[number];
export type FilmVoice = (typeof FILM_VOICES)[number];
export type FilmLang = (typeof FILM_LANGS)[number];
export type FilmCaption = { t: number; end: number; text: string; who?: FilmVoice };
export type FilmScene = { t: number; bg: string; props: string[]; brainy: FilmSpot };
export type FilmQuestion = {
  t: number;
  q: string;
  options: string[];
  answer: number;
  hint: string;
  praise: string;
  replayFrom: number;
};
export type FilmScript = {
  id: string;
  title: string;
  lang: FilmLang;
  skill: FilmSkill;
  /** Seconds, from the mp3. */
  duration: number;
  /** Own-origin URL: `/media/films/<id>.mp3`. */
  audio: string;
  scenes: FilmScene[];
  questions: FilmQuestion[];
  captions: FilmCaption[];
};

export type FilmArt = { bg: readonly string[]; props: readonly string[] };
export type FilmIssue = { level: "error" | "warning"; where: string; message: string };

export const FILM_LIMITS = {
  title: 40,
  question: 60,
  option: 25,
  options: 3,
  propsMin: 2,
  propsMax: 4,
  /** Scene changes every 8–15 s; longer gaps are flagged. */
  sceneGap: 20,
  /** The question scene starts 3–4 s before a question; this window accepts 2–6 s. */
  questionLead: [2, 6] as const,
  /** 2–4 questions per 5 minutes. */
  perFiveMinutes: [2, 4] as const,
  /** Pause lands 0.2–0.5 s after the voice ends; up to 1.5 s is tolerated. */
  pauseAfter: [0.2, 1.5] as const,
};

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PLACEHOLDER = /\bTODO\b/i;
const NEGATION = /(^|\s)(not|never|don't|doesn't|isn't|aren't|can't)\s/i;
const ALL_CORRECT =
  /\ball\s+(of\s+the\s+)?(above|answers|options)\b|\ball\s+(are\s+)?(right|correct)\b|\bnone\s+of\b/i;

const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const isTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Every rule from docs/dev/films.md that a machine can check. Errors block a film. */
export function checkFilm(value: unknown, art: FilmArt): FilmIssue[] {
  const issues: FilmIssue[] = [];
  const error = (where: string, message: string) => issues.push({ level: "error", where, message });
  const warn = (where: string, message: string) =>
    issues.push({ level: "warning", where, message });
  if (!record(value)) return [{ level: "error", where: "script", message: "not an object" }];
  const s = value as Partial<FilmScript>;

  if (typeof s.id !== "string" || !ID.test(s.id)) error("id", "latin, digits and dashes only");
  if (!isText(s.title, FILM_LIMITS.title)) error("title", `1–${FILM_LIMITS.title} characters`);
  if (!FILM_LANGS.includes(s.lang as FilmLang)) error("lang", `one of ${FILM_LANGS}`);
  if (!FILM_SKILLS.includes(s.skill as FilmSkill)) error("skill", `one of ${FILM_SKILLS}`);
  if (!isTime(s.duration) || s.duration === 0) error("duration", "seconds > 0");
  if (s.audio !== `/media/films/${s.id}.mp3`) error("audio", `must be /media/films/${s.id}.mp3`);
  if (!Array.isArray(s.captions) || !Array.isArray(s.scenes) || !Array.isArray(s.questions)) {
    error("script", "captions, scenes and questions must be arrays");
    return issues;
  }
  const duration = isTime(s.duration) ? s.duration : Number.POSITIVE_INFINITY;
  const captions = s.captions as FilmCaption[];

  captions.forEach((c, i) => {
    const where = `captions[${i}]`;
    if (!isTime(c?.t) || !isTime(c?.end) || c.end <= c.t) error(where, "needs t < end");
    else if (c.end > duration + 0.5) error(where, "ends after the audio");
    if (!isText(c?.text, 300)) error(where, "empty or over 300 characters");
    if (c?.who !== undefined && !FILM_VOICES.includes(c.who)) error(where, "who: brainy | guest");
    if (i > 0 && isTime(c?.t) && c.t < (captions[i - 1]?.t ?? 0)) error(where, "out of order");
  });

  const scenes = s.scenes as FilmScene[];
  if (scenes.length === 0 || scenes[0]?.t !== 0) error("scenes[0]", "first scene starts at t: 0");
  scenes.forEach((scene, i) => {
    const where = `scenes[${i}]`;
    if (!isTime(scene?.t) || scene.t >= duration) error(where, "t outside the audio");
    if (i > 0 && !(scene?.t > (scenes[i - 1]?.t ?? 0))) error(where, "t must increase");
    if (!art.bg.includes(scene?.bg)) error(where, `unknown bg "${scene?.bg}"`);
    if (!FILM_SPOTS.includes(scene?.brainy)) error(where, `brainy: ${FILM_SPOTS.join(" | ")}`);
    if (!Array.isArray(scene?.props)) {
      error(where, "props must be an array");
      return;
    }
    for (const prop of scene.props)
      if (!art.props.includes(prop)) error(where, `unknown prop "${prop}"`);
    if (new Set(scene.props).size !== scene.props.length) error(where, "duplicate prop");
    if (scene.props.length > FILM_LIMITS.propsMax)
      error(where, `max ${FILM_LIMITS.propsMax} props`);
    else if (scene.props.length < FILM_LIMITS.propsMin)
      warn(where, `${FILM_LIMITS.propsMin}–${FILM_LIMITS.propsMax} props read best`);
    const next = scenes[i + 1]?.t ?? duration;
    if (isTime(scene.t) && next - scene.t > FILM_LIMITS.sceneGap)
      warn(where, `holds ${Math.round(next - scene.t)} s; change every 8–15 s`);
  });

  const questions = s.questions as FilmQuestion[];
  questions.forEach((q, i) => {
    const where = `questions[${i}]`;
    if (!isTime(q?.t) || q.t <= 0 || q.t >= duration) error(where, "t outside the audio");
    if (i > 0 && !(q?.t > (questions[i - 1]?.t ?? 0))) error(where, "t must increase");
    if (!isText(q?.q, FILM_LIMITS.question)) error(where, `q: 1–${FILM_LIMITS.question} chars`);
    if (!Array.isArray(q?.options) || q.options.length !== FILM_LIMITS.options)
      error(where, `exactly ${FILM_LIMITS.options} options`);
    else {
      for (const option of q.options)
        if (!isText(option, FILM_LIMITS.option))
          error(where, `option "${option}": 1–${FILM_LIMITS.option} chars`);
      if (new Set(q.options).size !== q.options.length) error(where, "options repeat");
      const lengths = q.options.map((o) => String(o).length);
      if (Math.max(...lengths) > 2 * Math.min(...lengths) + 4)
        warn(where, "options differ a lot in length; the odd one gives the answer away");
    }
    if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer >= FILM_LIMITS.options)
      error(where, "answer: index 0–2");
    if (!isText(q?.hint, 120)) error(where, "hint: 1–120 chars");
    if (!isText(q?.praise, 120)) error(where, "praise: 1–120 chars");
    const texts = [q?.q, q?.hint, q?.praise, ...(Array.isArray(q?.options) ? q.options : [])];
    if (texts.some((text) => typeof text === "string" && PLACEHOLDER.test(text)))
      error(where, "still has TODO placeholders");
    if (texts.some((text) => typeof text === "string" && ALL_CORRECT.test(text)))
      error(where, "no “all of the above” style options");
    if (typeof q?.q === "string" && NEGATION.test(q.q)) warn(where, "avoid negative questions");
    if (!isTime(q?.replayFrom) || !(q.replayFrom < q.t)) error(where, "replayFrom must be < t");
    else if (!captions.some((c) => c.t === q.replayFrom))
      warn(where, "replayFrom should be the t of a caption");
    if (!isTime(q?.t)) return;
    const cut = captions.find((c) => c.t < q.t && q.t < c.end - 0.05);
    if (cut) error(where, `pauses mid-phrase (${cut.t}–${cut.end} s)`);
    const before = captions.filter((c) => c.end <= q.t).at(-1);
    if (before) {
      const gap = q.t - before.end;
      if (gap < FILM_LIMITS.pauseAfter[0] - 0.01 || gap > FILM_LIMITS.pauseAfter[1])
        warn(where, `pause lands ${gap.toFixed(2)} s after the voice; aim for 0.2–0.5 s`);
    }
    const lead = scenes.filter((scene) => scene.t < q.t).at(-1);
    const [minLead, maxLead] = FILM_LIMITS.questionLead;
    if (
      !lead?.props?.includes(FILM_QUESTION_PROP) ||
      lead.brainy !== "center" ||
      q.t - lead.t < minLead ||
      q.t - lead.t > maxLead
    )
      warn(where, `add a "${FILM_QUESTION_PROP}" scene with brainy: center 3–4 s before`);
  });

  if (isTime(s.duration) && s.duration > 0) {
    const perFive = (questions.length * 300) / s.duration;
    const [low, high] = FILM_LIMITS.perFiveMinutes;
    if (questions.length === 0) error("questions", "add at least 2 questions");
    else if (perFive < low - 0.5 || perFive > high + 0.5)
      warn("questions", `${perFive.toFixed(1)} per 5 min; aim for ${low}–${high}`);
  }
  const answers = new Set(questions.map((q) => q?.answer));
  if (questions.length > 2 && answers.size === 1)
    warn("questions", "the right answer is always in the same place; shuffle it");
  return issues;
}

/** Last item whose `t` is at or before `time`. Arrays are sorted by `t`. */
function lastAt<T extends { t: number }>(items: readonly T[], time: number): T | undefined {
  let found: T | undefined;
  for (const item of items) {
    if (item.t > time) break;
    found = item;
  }
  return found;
}

export function filmSceneAt(script: FilmScript, time: number): FilmScene {
  return lastAt(script.scenes, time) ?? (script.scenes[0] as FilmScene);
}

/** The caption being spoken at `time`, if any. */
export function filmCaptionAt(script: FilmScript, time: number): FilmCaption | undefined {
  const caption = lastAt(script.captions, time);
  return caption && time < caption.end ? caption : undefined;
}

/**
 * The first question crossed between two playback times. Questions before `from` are
 * treated as answered, so resuming mid-film or seeking past one never stops playback.
 */
export function filmQuestionCrossed(
  script: FilmScript,
  from: number,
  to: number,
): number | undefined {
  const index = script.questions.findIndex((q) => q.t > from && q.t <= to);
  return index === -1 ? undefined : index;
}

/** Whole minutes, as the science list counts them (`ScienceVideo.minutes`). */
export function filmMinutes(script: Pick<FilmScript, "duration">) {
  return Math.ceil(script.duration / 60);
}
