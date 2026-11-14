export const childDesignCopy = {
  path: "Path",
  pathTitle: "Your growing world",
  week: "Learning this week",
  minutes: "minutes",
  here: "You are here",
  energy: "Energy",
  grown: "Keep growing, one small step at a time.",
  today: (n: number) => `+${n} ★ from games today`,
  hub: (name: string, energy: number, stage: string) =>
    `${name}, energy ${energy} out of 100, ${stage}`,
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  stages: ["Sleepy", "Awake", "Lively", "Smart", "Genius"],
  badges: "Your discoveries",
  rewardNames: {
    captainBackpack: "Captain backpack",
    explorerBadge: "Explorer badge",
    ownGarden: "Your garden",
    heroCape: "Hero cape",
  },
  progress: (value: number, target: number) => `${value} / ${target}`,
};
