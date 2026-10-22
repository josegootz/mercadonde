'use client';

export type AlertSoundType = 'arriving_today' | 'nearby' | 'delivered';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {
      // Ignore if user gesture hasn't occurred yet
    });
  }
  return sharedAudioCtx;
}

/**
 * Plays a subtle harmonic chime synthesized with Web Audio API.
 */
export function playShipmentAlertSound(
  type: AlertSoundType,
  volume = 0.75
): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    const safeVolume = Math.max(0.05, Math.min(1, volume)) * 0.25;
    const now = ctx.currentTime;

    const sequences: Record<
      AlertSoundType,
      { freq: number; start: number; duration: number; wave: OscillatorType }[]
    > = {
      // Subtle 2-note chime for "En camino a tu domicilio"
      arriving_today: [
        { freq: 523.25, start: 0, duration: 0.18, wave: 'sine' }, // C5
        { freq: 783.99, start: 0.14, duration: 0.32, wave: 'sine' }, // G5
      ],
      // Expressive 3-note pulse for "Próximo a llegar"
      nearby: [
        { freq: 659.25, start: 0, duration: 0.14, wave: 'triangle' }, // E5
        { freq: 830.61, start: 0.12, duration: 0.14, wave: 'triangle' }, // G#5
        { freq: 987.77, start: 0.24, duration: 0.36, wave: 'sine' }, // B5
      ],
      // Warm chord sequence for "Entregado"
      delivered: [
        { freq: 523.25, start: 0, duration: 0.12, wave: 'sine' }, // C5
        { freq: 659.25, start: 0.1, duration: 0.12, wave: 'sine' }, // E5
        { freq: 783.99, start: 0.2, duration: 0.14, wave: 'sine' }, // G5
        { freq: 1046.5, start: 0.32, duration: 0.42, wave: 'sine' }, // C6
      ],
    };

    const notes = sequences[type] || sequences.arriving_today;

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.wave;
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(safeVolume, now + note.start + 0.025);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + note.start + note.duration
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}
