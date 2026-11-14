# Interactive films (podcast → «мультик»)

A film is **an mp3 plus a JSON script**. The browser draws it, so no video is rendered. Brainy talks with the voice, scenes change with the story, and questions pause the audio until the child answers. Films are science videos: free, and the only ★ reward is the existing end-of-video quiz (+15★, eyes +2, first time only). In-film questions never grant ★. Decision: [D-33](decisions.md).

## Where things live

| What | Where |
|---|---|
| Script format, `checkFilm` rules, timeline lookups | `packages/core/src/film.ts` (pure, tested) |
| Backgrounds `FILM_BG`, props `FILM_PROPS`, `FilmStage`, layout check, `FILM_IDS` registry | `packages/films/src/` |
| Media (own origin) | `apps/web/public/media/films/<id>.mp3` + `<id>.json` |
| Catalog card + final ★ quiz | `science` in `packages/db/src/showcase-seed.ts` (same `id`) |
| Child player | `/video/<id>` → `FilmPlayer` in `apps/web/src/app/(game)/video/[id]/VideoPlayer.tsx`, `components/film/FilmView.tsx` |
| Studio (seek, jump to questions, try local mp3 + JSON) | `/lab/film` (dev only) |
| Transcription → draft | `scripts/films/make_film.py` |
| Checker (replaces `check_film.py`) | `pnpm check:films` (Vitest in `packages/films`) |

## Script format

```jsonc
{
  "id": "sky-blue",              // latin, digits, dashes
  "title": "Why the sky is blue?",
  "lang": "en",                  // ru | kk | en: language of the audio; q/options/hint/praise match it
  "skill": "attention",          // attention | reading | logic | memory | speech
  "duration": 753.52,            // seconds, from the mp3
  "audio": "/media/films/sky-blue.mp3",
  "scenes":    [{ "t": 0, "bg": "yard", "props": ["sun", "cloud"], "brainy": "left" }],
  "questions": [{ "t": 10.7, "q": "…", "options": ["…", "…", "…"], "answer": 2,
                  "hint": "…", "praise": "…", "replayFrom": 6.96 }],
  "captions":  [{ "t": 0.14, "end": 1.6, "text": "Hi there, hi there!", "who": "brainy" }]
}
```

`who` is optional (`brainy` | `guest`). Brainy's mouth moves only on `brainy` captions, driven by the real voice level (Web Audio). It falls back to caption timing when Web Audio is unavailable.

## Workflow for a new podcast

0. **Input.** Put the mp3 in `videos/audio/` (untracked; don't edit the source). Pick an `id` by meaning (`ocean`, `bees-life`). Listen to or skim the start: **the language decides the script language**, which isn't always Russian.
1. **Transcribe → draft.**
   - With `ELEVENLABS_API_KEY` in the environment: `--engine elevenlabs --lang rus|kaz|eng`, plus `--diarize` for two voices. Never write the key to a file or print it.
   - Otherwise, use local Whisper through uv, with no system install:
     `uv run --no-project --python 3.12 --with faster-whisper python -I scripts/films/make_film.py videos/audio/<file>.mp3 --id <id> --title "<title>" --engine whisper --model small`
     Language is auto-detected; force it with `--lang ru`. On CPU-only Macs, `small` transcribes 12 min in about 3 min. Audio is decoded by system `ffmpeg` because faster-whisper's PyAV path breaks on new PyAV releases. Caption times come from word timestamps; segment-level times drifted by ~1 s on a 12-minute podcast.
   - Output: `apps/web/public/media/films/<id>.{mp3,json}` with captions, question stubs from phrases ending in "?", and one scene. The script refuses to overwrite a JSON without `--force`. The served mp3 is always re-encoded to speech quality (64 kbps mono, 44.1 kHz, no tags): about 6 MB per 12 minutes.
2. **Keep an untouched copy of the draft** and author from it. Placing questions shortens caption `end` values, so re-running an authoring pass on an edited file moves pauses.
3. **Fix captions.** Read all of them and fix only the text (punctuation, quotes, names, misheard words). Don't move `t`/`end` without a reason.
4. **Questions.**
   - Find the real questions, including rhetorical ones the host answers immediately, and any closing «мини-квиз».
   - Set `t` inside the silence right after the question: the speech end + 0.3 s. Whisper's `end` often includes trailing silence or runs into the answer, so measure: `LC_ALL=C ffmpeg -i <mp3> -af silencedetect=noise=-35dB:d=0.25 -f null -`. Then set that caption's `end` to the silence start. That is a measured fix, not an invented timestamp.
   - When the host answers right away, the pause still comes before the answer, so the child answers and then hears the confirmation.
   - `q` ≤ 60 chars and clear to a 5–7-year-old. Exactly 3 `options` ≤ 25 chars: one correct **from the audio**, two plausible wrong ones of similar length and form. No negations and no "all of the above". Shuffle `answer` (0–2).
   - `hint` nudges without giving the answer away. `praise` is short and states the fact.
   - `replayFrom` is the `t` of the caption where the fact was told. It must be **before** `t`: «Послушать ещё раз» replays it, then the question appears again.
   - Aim for 2–4 questions per 5 minutes. If the audio has none, add 2 on key facts, in pauses between phrases.
5. **Scenes.**
   - First scene at `t: 0`. Change scenes at the start of a phrase (that caption's `t`), every 8–15 s or on a topic change.
   - 2–4 props each, using only keys from `FILM_BG`/`FILM_PROPS`.
   - `brainy`: `left` while explaining, `center` before a question and at the finale, `right` for variety.
   - 2–6 s (ideally 3–4) before each question, add a scene with the `question` prop and `brainy: "center"`.
   - Need new art? Add it to `packages/films/src/art.tsx` in the same format:
     - flat inline SVG with no images, links or fonts;
     - palette `#EE5A4A #F2AE12 #E5731A #139E80 #3C68EE #FF8FA3` plus tints/ink;
     - `cls` from `FILM_MOTIONS` (`swim bob sway fly buzz spin drift rise twinkle pop`);
     - `style: at(left, top, width)` in % of the stage;
     - **things that stand** (house, tree, bed, puddle, jar…) get `base`: the viewBox y where they touch the ground. The stage then puts them on the background's `ground` line instead of `style.top`, and turns floating motions into `still` while they stand. Use `still`, `sway` (from the root), `buzz`, `drift` or `spin` for them. Add `floats: true` only when the thing may also fly where there is no ground (rocket, beach ball in space);
     - a new background with a floor, grass or table needs `ground` (% of stage height); sky, space, the sunbeam, a cloud and the sea have none;
     - no recognisable characters or brands.
   - Placement zones: top-left = sky things, top-centre = the question bubble and light/air diagrams, right = objects. Brainy stands bottom-left/centre/right at 24% width.
6. **Voices.** With `--diarize`, the first voice is `brainy` and the others are `guest`. Check that Brainy is the host who explains; if not, swap them. A second on-screen character needs engine work, so describe it in the handoff instead.
7. **Register and catalog.**
   - Add the `id` to `FILM_IDS` in `packages/films/src/catalog.ts`.
   - Add a `science` entry with the same `id` to the seed:
     - `title` (2–4 words for a child);
     - `minutes` = `ceil(duration / 60)`;
     - `icon` from `SCIENCE_ICONS` in `LeisureScreen.tsx`; add the lucide icon to `packages/ui` if needed;
     - `colors` (2 hex values);
     - the final ★ `question` / `options` / `answer`, taken from the audio's main idea.
   - Run `pnpm db:reset` (or a scratch `DATABASE_URL`) to see it.
8. **Check.**
   - Run `pnpm format` first: Biome formats the script JSON, and `pnpm check` fails without it.
   - `pnpm check:films` must pass. It covers:
     - script rules;
     - standing things on a background without ground (a hard error: they would hang in the air);
     - prop overlap with each other and with Brainy, measured where the props are really drawn;
     - `FILM_IDS` matching the files on disk;
     - mp3 ≤ 15 MB, with a duration that matches `ffprobe`;
     - a matching seed entry and minutes;
     - every scene rendering;
     - self-contained art.
   - Fix every warning or explain it in the handoff.
   - Then `/lab/film` (seek through every scene) and `pnpm e2e` (`e2e/film.spec.ts` is the child flow; `own-origin.spec.ts` lists `/video/<id>`).
   - Child route: `/leisure` → card → `/video/<id>`.

## Don'ts
- No economy changes: in-film questions are free practice, and only the final quiz pays.
- No external CDN, YouTube, images or fonts inside a film (iOS allowlist, [rules.md](../product/rules.md#technical-requirements)).
- No facts that aren't in the audio.
- Don't commit source audio at its original bitrate, and don't commit `videos/` (raw sources are gitignored).

## Tools, keys and provenance
- **Dev-time only.** `make_film.py`, uv, faster-whisper, ffmpeg and ElevenLabs Scribe are used only to author a film. `pnpm build`, `pnpm check:films` and the runtime need none of them; the app serves the committed mp3 + JSON from `public/media/films`.
- **Key.** `make_film.py` reads `ELEVENLABS_API_KEY` from the environment only. Never write it to a file, commit it or print it.
- **Raw sources** live in `videos/` (gitignored). Commit only the encoded film mp3 and its JSON.
- **Audio provenance:** the three current films (`sky-blue`, `rain`, `sun-goes`) are English podcasts generated with ElevenLabs. *Owner to record:* the ElevenLabs voice used and the plan/terms that allow commercial use in a children's product. Update this line when confirmed.
- **Language:** the product is English-only, so captions, in-film questions and the end quiz are English. Future podcasts should be English too.
- **Content review (2026-11-15):** all three scripts were checked against kid-level science (Rayleigh scattering, sunsets and the black sky in space; evaporation, condensation and coalescence; Earth's rotation and day/night). The simplifications are deliberate ("light bounces", "the sun lifts water"); no medical claims; every home experiment is "with a grown-up".

## Narrator: a replaceable mascot
The film never names its host. `FilmStage` has a **narrator slot**: the player passes a `FilmNarrator`, a function that gets `{ talk, voice, spot }` each frame and returns any SVG/React mascot. The mascot fills a box 24% of the stage wide with Brainy's 264×300 aspect, 2% above the bottom (`NARRATOR_BOX`). The layout check measures overlaps against that box, so swapping the mascot doesn't change how scenes are staged.

- In the child app, `/video/<id>` passes `brainyNarrator(stats, equipped)` (`apps/web/src/components/film/narrators.tsx`), so **the child's own Brainy leads the lecture**: its look comes from their saved stats, and it wears the accessories they bought and equipped.
- Another mascot (a guest character, a seasonal costume, a partner character) is just another `FilmNarrator`. Scripts, art and checks stay unchanged.
- `/lab/film` has a «Маскот» selector (Brainy looks, Brainy with accessories, none) to preview the swap.
- `packages/films` does not depend on `@brainee/brainy`.

The script fields `brainy` (spot) and `who: "brainy"` keep their names for compatibility; they mean "the narrator".

## Player behaviour (child)
- Only «Пауза / Смотреть». The progress bar isn't tappable, and nothing autoplays after the end.
- A question pauses the audio, and Brainy stands centre-stage. A wrong answer dims that option and shows `hint` + «Послушать ещё раз». The right answer shows `praise`, then the film continues after 1.8 s or on «Дальше».
- Position is saved in whole minutes: every 10 s while the minute changes, and on «Закрыть и досмотреть позже». The film resumes from that minute; questions before it count as answered.
- The end of the audio opens the existing final quiz.
- Player chrome follows the app locale (`useI18n`, `child.video.film` in `ru.ts`/`en.ts`). Film content uses the script's `lang` and is marked with `lang=` for screen readers.

## Known limits
- One character on stage. A `guest` voice only stops Brainy's mouth.
- The mouth uses `createMediaElementSource`, so audio routes through Web Audio. It's created on the first tap, which iOS requires. The physical iPad check stays with T-62/T-84.
- Horizontal positions are fixed per prop; standing props get their height from the background's ground line. The layout check flags crowded combinations rather than auto-placing them.
