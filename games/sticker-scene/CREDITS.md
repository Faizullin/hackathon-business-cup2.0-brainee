# Credits

| What | Where | Author | License |
| --- | --- | --- | --- |
| The 36 sticker pictures | `assets-src/fluent-emoji/` ([Fluent Emoji](https://github.com/microsoft/fluentui-emoji), "Color" style), rendered to `assets/stickers/` with a white border by `assets-src/render_assets.mjs` | Microsoft Corporation | MIT (`assets-src/fluent-emoji/LICENSE`) |
| The three scene backgrounds | `assets-src/backgrounds/`, rendered to `assets/scenes/` | this project | CC0 1.0 |
| Confetti for a right answer | [`canvas-confetti`](https://github.com/catdad/canvas-confetti) (bundled), with the PECS web app's settings | Kiril Vatev | ISC |

The MIT license asks that its notice stay with copies of the pictures; it is
kept in `assets-src/fluent-emoji/LICENSE` and shipped with the build as
`assets/stickers/LICENSE`.

## Brainee adaptation (Sticker Scene, `sticker-scene`)

- **Source:** our earlier project's `packages/phaser-sticker-scene-game` (GSP, `pecs-game-store-master.zip`, SHA-256 `09d83c7a807b69e3fa2e037237068e791e1e313adb1477023eb766727160dc35`). Pictures, scenes and licence notices under `assets/` are copied byte-for-byte; the TypeScript source is ported.
- **Shared kit:** GSP `phaser-core` helpers now live in `packages/engine-phaser` (imported as `@brainee/engine-phaser/<module>`); the bridge is `@brainee/game-bridge`.
- **Explore preview:** unscored. No `GameResult`, learning session, wallet or skill writes, and no host progress storage; the game keeps only its own menu preferences in `localStorage`.
- **English only (D-34):** the Russian and Kazakh dictionaries and the language picker are removed; every locale resolves to English.
- **Own origin:** no fonts, images or scripts load from outside `/games/sticker-scene/`.
