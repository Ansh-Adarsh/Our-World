/**
 * Journey sound — tiny synthesised cues, no audio files.
 *
 * Everything is generated with the Web Audio API, so nothing is downloaded and
 * the bundle does not grow. Sound is a garnish: every call is wrapped so an
 * unsupported or blocked AudioContext can never break a scene, and each cue only
 * fires from inside a user gesture (a tap), which is what browsers require.
 *
 * Callers pass `enabled` from a visible mute control — nothing plays unasked.
 */

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (context) return context;
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    context = new AudioCtx();
    return context;
  } catch {
    return null;
  }
}

/** One soft bell note. */
function note(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  // Quick swell, long gentle tail — a bell, not a beep.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** A single warm chime — one candle going out. */
export function playPuff(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    note(ctx, 392, ctx.currentTime, 0.5, 0.05);
  } catch {
    /* sound is optional */
  }
}

/** A rising three-note figure for the celebration. */
export function playCelebration(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const t = ctx.currentTime;
    // C5 – E5 – G5, quiet and spaced like a music box.
    note(ctx, 523.25, t, 1.5, 0.07);
    note(ctx, 659.25, t + 0.14, 1.5, 0.06);
    note(ctx, 783.99, t + 0.28, 1.9, 0.055);
  } catch {
    /* sound is optional */
  }
}

/** A short lift when a riddle is answered correctly. */
export function playUnlock(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const t = ctx.currentTime;
    note(ctx, 587.33, t, 0.6, 0.045);
    note(ctx, 880, t + 0.1, 0.8, 0.04);
  } catch {
    /* sound is optional */
  }
}
