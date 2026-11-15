export const funnelCopy = {
  continue: "Continue",
  back: "Back",
  progress: "Your family plan progress",
  start: "Meet Brainy",
  resume: "Continue my plan",
  signup: "Create my family account",
  signupTitle: "Save your family starting plan",
  signupNote:
    "Create an account to keep your answers, set up your child’s device and start with a Brainy shaped by your quiz.",
  change: "Change",
  review: "See or change my answers",
  close: "Close",
  privacy: "Your answers and privacy",
  privacyBody:
    "Your answers stay in this browser while you explore. When you create an account, we save them with your family so your starting Brainy and family plan fit your choices. Signup also asks for your email, a password, your child's first name and birth year, and a parent PIN. We do not send funnel events to analytics services.",
  pending: "Pricing pending",
  pendingBody:
    "Membership prices and renewal terms are not available yet. You can create a demo family account to try the learning routine. There is no payment or checkout.",
  range: (min: number, max: number) =>
    `For the age range you chose, enter a birth year from ${min} to ${max}.`,
  loading: "Opening your plan…",
  quote: "A phrase to say",
  notice: "Afterward, notice",
  forParents: "For parents",
  meet: "Meet Brainy",
  family: "Your family",
  starting: "Your starting point",
  first: "Your first session",
  outside: "A little later, or a different fit",
  outsideBody:
    "Brainy is designed for children ages 4–10. You can review the age choice or leave the quiz here. There is no need to create an account.",
  chooseAge: "Review age range",
  home: "Back to the welcome page",
  saved: "Your starting plan",
  edit: "Edit answers",
  save: "Save my answers",
  download: "Download plan",
  copy: "Copy plan",
  copied: "Copied",
  copyFailed: "Copy was unavailable. Download the plan instead.",
  stories: {
    welcome: [
      "Meet Brainy.",
      "A little companion for practicing, discovering and growing. A small finish counts.",
    ],
    growth: [
      "Little steps make a growing Brainy.",
      "Learning develops Brainy's skills. Energy shows how Brainy feels today; growth stays with you.",
    ],
    feed: [
      "Ever heard ‘just one more’?",
      "A stream can keep offering another video. A Brainy round has a last move you can agree on before you begin.",
    ],
    match: [
      "Find a small finish.",
      "A short puzzle gives you something to complete together, then a place to stop.",
    ],
    reward: [
      "One round ends here.",
      "Learning earns stars for digital treats. The next activity waits for your choice.",
    ],
    personalize: [
      "Let's make this fit your child.",
      "Think of an ordinary day. There are no right answers and no scores for parents.",
    ],
    parent: [
      "See what your child practiced.",
      "Follow completed sessions, growing skills and real-life tasks. Keep the next step small and specific.",
    ],
    benefits: [
      "Two ways to celebrate effort.",
      "Stars come from learning. Suns come from real-life tasks you approve. Device controls help you choose when screens fit.",
    ],
  } as Record<string, readonly [string, string]>,
};
