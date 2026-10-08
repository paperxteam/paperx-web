#!/usr/bin/env python3
import sys

def main():
    css_keyframes = """
  /* ━━━━━━━━━ Professional High-Contrast Inside-Only Micro-Animations ━━━━━━━━━ */
  /* NO jumping of outer icon containers! Pure internal animations matching tool function. */

  /* Converters: Directional conversion arrow glides from source to target inside */
  @keyframes pro-convert-arrow {
    0%, 100% { transform: translateX(0); opacity: 0.95; }
    50% { transform: translateX(3px); opacity: 1; }
  }
  .pro-anim-convert-arrow {
    transform-box: fill-box;
    animation: pro-convert-arrow 1.8s infinite ease-in-out;
  }

  /* Merge: Internal document sheets glide smoothly inward */
  @keyframes pro-merge-left {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2px); }
  }
  .pro-anim-merge-left {
    transform-box: fill-box;
    animation: pro-merge-left 2s infinite ease-in-out;
  }
  @keyframes pro-merge-right {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-2px); }
  }
  .pro-anim-merge-right {
    transform-box: fill-box;
    animation: pro-merge-right 2s infinite ease-in-out;
  }
  @keyframes pro-merge-arrow {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50% { transform: scale(1.15); opacity: 1; }
  }
  .pro-anim-merge-arrow {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-merge-arrow 2s infinite ease-in-out;
  }

  /* Split: Internal halves gently part with central cut line */
  @keyframes pro-split-left {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-1.8px); }
  }
  .pro-anim-split-left {
    transform-box: fill-box;
    animation: pro-split-left 2s infinite ease-in-out;
  }
  @keyframes pro-split-right {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(1.8px); }
  }
  .pro-anim-split-right {
    transform-box: fill-box;
    animation: pro-split-right 2s infinite ease-in-out;
  }
  @keyframes pro-split-cut {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; stroke-width: 2.2; }
  }
  .pro-anim-split-cut {
    animation: pro-split-cut 2s infinite ease-in-out;
  }

  /* Compress: Inward corner arrows squeeze toward center */
  @keyframes pro-compress-arrows {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.82); }
  }
  .pro-anim-compress-arrows {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-compress-arrows 2s infinite ease-in-out;
  }

  /* Repair: Mechanic wrench gently rocks back and forth across document */
  @keyframes pro-wrench-rock {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-12deg); }
    75% { transform: rotate(12deg); }
  }
  .pro-anim-wrench-rock {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-wrench-rock 2.2s infinite ease-in-out;
  }

  /* OCR / Scanner: Luminous laser beam sweeps down and up */
  @keyframes pro-scan-beam {
    0%, 100% { transform: translateY(0); opacity: 0.7; }
    50% { transform: translateY(20px); opacity: 1; }
  }
  .pro-anim-scan-beam {
    transform-box: fill-box;
    animation: pro-scan-beam 2.2s infinite ease-in-out;
  }

  /* Image to Text: Vertical scan divider bar sweeps across photo */
  @keyframes pro-sweep-horiz {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(18px); }
  }
  .pro-anim-sweep-horiz {
    transform-box: fill-box;
    animation: pro-sweep-horiz 2.4s infinite ease-in-out;
  }

  /* Flatten: Layer sheets gently press down into single base sheet */
  @keyframes pro-flatten-press {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3.5px); }
  }
  .pro-anim-flatten-press {
    transform-box: fill-box;
    animation: pro-flatten-press 2s infinite ease-in-out;
  }

  /* Organize / Shuffle: Inner page cards glide smoothly */
  @keyframes pro-shuffle-left {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }
  .pro-anim-shuffle-left {
    transform-box: fill-box;
    animation: pro-shuffle-left 2.2s infinite ease-in-out;
  }
  @keyframes pro-shuffle-right {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-3px); }
  }
  .pro-anim-shuffle-right {
    transform-box: fill-box;
    animation: pro-shuffle-right 2.2s infinite ease-in-out;
  }

  /* Extract: Highlighted sheet lifts up out of the stack */
  @keyframes pro-extract-lift {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .pro-anim-extract-lift {
    transform-box: fill-box;
    animation: pro-extract-lift 2s infinite ease-in-out;
  }

  /* Remove Pages: Minus card dims down and returns */
  @keyframes pro-remove-fade {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.9); }
  }
  .pro-anim-remove-fade {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-remove-fade 2s infinite ease-in-out;
  }

  /* Replace Pages / Cycle: Circular cycle arrow smoothly spins */
  @keyframes pro-cycle-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .pro-anim-cycle-spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-cycle-spin 3.5s infinite linear;
  }

  /* Insert Pages: Green sheet slides down into stack */
  @keyframes pro-insert-slide {
    0%, 100% { transform: translateY(-3.5px); opacity: 0.5; }
    50% { transform: translateY(0); opacity: 1; }
  }
  .pro-anim-insert-slide {
    transform-box: fill-box;
    animation: pro-insert-slide 2s infinite ease-in-out;
  }

  /* Duplicate Pages: Twin sheet peeks out */
  @keyframes pro-dup-peek {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, -2.5px); }
  }
  .pro-anim-dup-peek {
    transform-box: fill-box;
    animation: pro-dup-peek 2s infinite ease-in-out;
  }

  /* N-Up PDF: 4 page quadrants pulse in sequence */
  @keyframes pro-nup-pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 1; }
  }
  .pro-anim-nup-1 { animation: pro-nup-pulse 2s infinite ease-in-out; animation-delay: 0s; }
  .pro-anim-nup-2 { animation: pro-nup-pulse 2s infinite ease-in-out; animation-delay: 0.5s; }
  .pro-anim-nup-3 { animation: pro-nup-pulse 2s infinite ease-in-out; animation-delay: 1s; }
  .pro-anim-nup-4 { animation: pro-nup-pulse 2s infinite ease-in-out; animation-delay: 1.5s; }

  /* Protect PDF: Shackle clicks down firmly into lock body */
  @keyframes pro-lock-shackle {
    0%, 100% { transform: translateY(-2.5px); }
    50% { transform: translateY(0); }
  }
  .pro-anim-lock-shackle {
    transform-box: fill-box;
    animation: pro-lock-shackle 2s infinite ease-in-out;
  }

  /* Unlock PDF: Shackle pivots open */
  @keyframes pro-unlock-shackle {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-3px) rotate(-15deg); }
  }
  .pro-anim-unlock-shackle {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: pro-unlock-shackle 2s infinite ease-in-out;
  }

  /* Sign PDF: Pen tip glides smoothly along cursive signature */
  @keyframes pro-pen-draw {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(3px, -2px) rotate(6deg); }
    66% { transform: translate(-2px, 1px) rotate(-4deg); }
  }
  .pro-anim-pen-draw {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: pro-pen-draw 2.5s infinite ease-in-out;
  }

  /* Redact PDF: Confidential redaction censor bar expands across text */
  @keyframes pro-redact-censor {
    0%, 100% { transform: scaleX(0.7); opacity: 0.85; }
    50% { transform: scaleX(1.05); opacity: 1; }
  }
  .pro-anim-redact-censor {
    transform-box: fill-box;
    transform-origin: left;
    animation: pro-redact-censor 2s infinite ease-in-out;
  }

  /* Compare PDF: Vertical divider bar scans between left & right pages */
  @keyframes pro-compare-divider {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(6px); }
  }
  .pro-anim-compare-divider {
    transform-box: fill-box;
    animation: pro-compare-divider 2.2s infinite ease-in-out;
  }

  /* Summarize / AI: Stars twinkle with rotation and scale */
  @keyframes pro-ai-twinkle {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.85; }
    50% { transform: scale(1.25) rotate(15deg); opacity: 1; }
  }
  .pro-anim-ai-twinkle {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-ai-twinkle 2s infinite ease-in-out;
  }

  /* PDF QA: Speech bubble breathes */
  @keyframes pro-chat-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
  .pro-anim-chat-breathe {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-chat-breathe 2s infinite ease-in-out;
  }

  /* Translate PDF: Swap arrows glide between languages */
  @keyframes pro-trans-swap {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2.5px); }
  }
  .pro-anim-trans-swap {
    transform-box: fill-box;
    animation: pro-trans-swap 2s infinite ease-in-out;
  }

  /* Edit PDF: Pencil glides along text */
  @keyframes pro-pencil-write {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(2.5px, -1.8px); }
  }
  .pro-anim-pencil-write {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: pro-pencil-write 2s infinite ease-in-out;
  }

  /* Add Image: Photo frame gently floats into document */
  @keyframes pro-photo-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .pro-anim-photo-float {
    transform-box: fill-box;
    animation: pro-photo-float 2s infinite ease-in-out;
  }

  /* Find & Replace: Magnifying glass sweeps across line */
  @keyframes pro-magnify-sweep {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(3px, 1.5px); }
  }
  .pro-anim-magnify-sweep {
    transform-box: fill-box;
    animation: pro-magnify-sweep 2s infinite ease-in-out;
  }

  /* Rotate PDF & Pages: Circular curved arrow smoothly spins */
  @keyframes pro-rotate-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .pro-anim-rotate-spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-rotate-spin 3s infinite linear;
  }

  /* Crop PDF: Corner brackets contract inward */
  @keyframes pro-crop-contract {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.92); }
  }
  .pro-anim-crop-contract {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-crop-contract 2s infinite ease-in-out;
  }

  /* Page Numbers: Number badge pulses with glow */
  @keyframes pro-num-badge {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50% { transform: scale(1.15); opacity: 1; }
  }
  .pro-anim-num-badge {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-num-badge 1.8s infinite ease-in-out;
  }

  /* Header & Footer: Accent bars pulse */
  @keyframes pro-hf-pulse {
    0%, 100% { opacity: 0.65; }
    50% { opacity: 1; }
  }
  .pro-anim-hf-pulse {
    animation: pro-hf-pulse 2s infinite ease-in-out;
  }

  /* Watermark: Stamp impression pulses */
  @keyframes pro-stamp-pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  .pro-anim-stamp-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-stamp-pulse 2s infinite ease-in-out;
  }

  /* Forms: Checkmark pop */
  @keyframes pro-check-pop {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.18); }
  }
  .pro-anim-check-pop {
    transform-box: fill-box;
    transform-origin: center;
    animation: pro-check-pop 2s infinite ease-in-out;
  }
"""
    print("CSS keyframes generated.")

if __name__ == '__main__':
    main()
