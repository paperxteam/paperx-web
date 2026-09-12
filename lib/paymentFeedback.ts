import confetti from 'canvas-confetti';

/**
 * Plays an ultra-luxury fintech approval chime using the native Web Audio API.
 * Uses warm harmonic overtones with subtle acoustic chime resonance (Apple Pay / Stripe standard).
 * Zero network requests, 0ms latency, fails silently if audio context is blocked.
 */
export function playPaymentApprovedAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Harmonic notes: C5 (523.25Hz), G5 (783.99Hz), C6 (1046.50Hz), E6 (1318.51Hz)
    const notes = [
      { freq: 523.25, time: 0.00, duration: 0.75, vol: 0.12 },
      { freq: 783.99, time: 0.08, duration: 0.75, vol: 0.13 },
      { freq: 1046.50, time: 0.16, duration: 0.90, vol: 0.15 },
      { freq: 1318.51, time: 0.24, duration: 1.10, vol: 0.11 }
    ];

    notes.forEach(({ freq, time, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sine wave with pure acoustic curve
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (_) {
    // Graceful fallback for environments blocking audio autoplay
  }
}

/**
 * Plays a polite, tactile decline notification tone using Web Audio API.
 * Warm, non-punishing acoustic dual-tone with soft damping.
 */
export function playPaymentRejectedAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Soft muted descending tones (F4 -> D4) with subtle sine warmth
    const tones = [
      { freq: 349.23, time: 0.00, duration: 0.24, vol: 0.09 },
      { freq: 293.66, time: 0.13, duration: 0.35, vol: 0.08 }
    ];

    tones.forEach(({ freq, time, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (_) {
    // Fail silently
  }
}

/**
 * Fires a celebratory confetti explosion across the screen with staggered velocity.
 */
export function triggerPaymentApprovedConfetti() {
  try {
    // Center luxury fountain burst
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.48 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#FBBF24', '#38BDF8'],
      zIndex: 999999,
      disableForReducedMotion: true
    });

    // Dual lateral celebratory streams
    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#10B981', '#34D399', '#F59E0B', '#FBBF24'],
        zIndex: 999999
      });
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#10B981', '#34D399', '#F59E0B', '#FBBF24'],
        zIndex: 999999
      });
    }, 220);
  } catch (_) {
    // Graceful fallback
  }
}
