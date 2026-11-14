export const COUNTS = [1, 2, 3, 4, 5, 6] as const;
export const MAX_LEVEL = COUNTS.length;
/** All six levels fit the tested phone layouts without changing their pair count. */
export function levelFor(value: number) {
  const level = Number.isFinite(value) ? Math.min(MAX_LEVEL, Math.max(1, Math.round(value))) : 1;
  return { level, count: COUNTS[level - 1], mixGroups: level >= 4 };
}
