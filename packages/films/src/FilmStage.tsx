import type { FilmCaption, FilmScene, FilmSpot } from "@brainee/core";
import { FILM_BG, FILM_PROPS } from "./art";
import { placeProp } from "./layout";
import { FILM_CSS, GROUND_MOTIONS } from "./motion";
import { type FilmNarrator, NARRATOR_BOX } from "./narrator";

type FilmStageProps = {
  scene: FilmScene;
  caption?: FilmCaption;
  /** 0–1 mouth opening, from the audio level while the narrator speaks. */
  talk?: number;
  /** Props and the narrator animate only while the film plays. */
  playing?: boolean;
  /** Who leads the film: the child's own Brainy in the app, anything else elsewhere. */
  narrator?: FilmNarrator;
  showCaptions?: boolean;
  className?: string;
};

const SPOT: Record<FilmSpot, string> = { left: "4%", center: "38%", right: "72%" };

/** Draws one moment of a film. Timing, audio and questions belong to the player. */
export function FilmStage({
  scene,
  caption,
  talk = 0,
  playing = false,
  narrator,
  showCaptions = true,
  className,
}: FilmStageProps) {
  const bg = FILM_BG[scene.bg];
  return (
    <div
      className={className}
      data-film-stage=""
      data-bg={scene.bg}
      data-playing={playing ? "" : undefined}
      style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 9" }}
    >
      <style href="brainee-film" precedence="default">
        {FILM_CSS}
      </style>
      {bg && (
        <svg
          key={scene.bg}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="film-bg"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {bg.svg}
        </svg>
      )}
      {scene.props.map((key) => {
        const prop = FILM_PROPS[key];
        const box = placeProp(key, scene.bg);
        if (!prop || !box) return null;
        const standing = prop.base !== undefined && bg?.ground !== undefined;
        const cls = standing && !GROUND_MOTIONS.includes(prop.cls) ? "still" : prop.cls;
        return (
          <div
            key={`${scene.t}-${key}`}
            className="film-enter"
            data-prop={key}
            data-grounded={standing ? "" : undefined}
            style={{
              position: "absolute",
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
            }}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className={`film-loop film-${cls}`}>
              {prop.svg}
            </svg>
          </div>
        );
      })}
      {narrator && (
        <div
          data-brainy-spot={scene.brainy}
          data-narrator=""
          style={{
            position: "absolute",
            bottom: `${NARRATOR_BOX.bottom}%`,
            left: SPOT[scene.brainy],
            width: `${NARRATOR_BOX.width}%`,
            aspectRatio: `${NARRATOR_BOX.aspect}`,
            transition: "left 700ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div className="film-loop film-talker" style={{ width: "100%", height: "100%" }}>
            {narrator({
              talk,
              voice: caption?.who ?? (caption ? "brainy" : undefined),
              spot: scene.brainy,
            })}
          </div>
        </div>
      )}
      {showCaptions && caption && (
        <p
          className="film-caption"
          data-who={caption.who ?? "brainy"}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "3%",
            transform: "translateX(-50%)",
            maxWidth: "70%",
            margin: 0,
          }}
        >
          {caption.text}
        </p>
      )}
    </div>
  );
}
