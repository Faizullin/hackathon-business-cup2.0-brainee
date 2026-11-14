// Ported from game-store-planning; local adaptations are documented in docs/reports/README.md.
/**
 * Turns a raw screen recording (Playwright's WebM, a simulator's or a
 * device's MP4) into what reports commit: an H.264 MP4 that plays everywhere
 * and a JPEG poster frame.
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

export function hasFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Writes `<outBase>.mp4` and `<outBase>.jpg`. `posterAt` is the poster's time
 * in seconds (a moment into the flow, past the first blank frames).
 */
export function transcodeVideo(input, outBase, { posterAt = 1 } = {}) {
  if (!existsSync(input)) throw new Error(`No recording at ${input}`);
  if (!hasFfmpeg()) throw new Error("ffmpeg is needed for videos: brew install ffmpeg");
  const video = `${outBase}.mp4`;
  const poster = `${outBase}.jpg`;
  // Even dimensions for yuv420p; faststart so browsers play before the download ends.
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      video,
    ],
    { stdio: "ignore" },
  );
  // A recording shorter than `posterAt` takes its first frame instead.
  for (const at of [posterAt, 0]) {
    try {
      execFileSync(
        "ffmpeg",
        ["-y", "-ss", String(at), "-i", video, "-frames:v", "1", "-q:v", "3", poster],
        {
          stdio: "ignore",
        },
      );
      if (existsSync(poster)) break;
    } catch {
      // Past the end: ffmpeg writes no frame; try the start.
    }
  }
  return {
    video,
    poster: existsSync(poster) ? poster : null,
    bytes: statSync(video).size,
  };
}
