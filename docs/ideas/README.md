# Ideas: original and design sources

The original product inputs were removed from the tree on 2026-11-15. Their maintained English specifications and the current redesign inputs are listed here.

| Original (in git history at `b1a3c68`) | Maintained in |
|---|---|
| PRD (24-page PDF) | [../product/](../product/) |
| Single-file clickable prototype (HTML) | Ported into `packages/brainy`, `packages/games`, `packages/core` and `apps/web` |
| `ROUTES.md` + `brainy-mvp.zip` (routes, roles, rules, clickable prototype) | [routes-spec.md](../product/routes-spec.md) |
| 30-game handoff (catalog, pinned sources and launcher) | [external-games.md](../product/external-games.md) |

To consult an original, read it from history outside the working tree, for example `git show b1a3c68:docs/ideas/ROUTES.md`. Code comments that cite "ROUTES.md §…" refer to that file.

| Current frozen source | How to use |
|---|---|
| `Brainy-Funnel-Export.zip` | The 25-screen US parent funnel and lavender visual system. Analysis: [funnel.md](../product/funnel.md); ordered work: [redesign.md](../plans/redesign.md). Unzip outside the repository. |
| `claude-design/*.dc.html` | The lavender app, Brain component and stopping patterns. Read the source using the line map in [design.md](../product/design.md); never load its Google Fonts links. Placeholder copy is reference only; product copy is English. |
| `111.png`, `222.png`, `333.png` | English reference screenshots of onboarding flows. |
| `brain-check-funnel-mockup.html` | Offline clickable mockup of the Brain Check sales funnel that replaces `/start` (T-149). Open it in a browser; `?screen=<id>` jumps to a screen and the «Заметки» button shows the designer's notes (reference only, never ship them). Where the task spec and the mockup disagree, the spec wins: [funnel.md](../product/funnel.md). |
