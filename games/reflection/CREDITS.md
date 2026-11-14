# Mirror Grid (Reflection)

Sugarizer Reflection Activity by Lionel Laské and Sugar Labs contributors, Apache-2.0. See `artifact/LICENSE` and `artifact/NOTICE`.
Pinned repository: https://github.com/llaske/sugarizer/tree/60ccdbcb004de1a706749c7314edfa0d160288b4/activities/Reflection.activity
Commit: `60ccdbcb004de1a706749c7314edfa0d160288b4`

`artifact/` retains 104 original files byte-for-byte, verified by Git blob SHA-1 and SHA-256 in `sources.lock.json`. Normal builds are completely offline and all runtime assets are same-origin.

Brainee changes:
- Standalone execution without Sugarizer journal/server/home or external Google Fonts.
- Protocol 2 bridge adapter communicating with host `<GameHost>`.
- 4 completed patterns per session (`roundsPerSession: 4`).
- Seeded pattern generator via `Mulberry32(seed)` for deterministic tasks.
- 3 difficulty levels:
  - Level 1: 4×4 grid, 1 vertical axis, 2 colors (white and blue).
  - Level 2: 6×6 grid, 1 vertical axis, 3 colors (white, blue, and red).
  - Level 3: 6×6 grid, 2 bilateral axes, 3 colors (white, blue, and red).
- Visible mirror axis dividing sample side from player side.
- Explicit Check button ("Check").
- Educational evaluation: failed Check reports one mistake; a completed pattern after any failed Check reports one correction.
- Exactly 4 completed patterns emit one final `GameResult`.
- Touch targets >= 48px.
- Russian host chrome and messages; no timers, audio autoplay, or external navigation.
