// English copy for the parent funnel and its saved family plan.
import type { FunnelQuestion } from "./funnel";

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
export const goals: Record<
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
export const timeNotes: Record<string, string> = {
  little: "Use a screen turn you already allow and keep it short.",
  half: "Pick one familiar screen turn to try your routine.",
  one: "Try this during just one of the day’s screen sessions.",
  two: "Start with one predictable screen turn and leave the rest of the day as it is.",
  none: "Use this the next time a screen comes out, even if that is weeks away.",
  varies: "Choose the next convenient screen turn, whenever it happens.",
};
export const formats: Record<string, [string, string]> = {
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
export const finishNotes: Record<string, string> = {
  usually: "Let the ending they already recognize be the cue.",
  sometimes: "Let them pick the topic before you start.",
  switch: "Choose something with one small, visible finish, like finding a matching pair.",
  unknown: "Point out what the end will look like before you begin.",
};
export const handoffNotes: Record<string, string> = {
  easy: "Use the ending they already manage and invite them to choose what comes next.",
  reminder: "Give the familiar reminder close to the end, then put the device in its usual spot.",
  bargain:
    "Agree on the last turn together. When they ask for more, point back to the finish you chose.",
  hard: "Sit beside them for the ending. Acknowledge that stopping is hard, then put the device away together.",
  varies:
    "Watch what happens at the end of one session. Try the same cue on a second day before changing it.",
};
export const bookNotes: Record<string, string> = {
  alone: "Invite them to choose a book and read you a line they like.",
  both: "Trade pages in a book they choose, each taking a turn.",
  together: "Open a picture book together and let them tell you what they see.",
  early: "Look at one picture together and take turns naming what you notice.",
  rare: "Try an off-screen twist on what they enjoyed. Draw a character or make a puzzle from toys.",
};
export const ageNotes: Record<string, string> = {
  "4-5": "Offer two choices and let them point.",
  "6-7": "Let them choose and say which part will be the last.",
  "8-10": "Invite them to suggest the stopping point and agree on it together.",
};

export const moments: Record<string, string> = {
  afternoon: "After school or daycare",
  dinner: "While dinner is cooking",
  weekend: "This weekend",
  flex: "At the next screen turn you choose",
};
export const cues: Record<string, string> = {
  clips: "“Let’s find one matching pair. When we find it, we’re done.”",
  kids: "“Let’s choose one video together. When it ends, we’ll put the screen away.”",
  shows: "“One episode. When the credits roll, we’ll get up together.”",
  games: "“Which round will be our last? Let’s pick before we play.”",
  other: "“Show me where this game or story ends. That’s where we’ll stop today.”",
  none: "“Let’s try one picture puzzle together. Then we’ll put it away.”",
};
export const lookFor: Record<string, string> = {
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
export const familyTaskTitles: Record<string, string> = {
  alone: "Read a page after putting the screen away",
  both: "Choose a page to read together after screen time",
  together: "Share a picture book after putting the screen away",
  early: "Look at a picture book together after screen time",
  rare: "Choose a book to explore together after screen time",
};
export const funnelCopy = {
  notPreviouslyAsked: "Not previously asked",
  yearsOldSuffix: " years old",
  before: { label: "Before the screen", title: "Choose the last turn." },
  during: {
    label: "During the session",
    title: (format: string | undefined) => `Start with ${format}.`,
  },
  ending: { label: "When it ends", title: "Make the handoff together." },
  offScreen: { label: "Back off-screen", title: "Give the next moment a cue." },
  readingSkill: "Reading",
  invalidAnswers: "Invalid funnel answers.",
  invalidYear: "Invalid current year.",
  planHeading: "BRAINY · FAMILY STARTING PLAN",
  planSummary: (age: string, focus: string | undefined) => `For ages ${age} · Your goal: ${focus}`,
  planMoment: (moment: string | undefined) => `When to try it: ${moment}`,
  planCue: (cue: string | undefined) => `What to say: ${cue}`,
  planCheck: (check: string | undefined) => `Afterward: ${check}`,
  planStep: (number: number, label: string, title: string, body: string | undefined) =>
    `${number}. ${label} — ${title}\n${body}\n`,
};
