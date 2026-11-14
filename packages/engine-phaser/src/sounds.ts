/**
 * Web Audio synthesized feedback tones for picture puzzle:
 * - Snap: bright, crisp dual-tone click/chime
 * - Return: soft gentle low boop (never an alarming buzzer)
 * - Victory: ascending major chime arpeggio
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx && "AudioContext" in window) {
    audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  endFreq?: number,
  gainLevel = 0.16,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
  }
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainLevel, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Crisp bright snap sound when a piece lands in place */
export function playSnapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 780, now, 0.08, undefined, 0.18);
  playTone(ctx, 1175, now + 0.04, 0.14, undefined, 0.14);
}

/** Soft gentle boop when a piece returns to tray */
export function playReturnSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 320, now, 0.22, 220, 0.12);
}

/** Triumphant ascending arpeggio on puzzle completion */
export function playVictorySound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    playTone(ctx, freq, now + idx * 0.1, 0.35, undefined, 0.18);
  });
}
