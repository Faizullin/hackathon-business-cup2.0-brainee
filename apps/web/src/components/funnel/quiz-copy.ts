// English copy for the Brain Check funnel. Rules and ids live in packages/core/src/funnel-quiz.ts.
// Before the result screen the word "Brainy" is not used for the brain: it is "the brain check".

export type Opt = readonly [value: string, label: string];

export const quizCopy = {
  loading: "Opening your brain check…",
  brand: "Brainy",
  forParents: "For parents",
  jury: "Jury entry",
  juryNote: "Skip to the demo family",
  juryError: "Could not open the demo. Please try again.",
  back: "Back",
  progress: "Quiz progress",
  continue: "Continue",
  account: "I already have an account",
  fallbackName: "your kid",
  fallbackNameCap: "Your kid",
  legal: "By continuing you agree to our Terms, Privacy Policy and Subscription Terms.",
  sections: ["Habits", "Your child", "Results", "Your plan"] as readonly string[],

  panel: {
    kicker: "Brain check",
    score: "/ 100",
    caption: "Moves with every answer you give.",
    label: "Brain check score",
  },

  single: {
    duration: {
      kicker: "1-minute brain check for parents",
      title: "How much fun screen time does your kid get a day?",
      hint: "Phone, tablet and TV. Leave out school.",
      options: [
        ["lt30", "Under 30 minutes"],
        ["30-60", "30 minutes to 1 hour"],
        ["60-120", "1 to 2 hours"],
        ["120-240", "2 to 4 hours"],
        ["240+", "More than 4 hours"],
      ],
    },
    content: {
      title: "What do they reach for first?",
      hint: "Pick what you see most often.",
      options: [
        ["shorts", "Shorts, Reels or TikTok-style clips"],
        ["ytk", "YouTube Kids"],
        ["shows", "Cartoons and full episodes"],
        ["games", "Games"],
        ["learn", "Learning apps"],
      ],
    },
    finish: {
      title: "Can they finish a 10-minute cartoon without switching?",
      options: [
        ["yes", "Yes, usually to the end"],
        ["some", "Sometimes"],
        ["switch", "No, they keep switching"],
        ["unsure", "Not sure"],
      ],
    },
    handoff: {
      title: "You say “time to stop.” What happens?",
      options: [
        ["easy", "They move on easily"],
        ["remind", "One reminder does it"],
        ["more", "“Just one more!”"],
        ["melt", "Tears or a meltdown"],
      ],
    },
    reading: {
      title: "How often do they pick up a book on their own?",
      options: [
        ["daily", "Almost every day"],
        ["week", "A few times a week"],
        ["rare", "Rarely"],
        ["never", "Only when I insist"],
      ],
    },
    minutes: {
      title: (n: string) => `How much learning time a day works for ${n}?`,
      hint: "Brainy suggests a break after 3 games in a row.",
      options: [
        ["10", "10 minutes"],
        ["15", "15 minutes, recommended"],
        ["20", "20 minutes"],
      ],
    },
  } as Record<
    "duration" | "content" | "finish" | "handoff" | "reading",
    { kicker?: string; title: string; hint?: string; options: readonly Opt[] }
  > & {
    minutes: { title: (n: string) => string; hint: string; options: readonly Opt[] };
  },

  child: {
    title: "Who are we checking?",
    hint: "We’ll use the name for the result and the plan.",
    nameLabel: "Child’s first name (optional)",
    namePlaceholder: "e.g. Leo",
    ageLabel: "Age",
    ages: [
      ["4-5", "4–5"],
      ["6-7", "6–7"],
      ["8-10", "8–10"],
      ["other", "Other"],
    ] as readonly Opt[],
  },
  exit: {
    title: "Brainy is made for ages 4–10",
    hint: "Leave your email and we’ll write when there’s something for your family.",
    email: "you@email.com",
    notify: "Notify me",
    thanks: "Thank you. We saved your email on this device.",
    invalid: "Enter a valid email address.",
    change: "Change the age",
  },
  scale: {
    kicker: "How much do you relate?",
    low: "Not at all",
    high: "Completely",
    guilt: "I feel guilty handing over the iPad, but sometimes I just need a break.",
    limits: "I’ve set screen-time limits, but they don’t stick.",
  },
  attempt: {
    title: "What have you already tried?",
    hint: "Choose all that apply.",
    options: [
      ["limits", "Screen Time or Family Link limits"],
      ["apps", "A paid learning app"],
      ["away", "Taking the device away"],
      ["timer", "Timers and warnings"],
      ["none", "Nothing yet"],
    ] as readonly Opt[],
  },
  goal: {
    title: (n: string) => `In 4 weeks, what would you love to see in ${n}?`,
    hint: "Choose all that apply.",
    options: [
      ["finish", "Finishes what they start"],
      ["read", "Picks up a book without a fight"],
      ["stop", "Puts the screen down calmly"],
      ["curious", "Asks “why?” more often"],
      ["help", "Helps around the house"],
    ] as readonly Opt[],
  },
  analyze: {
    title: (n: string) => `Checking ${n}’s answers`,
    rows: ["Screen habits", "Focus", "Reading", "Calm endings"],
    quote: "[Real quote from a parent interview]",
    quoteBy: "Parent of a 6-year-old",
  },
  reveal: {
    kicker: "Brain check result",
    title: (n: string) => [`This is ${n}’s `, "Brainy", " today"] as const,
    sub: "Brainy is your kid’s brain as a character. It shows what the feed is doing to focus, reading and calm.",
    signals: { focus: "Focus", reading: "Reading", calm: "Calm endings" },
    levels: { low: "Low", below: "Below age", on: "On track" },
    key: (age: string) =>
      `Line = typical for ages ${age}. A playful indicator, not a medical assessment.`,
    cta: "Can it get better?",
    alt: (n: string) => `${n}’s Brainy today`,
  },
  ontime: {
    kicker: "Built to never end",
    title: "You’re right on time",
    sub: (n: string) =>
      `It’s not you, and it’s not ${n}. Feeds are built to never end. At 4–10, habits are still easy to change.`,
    stat: "14×",
    statBody: "more short video for kids under 8 since 2020: from 1 to 14 minutes a day.",
    source: "Common Sense Census, 2025",
    art: "One video ends while more are already lined up",
  },
  solution: {
    title: (n: string) => ["", "Brainy", ` grows as ${n} learns`] as const,
    today: (n: string) => `${n} today`,
    weeks: "In 4 weeks",
    stages: ["Sleepy", "Awake", "Lively", "Smart", "Genius"],
    trio: [
      ["lock", "Closed world", "Only our site stays open on the device. No feed, no autoplay."],
      [
        "star",
        "Fun as a reward",
        "Learning games earn stars. Stars unlock games, cartoons and outfits.",
      ],
      ["chart", "Parent cabinet", "Skills analytics, real-life tasks and real gifts from you."],
    ] as readonly (readonly [string, string, string])[],
    cta: (n: string) => `Build ${n}’s plan`,
  },
  gift: {
    title: (n: string) => `Pick ${n}’s first real reward`,
    hint: "Earned with suns for real-life tasks you approve.",
    tiles: [
      ["ice", "ice", 3, "Ice cream"],
      ["movie", "ticket", 10, "Movie night"],
      ["park", "wheel", 15, "Theme park"],
    ] as readonly (readonly [string, string, number, string])[],
    later: "Choose later",
  },
  build: {
    title: (n: string) => `Building ${n}’s plan`,
    rows: [
      "Picking first games",
      "Setting the daily rhythm",
      "Adding your reward",
      "Preparing your dashboard",
    ],
    quick: "Quick question",
    ask: (n: string) => `Should ${n} earn screen time instead of just getting it?`,
    no: "No",
    yes: "Yes",
  },
  email: {
    title: (n: string) => `Where should we send ${n}’s plan?`,
    placeholder: "you@email.com",
    fine: "Optional. We respect your privacy. No spam.",
    invalid: "Enter a valid email address, or leave it empty.",
  },
  offer: {
    ready: (n: string) => [`${n}’s plan is `, "ready", ""] as const,
    today: "Today",
    weeks: "In 4 weeks",
    includes: (minutes: string, n: string) =>
      [
        ["puzzle", `${minutes} min of games for ${n}’s weak spots`],
        ["lock", "No feed, no autoplay, no YouTube"],
        ["sun", "Real tasks and the reward you picked"],
        ["chart", "Your dashboard: 6 skills, before and after"],
      ] as const,
    yearly: "Yearly",
    monthly: "Monthly",
    best: "Best value",
    save: (n: number) => `Save ${n}%`,
    perMonthBilledYearly: "a month, billed yearly",
    perYear: "per year",
    perMonth: "per month",
    aYear: "a year",
    bonusLead: "Starter Pack for starting now:",
    bonus: " a Hero Cape for Brainy that’s never in the shop, plus 100 stars on day one.",
    strip: "Starter Pack reserved for",
    expired: "Starter Pack expired. Plans and prices stay the same.",
    cta: (n: string) => `Start ${n}’s plan`,
    starting: "Opening the app…",
    error: "Could not start the plan. Please try again.",
    planGroup: "Choose a plan",
  },
  ready: {
    title: "Your Brainy is ready",
    body: "This device already has a family. Open the app, or start the quiz again.",
    open: "Open Brainy",
    again: "Start over",
  },
} as const;

export const ageLabel = (age: string | undefined) => (age ?? "6-7").replace("-", "–");
