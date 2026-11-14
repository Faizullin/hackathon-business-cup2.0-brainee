// Ported from the local Brainy Funnel Export. Pure rules; no storage, network or rewards.
import type { QuizAnswers } from "./onboarding";

export type FunnelQuestionId =
  | "goal"
  | "age"
  | "duration"
  | "content"
  | "finish"
  | "handoff"
  | "reading"
  | "attempt"
  | "moment";
export type FunnelAnswers = Record<FunnelQuestionId, string>;
export type FunnelDraft = Partial<FunnelAnswers>;
export interface FunnelQuestion {
  id: FunnelQuestionId;
  title: string;
  section?: string;
  hint: string;
  options: { value: string; label: string }[];
}

export const STORAGE_KEY = "brainy.us-parent-quiz.v2";
export const VERSION = 4;

const options = (rows: [string, string][]) => rows.map(([value, label]) => ({ value, label }));

export const FUNNEL_QUESTIONS: FunnelQuestion[] = [
  {
    id: "goal",
    section: "Your family",
    title: "What would you like screen time to look like at home?",
    hint: "Choose the one thing that would make a difference at home.",
    options: options([
      ["ending", "Make it easier to put the screen away"],
      ["learning", "Make more room for learning"],
      ["offline", "Get back to off-screen activities"],
      ["explore", "Find a routine that fits our family"],
    ]),
  },
  {
    id: "age",
    section: "Your family",
    title: "How old is your child?",
    hint: "If you have more than one child, think of one as you answer.",
    options: options([
      ["4-5", "4–5 years old"],
      ["6-7", "6–7 years old"],
      ["8-10", "8–10 years old"],
      ["outside", "Outside this age range"],
    ]),
  },
  {
    id: "duration",
    section: "Everyday habits",
    title: "On a typical day, how much screen time is just for fun?",
    hint: "Count phone and tablet time. Leave out schoolwork and video calls.",
    options: options([
      ["little", "Most days, under 30 minutes"],
      ["half", "30 minutes to under an hour"],
      ["one", "1 to under 2 hours"],
      ["two", "2 hours or more"],
      ["none", "Most days, none"],
      ["varies", "It varies too much to say"],
    ]),
  },
  {
    id: "content",
    section: "Everyday habits",
    title: "What do they usually reach for first?",
    hint: "Choose what you see most often, even if they enjoy a mix.",
    options: options([
      ["clips", "Short clips, Shorts, or memes"],
      ["kids", "Videos on YouTube Kids"],
      ["shows", "Cartoons or full episodes"],
      ["games", "Games and puzzles"],
      ["other", "Something else, or a mix"],
      ["none", "They rarely watch or play"],
    ]),
  },
  {
    id: "finish",
    section: "Everyday habits",
    title: "Do they finish a 10-minute cartoon?",
    hint: "Picture an episode they picked themselves.",
    options: options([
      ["usually", "Usually, they watch to the end"],
      ["sometimes", "Sometimes, if it catches their interest"],
      ["switch", "They often switch to something else"],
      ["unknown", "They don’t watch cartoons, or I’m unsure"],
    ]),
  },
  {
    id: "handoff",
    section: "Everyday habits",
    title: "Think of the last time you said “time to stop.” What happened?",
    hint: "Pick the closest match. An ordinary day is enough.",
    options: options([
      ["easy", "They usually move on easily"],
      ["reminder", "One reminder usually does it"],
      ["bargain", "They ask for a little more time"],
      ["hard", "Stopping can feel upsetting"],
      ["varies", "It depends, or we haven’t tried it"],
    ]),
  },
  {
    id: "reading",
    section: "Everyday habits",
    title: "When your child picks up a book, what do they usually do?",
    hint: "Shared reading and looking at pictures count as time with books.",
    options: options([
      ["alone", "They read on their own"],
      ["both", "Some independent reading, some together"],
      ["together", "Mostly shared reading or picture books"],
      ["early", "They’re just getting started with books"],
      ["rare", "Books rarely come up right now"],
    ]),
  },
];

export const MOMENT: FunnelQuestion = {
  id: "moment",
  title: "When would you try this first?",
  section: "Your first session",
  hint: "Choose one screen turn you already allow.",
  options: options([
    ["afternoon", "After school or daycare"],
    ["dinner", "While dinner is cooking"],
    ["weekend", "On the weekend"],
    ["flex", "I’ll decide later"],
  ]),
};
export const ATTEMPT: FunnelQuestion = {
  id: "attempt",
  title: "What have you tried when it’s time to stop?",
  hint: "Pick the one you use most often.",
  options: options([
    ["timer", "Setting a timer"],
    ["warning", "Giving a five-minute warning"],
    ["away", "Putting the device away"],
    ["choice", "Offering something else to do"],
    ["new", "We’re still figuring it out"],
  ]),
};
export const ROUTE = [
  "cover",
  "welcome",
  "growth",
  "feed",
  "match",
  "reward",
  "personalize",
  "goal",
  "age",
  "handoff",
  "content",
  "finish",
  "reading",
  "pause",
  "duration",
  "profile",
  "week",
  "attempt",
  "method",
  "parent",
  "example",
  "benefits",
  "moment",
  "result",
  "offer",
];
export const question = (id: string) =>
  id === MOMENT.id
    ? MOMENT
    : id === ATTEMPT.id
      ? ATTEMPT
      : FUNNEL_QUESTIONS.find((q) => q.id === id);
export const choiceLabel = (id: string, val: unknown) =>
  id === "attempt" && val === "unspecified"
    ? "Not previously asked"
    : question(id)?.options.find((o) => o.value === val)?.label;
export const complete = (answers: FunnelDraft) =>
  FUNNEL_QUESTIONS.every((q) => choiceLabel(q.id, answers?.[q.id])) && answers.age !== "outside";
export const coverAngles = {
  default: {
    title: "Give screen time a happy ending.",
    body: "Help your child learn, play, and put the screen down. Build a routine for your family.",
  },
  ending: {
    title: "Make the last turn easier.",
    body: "Give your child a finish they can see and something to look forward to afterward.",
  },
  learning: {
    title: "What if screen time started with a puzzle?",
    body: "See how a little learning can earn the fun your child already loves.",
  },
  offline: {
    title: "Give your child a reason to look up.",
    body: "Build a screen-time routine with something to look forward to off-screen.",
  },
};

export function reachable(target: string, answers: FunnelDraft) {
  if (answers.age === "outside" && ["outside", "age"].includes(target)) return target;
  if (!ROUTE.includes(target)) return "cover";
  for (const step of ROUTE.slice(0, ROUTE.indexOf(target))) {
    if (step === "age" && answers.age === "outside") return "outside";
    if (question(step) && !choiceLabel(step, answers[step as FunnelQuestionId])) return step;
  }
  return target;
}
export function entryFor(answers: FunnelDraft, bookmark?: string) {
  if (answers.age === "outside") return "age";
  if (
    complete(answers) &&
    choiceLabel("moment", answers.moment) &&
    choiceLabel("attempt", answers.attempt)
  )
    return "result";
  if (bookmark && ROUTE.includes(bookmark) && bookmark !== "cover")
    return reachable(bookmark, answers);
  return (
    ROUTE.find((step) => question(step) && !choiceLabel(step, answers[step as FunnelQuestionId])) ||
    "welcome"
  );
}
export function restoreFunnel(raw: string | null) {
  const blank = { screen: "cover", answers: {}, resumeAt: "welcome" };
  try {
    const state = JSON.parse(raw ?? "null");
    if (
      ![2, 3, VERSION].includes(state?.version) ||
      !state.answers ||
      typeof state.answers !== "object" ||
      Array.isArray(state.answers)
    )
      return blank;
    const answers: FunnelDraft = {};
    for (const q of [...FUNNEL_QUESTIONS, ATTEMPT, MOMENT]) {
      if (choiceLabel(q.id, state.answers[q.id])) answers[q.id] = state.answers[q.id];
    }
    const bookmark = state.screen === "cover" ? state.resumeAt : state.screen;
    if (state.version < 4) {
      if (
        complete(answers) &&
        (answers.moment ||
          (state.version === 2 && ["offer", "method", "result"].includes(bookmark)))
      ) {
        answers.moment ||= "flex";
        answers.attempt = "unspecified";
      }
      if (!complete(answers)) {
        const firstMissing = ROUTE.find(
          (step) => question(step) && !choiceLabel(step, answers[step as FunnelQuestionId]),
        );
        return {
          screen: reachable(typeof state.screen === "string" ? state.screen : "cover", answers),
          answers,
          resumeAt: answers.age === "outside" ? "age" : firstMissing || "welcome",
        };
      }
    }
    const screen = reachable(typeof state.screen === "string" ? state.screen : "cover", answers);
    return { screen, answers, resumeAt: entryFor(answers, bookmark) };
  } catch {
    return blank;
  }
}

const goals: Record<
  string,
  { title: string; focus: string; intro: string; feature: string; benefit: string }
> = {
  ending: {
    title: "The one-and-done routine",
    focus: "an easier ending",
    intro: "Give the session an ending your child can picture before it begins.",
    feature: "A visible stopping point",
    benefit:
      "Each learning game ends with a choice to stop. After three games, Brainy suggests a break.",
  },
  learning: {
    title: "The curiosity-first routine",
    focus: "more room for learning",
    intro: "Use something your child already likes as the invitation to learn.",
    feature: "Learning gets the first turn",
    benefit:
      "Your child starts with a few learning games to choose from. You can see which skills they practiced in your parent view.",
  },
  offline: {
    title: "The screen-to-real-life routine",
    focus: "an easier move off-screen",
    intro: "Decide what comes after the screen while your child is still choosing what to play.",
    feature: "An off-screen next step",
    benefit:
      "Choose a task your child can do when play ends, such as watering a plant or setting out napkins. It appears among the tasks you can approve.",
  },
  explore: {
    title: "The try-it-together routine",
    focus: "a routine that fits",
    intro: "Try the same simple opening and ending twice, then keep the part that feels right.",
    feature: "A shared point of reference",
    benefit:
      "Your child sees their Brainy character change as they play. You can follow that activity from the parent side.",
  },
};
const timeNotes: Record<string, string> = {
  little: "Use a screen turn you already allow and keep it short.",
  half: "Pick one familiar screen turn to try your routine.",
  one: "Try this during just one of the day’s screen sessions.",
  two: "Start with one predictable screen turn and leave the rest of the day as it is.",
  none: "Use this the next time a screen comes out, even if that is weeks away.",
  varies: "Choose the next convenient screen turn, whenever it happens.",
};
const formats: Record<string, [string, string]> = {
  clips: [
    "a quick visual puzzle",
    "One puzzle has a last piece. A stream of clips can always offer another.",
  ],
  kids: [
    "one handpicked video",
    "Picking one video together gives everyone a chance to agree on the ending before pressing play.",
  ],
  shows: [
    "one favorite episode",
    "An episode already has an ending. The credits can become a cue to move on.",
  ],
  games: ["one puzzle round", "A completed round gives your family a specific place to pause."],
  other: [
    "one activity you both choose",
    "Picking one activity together makes it easier to describe what “finished” will look like.",
  ],
  none: [
    "one shared picture puzzle",
    "An occasional screen turn can have a clear beginning and end right from the start.",
  ],
};
const finishNotes: Record<string, string> = {
  usually: "Let the ending they already recognize be the cue.",
  sometimes: "Let them pick the topic before you start.",
  switch: "Choose something with one small, visible finish, like finding a matching pair.",
  unknown: "Point out what the end will look like before you begin.",
};
const handoffNotes: Record<string, string> = {
  easy: "Use the ending they already manage and invite them to choose what comes next.",
  reminder: "Give the familiar reminder close to the end, then put the device in its usual spot.",
  bargain:
    "Agree on the last turn together. When they ask for more, point back to the finish you chose.",
  hard: "Sit beside them for the ending. Acknowledge that stopping is hard, then put the device away together.",
  varies:
    "Watch what happens at the end of one session. Try the same cue on a second day before changing it.",
};
const bookNotes: Record<string, string> = {
  alone: "Invite them to choose a book and read you a line they like.",
  both: "Trade pages in a book they choose, each taking a turn.",
  together: "Open a picture book together and let them tell you what they see.",
  early: "Look at one picture together and take turns naming what you notice.",
  rare: "Try an off-screen twist on what they enjoyed. Draw a character or make a puzzle from toys.",
};
const ageNotes: Record<string, string> = {
  "4-5": "Offer two choices and let them point.",
  "6-7": "Let them choose and say which part will be the last.",
  "8-10": "Invite them to suggest the stopping point and agree on it together.",
};

const contentInsight: Record<string, [string, string]> = {
  clips: [
    "Short clips keep the next choice open.",
    "One clip can end while the feed keeps going. For your first session, pick something your child can finish, like finding the last matching pair.",
  ],
  kids: [
    "Pick the video before pressing play.",
    "Choose one video together and agree that its ending is the stopping point. In Brainy, another video won’t start on its own.",
  ],
  shows: [
    "The credits can do some of the work.",
    "Your child already has a visible ending. Decide together what comes after the credits before the episode starts.",
  ],
  games: [
    "A round gives you a place to pause.",
    "“When this puzzle is finished” gives your child something they can see. Try agreeing on the last round together before starting.",
  ],
  other: [
    "Let the activity supply the ending.",
    "The next time you choose a game or story, name the last move or last page together. That gives both of you the same cue.",
  ],
  none: [
    "Keep it for the next time a screen comes out.",
    "There’s no need to add screen time. On a day you already allow it, choose one activity together and decide where it ends.",
  ],
};
export function pauseFor(answers: FunnelDraft) {
  const [title, body] = contentInsight[answers.content ?? "other"] ??
    contentInsight.other ?? ["", ""];
  return { title, body };
}

export function profileFor(answers: FunnelDraft) {
  if (!isFunnelBaseAnswers(answers)) return null;
  const { handoff, finish, content } = answers;
  if (content === "none" || answers.duration === "none")
    return {
      title: "An occasional screen turn",
      why: "Screens come up infrequently in your routine.",
      lever: "Keep this plan for the next time you would already offer a screen.",
    };
  if (handoff === "hard" || handoff === "bargain")
    return {
      title: "The last turn is the hard part",
      why:
        handoff === "hard"
          ? "You said putting the device away can be upsetting."
          : "You said your child usually asks for more time.",
      lever: "Try agreeing on one visible ending before play begins. Stay nearby when it arrives.",
    };
  if (finish === "switch")
    return {
      title: "A small finish comes first",
      why: "You said your child often switches away from a ten-minute cartoon.",
      lever:
        "Start with one small, complete activity. Finding one pair gives you a finish you can point to together.",
    };
  if (handoff === "easy" || handoff === "reminder")
    return {
      title: "Build on the ending that already works",
      why:
        handoff === "easy"
          ? "You said your child usually puts the device down easily."
          : "You said one reminder usually does it.",
      lever:
        "Keep that familiar cue. Use the change you want to make when choosing the first activity.",
    };
  return {
    title: "Try one screen turn together",
    why: "Your answers leave room for more than one pattern.",
    lever: "Watch one familiar session together. Notice what holds their interest and how it ends.",
  };
}

const moments: Record<string, string> = {
  afternoon: "After school or daycare",
  dinner: "While dinner is cooking",
  weekend: "This weekend",
  flex: "At the next screen turn you choose",
};
const cues: Record<string, string> = {
  clips: "“Let’s find one matching pair. When we find it, we’re done.”",
  kids: "“Let’s choose one video together. When it ends, we’ll put the screen away.”",
  shows: "“One episode. When the credits roll, we’ll get up together.”",
  games: "“Which round will be our last? Let’s pick before we play.”",
  other: "“Show me where this game or story ends. That’s where we’ll stop today.”",
  none: "“Let’s try one picture puzzle together. Then we’ll put it away.”",
};
const lookFor: Record<string, string> = {
  ending: "When play ends, does your child recognize the stopping cue you agreed on?",
  learning: "After the activity, can your child show you one thing they figured out?",
  offline: "When the screen goes away, does having the next activity ready help?",
  explore: "Which part would you repeat next time, and which part would you change?",
};

export const previousCue: Record<string, string> = {
  timer:
    "Keep the timer as a heads-up. Agree on the last puzzle or episode before you press start.",
  warning: "Use your usual warning, then point to the last move your child can see.",
  away: "Choose where the device will rest and let your child put it there at the end.",
  choice: "Set the next activity out before play, so your child can see what comes next.",
  new: "For the first try, sit together and name the last turn before you start.",
};
export function weekFor(duration: string) {
  const estimates: Record<string, string> = {
    little: "Under 3½ hours",
    half: "3½ to under 7 hours",
    one: "7 to under 14 hours",
    two: "14 hours or more",
  };
  if (estimates[duration])
    return {
      title: estimates[duration],
      body: "That’s the weekly estimate if all seven days look like the day you described. Pick just one screen turn to try a different ending.",
    };
  return duration === "none"
    ? {
        title: "Keep screen time occasional.",
        body: "You said most days already have no recreational screen time. Save the routine for a day you would offer it anyway.",
      }
    : {
        title: "One turn is enough to start.",
        body: "Your weeks vary. Pick the next screen turn you already allow and try the routine then.",
      };
}

export function planFor(answers: FunnelDraft) {
  if (!isFunnelBaseAnswers(answers)) return null;
  const goal = goals[answers.goal];
  const format = formats[answers.content]?.[0];
  return {
    ...goal,
    moment: moments[answers.moment] || moments.flex,
    cue: cues[answers.content],
    check: lookFor[answers.goal],
    age: (choiceLabel("age", answers.age) ?? "").replace(" years old", ""),
    steps: [
      {
        label: "Before the screen",
        title: "Choose the last turn.",
        body: `${timeNotes[answers.duration]} ${ageNotes[answers.age]}`,
      },
      {
        label: "During the session",
        title: `Start with ${format}.`,
        body: finishNotes[answers.finish],
      },
      {
        label: "When it ends",
        title: "Make the handoff together.",
        body: [handoffNotes[answers.handoff], previousCue[answers.attempt]]
          .filter(Boolean)
          .join(" "),
      },
      {
        label: "Back off-screen",
        title: "Give the next moment a cue.",
        body: bookNotes[answers.reading],
      },
    ],
  };
}

export function planText(answers: FunnelDraft) {
  const plan = planFor(answers);
  if (!plan) return "";
  return [
    "BRAINY · FAMILY STARTING PLAN",
    plan.title,
    `For ages ${plan.age} · Your goal: ${plan.focus}`,
    "",
    plan.intro,
    "",
    `When to try it: ${plan.moment}`,
    `What to say: ${plan.cue}`,
    `Afterward: ${plan.check}`,
    "",
    ...plan.steps.map((s, i) => `${i + 1}. ${s.label} — ${s.title}\n${s.body}\n`),
  ].join("\n");
}

/** Billing is deliberately pending. No configuration can enable checkout. */
export function commercialPlans(_config?: unknown): readonly never[] {
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function isFunnelBaseAnswers(value: unknown): value is FunnelAnswers {
  return (
    isRecord(value) &&
    value.age !== "outside" &&
    FUNNEL_QUESTIONS.every((q) => !!choiceLabel(q.id, value[q.id]))
  );
}
/** Accept only known, completed, in-range answers at the signup boundary. */
export function isFunnelAnswers(value: unknown): value is FunnelAnswers {
  return (
    isFunnelBaseAnswers(value) &&
    [ATTEMPT, MOMENT].every((q) => !!choiceLabel(q.id, value[q.id])) &&
    Object.keys(value).every((k) => !!question(k))
  );
}
const quizMap: Record<
  keyof QuizAnswers,
  { question: FunnelQuestionId; values: Record<string, number> }
> = {
  hours: {
    question: "duration",
    values: { two: 0, one: 1, varies: 1, half: 2, little: 3, none: 3 },
  },
  content: {
    question: "content",
    values: { clips: 0, kids: 2, other: 2, shows: 3, games: 3, none: 3 },
  },
  finish: { question: "finish", values: { switch: 0, sometimes: 1, unknown: 1, usually: 3 } },
  reaction: {
    question: "handoff",
    values: { hard: 0, bargain: 1, varies: 1, reminder: 2, easy: 3 },
  },
  reads: { question: "reading", values: { rare: 0, early: 1, together: 2, both: 2, alone: 3 } },
};
export function funnelQuizAnswers(answers: FunnelAnswers): QuizAnswers {
  if (!isFunnelAnswers(answers)) throw new RangeError("Invalid funnel answers.");
  return Object.fromEntries(
    Object.entries(quizMap).map(([key, map]) => [key, map.values[answers[map.question]]]),
  ) as QuizAnswers;
}
/** Birth-year ages match the existing minAge convention; signup asks for the exact year. */
export function funnelBirthYears(
  age: string,
  currentYear: number,
): { min: number; max: number } | null {
  if (!Number.isInteger(currentYear) || currentYear < 1900)
    throw new RangeError("Invalid current year.");
  const bands: Record<string, [number, number]> = { "4-5": [4, 5], "6-7": [6, 7], "8-10": [8, 10] };
  const band = Object.hasOwn(bands, age) ? bands[age] : undefined;
  return band ? { min: currentYear - band[1], max: currentYear - band[0] } : null;
}
