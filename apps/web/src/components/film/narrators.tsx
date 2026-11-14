import { Brainy } from "@brainee/brainy";
import type { BrainyStats, Equipped } from "@brainee/core";
import type { FilmNarrator } from "@brainee/films";

type BrainyNarratorProps = { stats: BrainyStats; equipped?: Equipped; talk: number };

function BrainyNarrator({ stats, equipped, talk }: BrainyNarratorProps) {
  return <Brainy stats={stats} equipped={equipped} talk={talk} label="" />;
}

/**
 * The child's own Brainy as a film's narrator: its look comes from the saved stats and it
 * wears the accessories the child bought. Films never depend on it; any `FilmNarrator` fits.
 */
export function brainyNarrator(stats: BrainyStats, equipped: Equipped = {}): FilmNarrator {
  return ({ talk }) => <BrainyNarrator stats={stats} equipped={equipped} talk={talk} />;
}
