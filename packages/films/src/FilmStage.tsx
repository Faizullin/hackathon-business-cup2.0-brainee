import { Brainy } from "@brainee/brainy";
import type { BrainyStats, Equipped, FilmCaption, FilmScene, FilmSpot } from "@brainee/core";
import { FILM_BG, FILM_PROPS } from "./art";
import { FILM_CSS } from "./motion";

type FilmStageProps = {
  scene: FilmScene;
  caption?: FilmCaption;
  /** 0–1 mouth opening, from the audio level while Brainy speaks. */
  talk?: number;
  /** Props and Brainy animate only while the film plays. */
  playing?: boolean;
  stats: BrainyStats;
  equipped?: Equipped;
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
  stats,
  equipped,
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
        if (!prop) return null;
        return (
          <div
            key={`${scene.t}-${key}`}
            className="film-enter"
            data-prop={key}
            style={{ position: "absolute", ...prop.style }}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className={`film-loop film-${prop.cls}`}>
              {prop.svg}
            </svg>
          </div>
        );
      })}
      <div
        data-brainy-spot={scene.brainy}
        style={{
          position: "absolute",
          bottom: "2%",
          left: SPOT[scene.brainy],
          width: "24%",
          transition: "left 700ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div className="film-loop film-talker">
          <Brainy stats={stats} equipped={equipped} talk={talk} label="" />
        </div>
      </div>
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
