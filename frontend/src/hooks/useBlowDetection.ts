/**
 * useBlowDetection — optional microphone "blow out the candles" gesture.
 *
 * Strictly opt-in. Nothing here runs until the user presses the button that
 * calls `start()`, no permission is requested on page load, and tapping the
 * candles always works whether the microphone is used, denied or unsupported.
 *
 * Audio never leaves the device: samples are read from an AnalyserNode, reduced
 * to a loudness number, and discarded. Nothing is recorded, stored or uploaded.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type BlowStatus = 'idle' | 'requesting' | 'listening' | 'denied' | 'unsupported';

/** Loudness a breath has to clear (0-1 RMS). Tuned for a phone held close. */
const RMS_THRESHOLD = 0.14;
/** Consecutive frames above threshold — stops a cough or a door from counting. */
const SUSTAIN_FRAMES = 4;

export function useBlowDetection(onBlow: () => void) {
  const [status, setStatus] = useState<BlowStatus>('idle');
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const sustainRef = useRef(0);
  const onBlowRef = useRef(onBlow);

  useEffect(() => {
    onBlowRef.current = onBlow;
  }, [onBlow]);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    contextRef.current?.close().catch(() => {});
    contextRef.current = null;

    sustainRef.current = 0;
    setLevel(0);
    setStatus((prev) => (prev === 'listening' || prev === 'requesting' ? 'idle' : prev));
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');

    try {
      // Turn off the processing that would flatten a breath into silence.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        stop();
        setStatus('unsupported');
        return;
      }

      const context = new AudioCtx();
      contextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);

      const samples = new Float32Array(analyser.fftSize);
      setStatus('listening');

      const tick = () => {
        analyser.getFloatTimeDomainData(samples);

        let sumSquares = 0;
        for (let i = 0; i < samples.length; i += 1) sumSquares += samples[i] * samples[i];
        const rms = Math.sqrt(sumSquares / samples.length);

        setLevel(Math.min(1, rms / RMS_THRESHOLD));

        if (rms > RMS_THRESHOLD) {
          sustainRef.current += 1;
          if (sustainRef.current >= SUSTAIN_FRAMES) {
            onBlowRef.current();
            stop();
            return;
          }
        } else {
          sustainRef.current = 0;
        }

        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      // Denied, dismissed, or no input device — all land here, all non-fatal.
      console.info('[Blow] Microphone unavailable, tap still works:', err);
      stop();
      setStatus('denied');
    }
  }, [stop]);

  // Always release the microphone when the scene unmounts.
  useEffect(() => stop, [stop]);

  return { status, level, start, stop };
}
