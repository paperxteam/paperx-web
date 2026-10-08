#!/usr/bin/env python3
import os

def run():
    target_path = './components/AnimatedToolIcon.tsx'
    css = """
  /* ━━━━━━━━━ Professional High-Contrast Inside-Only Micro-Animations ━━━━━━━━━ */
  /* ZERO jumping or translation of the outer icon boundary! Pure internal animations matching tool function. */

  /* Converters: Directional conversion arrow glides from source to target inside */
  @keyframes pro-convert-arrow {
    0%, 100% { transform: translateX(0); opacity: 0.95; }
    50% { transform: translateX(2.5px); opacity: 1; }
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
    50% { opacity: 1; }
  }
  .pro-anim-split-cut {
    animation: pro-split-cut 2s infinite ease-in-out;
  }

  /* Compress: Inward corner arrows squeeze toward center */
  @keyframes pro-compress-arrows {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(0.84); }
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
    50% { transform: translateY(18px); opacity: 1; }
  }
  .pro-anim-scan-beam {
    transform-box: fill-box;
    animation: pro-scan-beam 2.2s infinite ease-in-out;
  }

  /* Image to Text: Vertical scan divider bar sweeps across photo */
  @keyframes pro-sweep-horiz {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(16px); }
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
    50% { transform: translate(2.5px, -2px); }
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
    33% { transform: translate(2.5px, -2px) rotate(5deg); }
    66% { transform: translate(-1.5px, 1px) rotate(-3deg); }
  }
  .pro-anim-pen-draw {
    transform-box: fill-box;
    transform-origin: bottom left;
    animation: pro-pen-draw 2.5s infinite ease-in-out;
  }

  /* Redact PDF: Confidential redaction censor bar expands across text */
  @keyframes pro-redact-censor {
    0%, 100% { transform: scaleX(0.75); opacity: 0.85; }
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
    50% { transform: translateX(5px); }
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
    50% { transform: translate(2px, -1.5px); }
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
    50% { transform: translate(2.5px, 1.5px); }
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

    format_specs = {
        'pdf': {'bg': '#DC2626', 'accent': '#991B1B', 'symbol': 'PDF', 'size': '8', 'weight': '900'},
        'word': {'bg': '#1D4ED8', 'accent': '#1E40AF', 'symbol': 'W', 'size': '10', 'weight': '900'},
        'excel': {'bg': '#15803D', 'accent': '#166534', 'symbol': 'X', 'size': '10', 'weight': '900'},
        'powerpoint': {'bg': '#EA580C', 'accent': '#C2410C', 'symbol': 'P', 'size': '10', 'weight': '900'},
        'jpg': {'bg': '#D97706', 'accent': '#B45309', 'symbol': 'JPG', 'size': '8', 'weight': '900'},
        'png': {'bg': '#7C3AED', 'accent': '#6D28D9', 'symbol': 'PNG', 'size': '8', 'weight': '900'},
        'csv': {'bg': '#0D9488', 'accent': '#0F766E', 'symbol': 'CSV', 'size': '8', 'weight': '900'},
        'txt': {'bg': '#475569', 'accent': '#334155', 'symbol': 'TXT', 'size': '8', 'weight': '900'},
        'markdown': {'bg': '#6D28D9', 'accent': '#4C1D95', 'symbol': 'MD', 'size': '8', 'weight': '900'},
        'html': {'bg': '#EA580C', 'accent': '#9A3412', 'symbol': 'HTML', 'size': '7', 'weight': '900'},
        'pdfa': {'bg': '#1E40AF', 'accent': '#172554', 'symbol': 'PDF/A', 'size': '7', 'weight': '900'},
    }

    converters_map = {
        'jpg-to-pdf': ('jpg', 'pdf'),
        'word-to-pdf': ('word', 'pdf'),
        'powerpoint-to-pdf': ('powerpoint', 'pdf'),
        'excel-to-pdf': ('excel', 'pdf'),
        'csv-to-pdf': ('csv', 'pdf'),
        'html-to-pdf': ('html', 'pdf'),
        'txt-to-pdf': ('txt', 'pdf'),
        'markdown-to-pdf': ('markdown', 'pdf'),
        'pdf-to-jpg': ('pdf', 'jpg'),
        'pdf-to-png': ('pdf', 'png'),
        'pdf-to-word': ('pdf', 'word'),
        'pdf-to-excel': ('pdf', 'excel'),
        'pdf-to-powerpoint': ('pdf', 'powerpoint'),
        'pdf-to-txt': ('pdf', 'txt'),
        'pdf-to-markdown': ('pdf', 'markdown'),
        'pdf-to-html': ('pdf', 'html'),
        'pdf-to-pdfa': ('pdf', 'pdfa'),
        'pdf-to-csv': ('pdf', 'csv'),
        'csv-to-xlsx': ('csv', 'excel'),
        'txt-to-docx': ('txt', 'word'),
        'markdown-to-docx': ('markdown', 'word'),
        'docx-to-txt': ('word', 'txt'),
        'docx-to-html': ('word', 'html'),
    }

    cases_code = []

    # Generate converter cases
    for tid, (src_key, tgt_key) in converters_map.items():
        src = format_specs[src_key]
        tgt = format_specs[tgt_key]
        code = f"""          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="{src['bg']}" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="{src['accent']}" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="{src['size']}" fontWeight="{src['weight']}" textAnchor="middle" fontFamily="system-ui, sans-serif">{src['symbol']}</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="{tgt['bg']}" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="{tgt['accent']}" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="{tgt['size']}" fontWeight="{tgt['weight']}" textAnchor="middle" fontFamily="system-ui, sans-serif">{tgt['symbol']}</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
"""
        cases_code.append(code)

    # Core Action tools
    # Merge tools
    merge_defs = [
        ('merge-pdf', '#DC2626', 'PDF'),
        ('merge-docx', '#1D4ED8', 'DOC'),
        ('merge-xlsx', '#15803D', 'XLS'),
        ('merge-pptx', '#EA580C', 'PPT'),
        ('merge-images', '#D97706', 'IMG'),
    ]
    for tid, bg, label in merge_defs:
        cases_code.append(f"""          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="{bg}" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="{bg}" fontSize="7" fontWeight="bold" textAnchor="middle">{label}</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="{bg}" fontSize="7" fontWeight="bold" textAnchor="middle">{label}</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Split tools
    split_defs = [
        ('split-pdf', '#DC2626', 'PDF'),
        ('split-docx', '#1D4ED8', 'DOC'),
        ('split-xlsx', '#15803D', 'XLS'),
        ('split-pptx', '#EA580C', 'PPT'),
    ]
    for tid, bg, label in split_defs:
        cases_code.append(f"""          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="{bg}" />
                <g className="pro-anim-split-left">
                  <path d="M12 11H23V39H12C10.9 39 10 38.1 10 37V13C10 11.9 10.9 11 12 11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="17" y="27" fill="{bg}" fontSize="8" fontWeight="bold" textAnchor="middle">{label[0]}</text>
                </g>
                <g className="pro-anim-split-right">
                  <path d="M27 11H38C39.1 11 40 11.9 40 13V37C40 38.1 39.1 39 38 39H27V11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="33" y="27" fill="{bg}" fontSize="8" fontWeight="bold" textAnchor="middle">{label[-1]}</text>
                </g>
                <line x1="25" y1="8" x2="25" y2="42" stroke="#FEF08A" strokeWidth="2.2" strokeDasharray="3 2" className="pro-anim-split-cut" />
                <circle cx="25" cy="25" r="4.5" fill="#0F172A" />
                <path d="M23 23L27 27M27 23L23 27" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            );
""")

    # Compress tools
    compress_defs = [
        ('compress-pdf', '#DC2626', 'PDF'),
        ('compress-image', '#D97706', 'IMG'),
    ]
    for tid, bg, label in compress_defs:
        cases_code.append(f"""          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="{bg}" />
                <rect x="14" y="12" width="22" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <text x="25" y="28" fill="{bg}" fontSize="9" fontWeight="900" textAnchor="middle">{label}</text>
                <g className="pro-anim-compress-arrows">
                  <path d="M8 8L14 14M14 9V14H9" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 8L36 14M36 9V14H41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 42L14 36M9 36H14V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 42L36 36M41 36H36V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Repair PDF
    cases_code.append("""          case 'repair-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#4338CA" />
                <rect x="12" y="9" width="26" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <path d="M21 16L27 22L23 27L29 33" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-wrench-rock">
                  <path d="M19 33L31 21M29 19C30 17 33 17 35 19C37 21 37 24 35 25L31 21Z" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="#E2E8F0" />
                </g>
              </svg>
            );
""")

    # OCR PDF & Scan PDF
    for tid, label in [('ocr-pdf', 'OCR'), ('scan-pdf', 'SCAN')]:
        cases_code.append(f"""          case '{tid}':
            return (
              <svg width={{s}} height={{s}} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0891B2" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="15" x2="34" y2="15" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="20" x2="34" y2="20" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="25" x2="28" y2="25" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="30" x2="34" y2="30" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="35" x2="26" y2="35" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-scan-beam">
                  <line x1="8" y1="14" x2="42" y2="14" stroke="#22D3EE" strokeWidth="2.6" strokeLinecap="round" />
                  <circle cx="25" cy="14" r="2.8" fill="#22D3EE" />
                </g>
              </svg>
            );
""")

    # Image to Text
    cases_code.append("""          case 'image-to-text':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#D97706" />
                <rect x="9" y="10" width="32" height="30" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <path d="M12 28L18 20L22 25L25 22L29 28Z" fill="#F59E0B" fillOpacity="0.6" />
                <circle cx="16" cy="16" r="2" fill="#D97706" />
                <line x1="26" y1="15" x2="37" y2="15" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="20" x2="37" y2="20" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="25" x2="34" y2="25" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-sweep-horiz">
                  <line x1="15" y1="9" x2="15" y2="41" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
            );
""")

    # Flatten PDF
    cases_code.append("""          case 'flatten-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#2563EB" />
                <g className="pro-anim-flatten-press">
                  <rect x="15" y="11" width="20" height="12" rx="2" fill="#FFFFFF" fillOpacity="0.45" />
                  <rect x="13" y="18" width="24" height="12" rx="2" fill="#FFFFFF" fillOpacity="0.75" />
                </g>
                <rect x="11" y="26" width="28" height="14" rx="2.5" fill="#FFFFFF" fillOpacity="0.98" />
                <path d="M25 7V17M21 13L25 17L29 13" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
""")

    # Organize PDF
    cases_code.append("""          case 'organize-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#7C3AED" />
                <g className="pro-anim-shuffle-left">
                  <rect x="9" y="12" width="16" height="24" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="17" y="27" fill="#7C3AED" fontSize="10" fontWeight="bold" textAnchor="middle">1</text>
                </g>
                <g className="pro-anim-shuffle-right">
                  <rect x="25" y="12" width="16" height="24" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33" y="27" fill="#7C3AED" fontSize="10" fontWeight="bold" textAnchor="middle">2</text>
                </g>
                <path d="M18 8H32M29 6L32 8L29 10M32 41H18M21 39L18 41L21 43" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            );
""")

    # Extract Pages
    cases_code.append("""          case 'extract-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#E11D48" />
                <rect x="11" y="17" width="28" height="24" rx="3" fill="#991B1B" fillOpacity="0.7" />
                <g className="pro-anim-extract-lift">
                  <rect x="13" y="10" width="24" height="25" rx="3" fill="#FFFFFF" fillOpacity="0.98" />
                  <path d="M25 15V26M21 19L25 15L29 19" stroke="#E11D48" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Remove Pages
    cases_code.append("""          case 'remove-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="16" x2="34" y2="16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="22" x2="34" y2="22" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-remove-fade">
                  <circle cx="25" cy="30" r="8.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.8" />
                  <line x1="20" y1="30" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
                </g>
              </svg>
            );
""")

    # Replace Pages
    cases_code.append("""          case 'replace-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#7C3AED" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <g className="pro-anim-cycle-spin">
                  <circle cx="25" cy="25" r="9" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeDasharray="14 10" />
                  <path d="M29 16L32 19L29 22M21 34L18 31L21 28" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Insert Pages
    cases_code.append("""          case 'insert-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#059669" />
                <rect x="10" y="16" width="13" height="22" rx="2" fill="#FFFFFF" fillOpacity="0.75" />
                <rect x="27" y="16" width="13" height="22" rx="2" fill="#FFFFFF" fillOpacity="0.75" />
                <g className="pro-anim-insert-slide">
                  <rect x="18" y="10" width="14" height="24" rx="2" fill="#FFFFFF" stroke="#059669" strokeWidth="1.5" />
                  <circle cx="25" cy="22" r="5" fill="#059669" />
                  <path d="M25 19V25M22 22H28" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </g>
              </svg>
            );
""")

    # Duplicate Pages
    cases_code.append("""          case 'duplicate-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#4338CA" />
                <g className="pro-anim-dup-peek">
                  <rect x="17" y="7" width="22" height="28" rx="3" fill="#FEF08A" stroke="#4338CA" strokeWidth="1.5" />
                </g>
                <rect x="11" y="13" width="22" height="28" rx="3" fill="#FFFFFF" fillOpacity="0.98" stroke="#4338CA" strokeWidth="1.5" />
                <text x="22" y="30" fill="#4338CA" fontSize="10" fontWeight="900" textAnchor="middle">2x</text>
              </svg>
            );
""")

    # N-Up PDF
    cases_code.append("""          case 'nup-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#1E40AF" />
                <rect x="10" y="10" width="13" height="13" rx="2.5" fill="#FFFFFF" className="pro-anim-nup-1" />
                <rect x="27" y="10" width="13" height="13" rx="2.5" fill="#FFFFFF" className="pro-anim-nup-2" />
                <rect x="10" y="27" width="13" height="13" rx="2.5" fill="#FFFFFF" className="pro-anim-nup-3" />
                <rect x="27" y="27" width="13" height="13" rx="2.5" fill="#FFFFFF" className="pro-anim-nup-4" />
                <text x="16.5" y="19" fill="#1E40AF" fontSize="7.5" fontWeight="bold" textAnchor="middle">1</text>
                <text x="33.5" y="19" fill="#1E40AF" fontSize="7.5" fontWeight="bold" textAnchor="middle">2</text>
                <text x="16.5" y="36" fill="#1E40AF" fontSize="7.5" fontWeight="bold" textAnchor="middle">3</text>
                <text x="33.5" y="36" fill="#1E40AF" fontSize="7.5" fontWeight="bold" textAnchor="middle">4</text>
              </svg>
            );
""")

    # Protect PDF
    cases_code.append("""          case 'protect-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#1E3A8A" />
                <g className="pro-anim-lock-shackle">
                  <path d="M19 19V14C19 10.7 21.7 8 25 8C28.3 8 31 10.7 31 14V19" fill="none" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
                </g>
                <rect x="15" y="18" width="20" height="18" rx="4" fill="#F59E0B" />
                <circle cx="25" cy="26" r="2.5" fill="#0F172A" />
                <path d="M25 27V31" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            );
""")

    # Unlock PDF
    cases_code.append("""          case 'unlock-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0D9488" />
                <g className="pro-anim-unlock-shackle">
                  <path d="M19 17V12C19 8.7 21.7 6 25 6C28.3 6 31 8.7 31 12" fill="none" stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />
                </g>
                <rect x="15" y="19" width="20" height="18" rx="4" fill="#F59E0B" />
                <circle cx="25" cy="27" r="2.5" fill="#0F172A" />
                <path d="M25 28V32" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            );
""")

    # Sign PDF
    cases_code.append("""          case 'sign-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#1D4ED8" />
                <rect x="10" y="8" width="30" height="34" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <path d="M15 31 C 18 26, 20 34, 23 29 C 26 25, 28 32, 33 28" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-pen-draw">
                  <path d="M29 12 L35 18 L26 27 L22 28 L23 24 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="1.2" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Redact PDF
    cases_code.append("""          case 'redact-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0F172A" />
                <rect x="10" y="8" width="30" height="34" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="15" y1="15" x2="35" y2="15" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-redact-censor">
                  <rect x="14" y="21" width="22" height="6" rx="1.5" fill="#000000" />
                </g>
                <line x1="15" y1="33" x2="28" y2="33" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            );
""")

    # Compare PDF
    cases_code.append("""          case 'compare-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="22" height="44" rx="10" fill="#2563EB" />
                <rect x="25" y="3" width="22" height="44" rx="10" fill="#DC2626" />
                <rect x="9" y="10" width="14" height="30" rx="2" fill="#FFFFFF" fillOpacity="0.9" />
                <rect x="27" y="10" width="14" height="30" rx="2" fill="#FFFFFF" fillOpacity="0.9" />
                <g className="pro-anim-compare-divider">
                  <line x1="22" y1="7" x2="22" y2="43" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="22" cy="25" r="3.5" fill="#FEF08A" stroke="#0F172A" strokeWidth="1" />
                </g>
              </svg>
            );
""")

    # Summarize PDF
    cases_code.append("""          case 'summarize-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#7C3AED" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <circle cx="16" cy="18" r="1.5" fill="#7C3AED" />
                <line x1="21" y1="18" x2="33" y2="18" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="16" cy="24" r="1.5" fill="#7C3AED" />
                <line x1="21" y1="24" x2="30" y2="24" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" />
                <g className="pro-anim-ai-twinkle">
                  <path d="M34 11L35.5 15L39.5 16.5L35.5 18L34 22L32.5 18L28.5 16.5L32.5 15Z" fill="#FBBF24" />
                  <path d="M14 31L15 33L17 34L15 35L14 37L13 35L11 34L13 33Z" fill="#FBBF24" />
                </g>
              </svg>
            );
""")

    # PDF QA
    cases_code.append("""          case 'pdf-qa':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#4F46E5" />
                <g className="pro-anim-chat-breathe">
                  <rect x="10" y="10" width="22" height="16" rx="4" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="21" y="22" fill="#4F46E5" fontSize="11" fontWeight="bold" textAnchor="middle">?</text>
                  <rect x="18" y="22" width="22" height="16" rx="4" fill="#22D3EE" />
                  <path d="M22 30H34M22 34H30" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </svg>
            );
""")

    # Translate PDF
    cases_code.append("""          case 'translate-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0D9488" />
                <rect x="9" y="12" width="14" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <text x="16" y="25" fill="#0D9488" fontSize="10" fontWeight="900" textAnchor="middle">A</text>
                <rect x="27" y="20" width="14" height="18" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <text x="34" y="33" fill="#0D9488" fontSize="9" fontWeight="900" textAnchor="middle">文</text>
                <g className="pro-anim-trans-swap">
                  <path d="M17 35H25M23 33L25 35L23 37" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Edit PDF
    cases_code.append("""          case 'edit-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#9333EA" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="16" x2="34" y2="16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="22" x2="26" y2="22" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="28" x2="34" y2="28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-pencil-write">
                  <path d="M31 14L35 18L26 27L22 28L23 24Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="1.2" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Add Image to PDF
    cases_code.append("""          case 'add-image-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#D97706" />
                <rect x="10" y="8" width="30" height="34" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <g className="pro-anim-photo-float">
                  <rect x="15" y="14" width="20" height="16" rx="2" fill="#D97706" />
                  <circle cx="19" cy="18" r="1.8" fill="#FEF08A" />
                  <path d="M16 28L21 21L26 27L29 24L34 28Z" fill="#FFFFFF" />
                </g>
              </svg>
            );
""")

    # PDF Find Replace
    cases_code.append("""          case 'pdf-find-replace':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#2563EB" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="16" x2="34" y2="16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <rect x="16" y="21" width="12" height="4" rx="1" fill="#FEF08A" />
                <line x1="16" y1="29" x2="34" y2="29" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-magnify-sweep">
                  <circle cx="28" cy="22" r="5" fill="none" stroke="#2563EB" strokeWidth="2.2" />
                  <line x1="32" y1="26" x2="37" y2="31" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
            );
""")

    # Rotate PDF
    cases_code.append("""          case 'rotate-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <rect x="16" y="13" width="18" height="24" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                <g className="pro-anim-rotate-spin">
                  <path d="M35 25C35 30.5 30.5 35 25 35C19.5 35 15 30.5 15 25C15 19.5 19.5 15 25 15" fill="none" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M23 11L27 15L23 19" fill="none" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Rotate Pages
    cases_code.append("""          case 'rotate-pages':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#4F46E5" />
                <rect x="12" y="14" width="14" height="20" rx="2" fill="#FFFFFF" fillOpacity="0.8" />
                <rect x="24" y="14" width="14" height="20" rx="2" fill="#FFFFFF" fillOpacity="0.95" />
                <g className="pro-anim-rotate-spin">
                  <path d="M37 24A12 12 0 1 1 25 12" fill="none" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M23 8L27 12L23 16" fill="none" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Crop PDF
    cases_code.append("""          case 'crop-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0F766E" />
                <rect x="14" y="13" width="22" height="24" rx="2" fill="#FFFFFF" fillOpacity="0.6" />
                <g className="pro-anim-crop-contract">
                  <path d="M10 16V10H16M34 10H40V16M40 34V40H34M16 40H10V34" fill="none" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    # Add Page Numbers
    cases_code.append("""          case 'add-page-numbers':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#334155" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="15" x2="34" y2="15" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="21" x2="34" y2="21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-num-badge">
                  <circle cx="29" cy="30" r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="29" y="33" fill="#FFFFFF" fontSize="7.5" fontWeight="900" textAnchor="middle">1</text>
                </g>
              </svg>
            );
""")

    # Add Header Footer
    cases_code.append("""          case 'add-header-footer':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#6D28D9" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <rect x="15" y="12" width="20" height="4" rx="1" fill="#6D28D9" className="pro-anim-hf-pulse" />
                <line x1="15" y1="21" x2="35" y2="21" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="15" y1="26" x2="35" y2="26" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="15" y="33" width="20" height="4" rx="1" fill="#6D28D9" className="pro-anim-hf-pulse" />
              </svg>
            );
""")

    # Watermark PDF
    cases_code.append("""          case 'watermark-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <line x1="16" y1="16" x2="34" y2="16" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="22" x2="34" y2="22" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="28" x2="34" y2="28" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="34" x2="34" y2="34" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-stamp-pulse">
                  <rect x="12" y="21" width="26" height="8" rx="2" fill="#DC2626" transform="rotate(-18 25 25)" />
                  <text x="25" y="27" fill="#FFFFFF" fontSize="5.5" fontWeight="900" textAnchor="middle" transform="rotate(-18 25 25)">SAMPLE</text>
                </g>
              </svg>
            );
""")

    # PDF Forms
    cases_code.append("""          case 'pdf-forms':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#059669" />
                <rect x="11" y="9" width="28" height="32" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <rect x="15" y="15" width="8" height="8" rx="2" fill="none" stroke="#059669" strokeWidth="1.8" />
                <line x1="26" y1="19" x2="34" y2="19" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <rect x="15" y="27" width="8" height="8" rx="2" fill="none" stroke="#059669" strokeWidth="1.8" />
                <line x1="26" y1="31" x2="34" y2="31" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <g className="pro-anim-check-pop">
                  <path d="M16 19L18.5 21.5L23 16" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
""")

    file_content = f"""import React from 'react';
import {{ LucideIcon, FileText }} from 'lucide-react';

interface AnimatedToolIconProps {{
  toolId: string;
  size?: number;
  className?: string;
  fallbackIcon?: LucideIcon;
  animate?: boolean;
}}

export const AnimatedToolIcon: React.FC<AnimatedToolIconProps> = ({{
  toolId,
  size = 40,
  className = '',
  fallbackIcon: FallbackIcon = FileText,
}}) => {{
  const s = size;

  return (
    <div className={{`relative inline-flex items-center justify-center select-none overflow-visible group ${{className}}`}}>
      <style>{{`{css}`}}</style>
      {{(() => {{
        switch (toolId) {{
{''.join(cases_code)}
          default:
            return <FallbackIcon size={{s * 0.7}} className="text-gray-700 dark:text-gray-300" />;
        }}
      }})()}}
    </div>
  );
}};
"""

    with open(target_path, 'w') as f:
        f.write(file_content)

    print(f"Successfully wrote {target_path} with {len(cases_code)} unique tools!")

if __name__ == '__main__':
    run()
