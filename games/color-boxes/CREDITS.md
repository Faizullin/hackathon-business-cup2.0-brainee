# Credits

| What | Where | Author | License |
| --- | --- | --- | --- |
| The 48 pictures | `assets-src/fluent-emoji/` ([Fluent Emoji](https://github.com/microsoft/fluentui-emoji), "Color" style), rendered to `assets/items/` with a white border by `assets-src/render_assets.mjs` | Microsoft Corporation | MIT (`assets-src/fluent-emoji/LICENSE`) |
| The playroom background | `assets-src/backgrounds/playroom.svg`, rendered to `assets/scenes/` | this project | CC0 1.0 |
| The toy boxes and their patterns | drawn in code (`src/scenes/ColorSortScene.ts`) | this project | CC0 1.0 |
| Confetti for a right answer | [`canvas-confetti`](https://github.com/catdad/canvas-confetti) (bundled), with the PECS web app's settings | Kiril Vatev | ISC |

The MIT license asks that its notice stay with copies of the pictures; it is
kept in `assets-src/fluent-emoji/LICENSE` and shipped with the build as
`assets/items/LICENSE`.

Every picture passes `assets-src/check_colors.mjs`, which rejects pictures
that read as two colours. Left out after that check or by eye: teddy bear,
cookie, chipmunk, chocolate, owl, coconut (brown); bee, lion (yellow);
blueberries (drawn purple); frog (half yellow); cupcake (half blue); and the
red, orange, brown and yellow hearts (in between colours); the
orange book (red-orange).

## Brainee adaptation (Color Boxes, `color-boxes`)

- **Source:** our earlier project's `packages/phaser-color-sort-game` (GSP, `pecs-game-store-master.zip`, SHA-256 `09d83c7a807b69e3fa2e037237068e791e1e313adb1477023eb766727160dc35`). Pictures, scenes and licence notices under `assets/` are copied byte-for-byte; the TypeScript source is ported.
- **Shared kit:** GSP `phaser-core` helpers now live in `packages/engine-phaser` (imported as `@brainee/engine-phaser/<module>`); the bridge is `@brainee/game-bridge`.
- **Explore preview:** unscored. No `GameResult`, learning session, wallet or skill writes, and no host progress storage; the game keeps only its own menu preferences in `localStorage`.
- **English only (D-34):** the Russian and Kazakh dictionaries and the language picker are removed; every locale resolves to English.
- **Own origin:** no fonts, images or scripts load from outside `/games/color-boxes/`.
