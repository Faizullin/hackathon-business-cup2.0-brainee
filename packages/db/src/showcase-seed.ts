import type { Showcase } from "@brainee/core";
import { builtInFun } from "./fun-catalog";

// D-21: hand-picked demo content in US English (the product is English-only). Analytics are illustrative, not computed.
export const demoShowcase: Showcase = {
  equipped: { face: "glasses" },
  owned: ["glasses"],
  earned: ["captainBackpack", "explorerBadge"],
  weekGoal: { earned: 6, target: 10, giftId: "cinema", due: "Sunday" },
  tasks: [
    {
      id: "t1",
      title: "15 minutes of logic games",
      place: "app",
      skill: "Logic",
      reward: 15,
      status: "done",
    },
    {
      id: "t2",
      title: "Tidy up your room",
      place: "real",
      skill: "Responsibility",
      reward: 2,
      status: "check",
    },
    {
      id: "t3",
      title: "Read a book before bed",
      place: "real",
      skill: "Reading",
      reward: 3,
      status: "todo",
    },
    {
      id: "t4",
      title: "Play outside for 30 minutes",
      place: "real",
      skill: "Motor skills",
      reward: 1,
      status: "todo",
    },
  ],
  templates: [
    { title: "Tidy up", reward: 2, skill: "Responsibility" },
    { title: "Outdoors", reward: 1, skill: "Motor skills" },
    { title: "Book", reward: 3, skill: "Reading" },
    { title: "Homework solo", reward: 2, skill: "Responsibility" },
    { title: "Top grade", reward: 3, skill: "Do the hard thing" },
  ],
  recommendations: [
    {
      id: "r-attention",
      skill: "Attention",
      value: 41,
      average: 52,
      part: "Brainy's eyes",
      why: "Usually drops attention tasks after 4–5 minutes.",
      items: [
        {
          id: "puzzle",
          title: "Build a 60-piece puzzle together",
          reward: 3,
          duration: "20 min",
        },
        { id: "freeze", title: "Play “Freeze” on a walk", reward: 1, duration: "10 min" },
      ],
    },
    {
      id: "r-hard",
      skill: "Do the hard thing",
      value: 35,
      average: 47,
      part: "Hero cape",
      why: "At the start, picks “other games” 30% of the time.",
      items: [
        {
          id: "clay",
          title: "Make a clay figure you have never tried before",
          reward: 2,
          duration: "25 min",
        },
      ],
    },
    {
      id: "r-reading",
      skill: "Reading",
      value: 48,
      average: 55,
      part: "Brainy's mouth",
      why: "Growing slower than average: +8 this month vs +12 for peers.",
      items: [
        {
          id: "signs",
          title: "Read 5 street signs on the way home",
          reward: 1,
          duration: "10 min",
        },
      ],
    },
  ],
  gifts: [
    { id: "cinema", title: "Movie night out", price: 10 },
    { id: "icecream", title: "Ice cream", price: 3 },
    { id: "stickers", title: "Sticker pack", price: 2 },
    { id: "cartoon-night", title: "Pick tonight's cartoon", price: 4 },
    { id: "park", title: "Amusement park", price: 15 },
  ],
  requests: [
    {
      id: "req-1",
      giftId: "stickers",
      title: "Sticker pack",
      at: "2026-11-12T16:20:00.000Z",
      delivered: true,
    },
  ],
  fun: builtInFun(),
  science: [
    {
      // Interactive films: apps/web/public/media/films/<id>.{mp3,json} (docs/dev/films.md).
      id: "sky-blue",
      title: "Why the sky is blue?",
      minutes: 13,
      icon: "sun",
      colors: ["#1F3FA8", "#3C68EE"],
      question: "Why is the sky blue?",
      options: ["It mirrors the sea", "Air bounces blue light", "Someone painted it"],
      answer: 1,
      position: 0,
      solved: false,
    },
    {
      id: "rain",
      title: "Rain",
      minutes: 13,
      icon: "rain",
      colors: ["#4A5694", "#7C86A8"],
      question: "On a sunny day, where did the puddle go?",
      options: ["It turned to sand", "Up into the air", "A bird drank it"],
      answer: 1,
      position: 0,
      solved: false,
    },
    {
      id: "sun-goes",
      title: "Where the sun goes",
      minutes: 13,
      icon: "moon",
      colors: ["#2A2546", "#E5731A"],
      question: "When it's night here, what is the sun doing?",
      options: ["Shining on other kids", "Sleeping in a bed", "Hiding under the sea"],
      answer: 0,
      position: 0,
      solved: false,
    },
  ],
  // Illustrative values for the demo; real age norms remain T-83.
  ageAverages: { speech: 55, reading: 55, logic: 58, attention: 52, memory: 56, motor: 60 },
  entryLog: { took: 14, other: 6 },
  feed: [
    { at: "2026-11-14T00:00:00.000Z", kind: "game", title: "Odd One Out · 1", amount: 12 },
    { at: "2026-11-13T17:40:00.000Z", kind: "task-done", title: "Tidy up your room" },
    { at: "2026-11-13T15:10:00.000Z", kind: "video", title: "Rain", amount: 15 },
    { at: "2026-11-12T16:20:00.000Z", kind: "gift-bought", title: "Sticker pack", amount: 2 },
  ],
  analytics: {
    weeks: 8,
    quizStats: { brain: 18, eyes: 16, mouth: 14, arms: 14, legs: 18, resp: 10 },
    metrics: {
      focusMinutes: 14,
      focusDelta: "+5 min this month",
      streakDays: 12,
      streakNote: "record",
      takesRecommendation: 70,
      recommendationDelta: "+15 pts this month",
    },
    insight: { improved: "logic", improvedDelta: 18, lagging: "attention", value: 41, average: 52 },
    skills: {
      labels: ["Speech", "Reading", "Logic", "Attention", "Memory", "Motor skills"],
      now: [62, 48, 78, 41, 55, 70],
      monthAgo: [50, 40, 60, 30, 52, 58],
      average: [55, 55, 58, 52, 56, 60],
    },
    character: {
      labels: [
        "Long game",
        "Learning machine",
        "Do the hard thing",
        "Learn from mistakes",
        "Responsibility",
      ],
      now: [58, 72, 35, 64, 80],
      monthAgo: [50, 60, 25, 52, 66],
    },
    week: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      learning: [25, 30, 18, 35, 28, 40, 32],
      science: [10, 0, 12, 0, 15, 24, 20],
      fun: [12, 18, 8, 16, 12, 20, 16],
    },
    hardThing: {
      weeks: ["1", "2", "3", "4", "5", "6", "7", "8"],
      share: [40, 45, 48, 52, 55, 60, 66, 70],
      finished: 23,
      recommended: 26,
    },
    ranking: {
      district: {
        growth: {
          summary: "#3 for growth among 312 kids in the neighborhood · top 1%",
          rows: [
            { place: 1, name: "Sophia N.", value: "+64%" },
            { place: 2, name: "Liam S.", value: "+51%" },
            { place: 3, name: "Mia B.", value: "+43%", me: true },
            { place: 4, name: "Olivia K.", value: "+39%" },
            { place: 5, name: "Noah M.", value: "+35%" },
          ],
        },
        absolute: {
          summary: "#14 of 312 · top 5% of the neighborhood",
          rows: [
            { place: 12, name: "Olivia K.", value: "2,140" },
            { place: 13, name: "Liam S.", value: "2,105" },
            { place: 14, name: "Mia B.", value: "2,090", me: true },
            { place: 15, name: "Emma Z.", value: "2,050" },
            { place: 16, name: "Daniel O.", value: "2,010" },
          ],
        },
      },
      city: {
        growth: {
          summary: "#41 for growth of 4,820 · top 1%",
          rows: [
            { place: 39, name: "Ava T.", value: "+45%" },
            { place: 40, name: "Mason K.", value: "+44%" },
            { place: 41, name: "Mia B.", value: "+43%", me: true },
            { place: 42, name: "Harper R.", value: "+43%" },
            { place: 43, name: "Lucas S.", value: "+42%" },
          ],
        },
        absolute: {
          summary: "#187 of 4,820 · top 4%",
          rows: [
            { place: 185, name: "Chloe E.", value: "2,101" },
            { place: 186, name: "Ethan G.", value: "2,095" },
            { place: 187, name: "Mia B.", value: "2,090", me: true },
            { place: 188, name: "Lily U.", value: "2,088" },
            { place: 189, name: "Owen B.", value: "2,080" },
          ],
        },
      },
      country: {
        growth: {
          summary: "#266 for growth of 38,150 · top 1%",
          rows: [
            { place: 264, name: "Zoe A.", value: "+43%" },
            { place: 265, name: "Jack Z.", value: "+43%" },
            { place: 266, name: "Mia B.", value: "+43%", me: true },
            { place: 267, name: "Ella D.", value: "+42%" },
            { place: 268, name: "Henry N.", value: "+42%" },
          ],
        },
        absolute: {
          summary: "#1,204 of 38,150 · top 4%",
          rows: [
            { place: 1202, name: "Grace O.", value: "2,092" },
            { place: 1203, name: "Ryan L.", value: "2,091" },
            { place: 1204, name: "Mia B.", value: "2,090", me: true },
            { place: 1205, name: "Nora M.", value: "2,089" },
            { place: 1206, name: "Caleb T.", value: "2,087" },
          ],
        },
      },
    },
    recap: {
      month: "November",
      achievements: ["Logic +18 this month", "12 days in a row", "23 recommended games finished"],
      referral: "BRAINY-MIA",
    },
  },
};
