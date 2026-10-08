import React from 'react';
import { LucideIcon, FileText } from 'lucide-react';

interface AnimatedToolIconProps {
  toolId: string;
  size?: number;
  className?: string;
  fallbackIcon?: LucideIcon;
  animate?: boolean;
}

export const AnimatedToolIcon: React.FC<AnimatedToolIconProps> = ({
  toolId,
  size = 40,
  className = '',
  fallbackIcon: FallbackIcon = FileText,
}) => {
  const s = size;

  return (
    <div className={`relative inline-flex items-center justify-center select-none overflow-visible group ${className}`}>
      <style>{`
  /* ━━━━━━━━━ Rock-Solid Static Placement for Feature Tool Icons ━━━━━━━━━ */
  /* Zero jumping, zero up-or-down displacement, zero blinking or pulsing. */
  /* Every feature tool icon is placed exactly according to its designed position. */

  .pro-anim-convert-arrow,
  .pro-anim-merge-left,
  .pro-anim-merge-right,
  .pro-anim-merge-arrow,
  .pro-anim-split-left,
  .pro-anim-split-right,
  .pro-anim-split-cut,
  .pro-anim-compress-arrows,
  .pro-anim-wrench-rock,
  .pro-anim-scan-beam,
  .pro-anim-sweep-horiz,
  .pro-anim-flatten-press,
  .pro-anim-shuffle-left,
  .pro-anim-shuffle-right,
  .pro-anim-extract-lift,
  .pro-anim-remove-fade,
  .pro-anim-cycle-spin,
  .pro-anim-insert-slide,
  .pro-anim-dup-peek,
  .pro-anim-nup-1,
  .pro-anim-nup-2,
  .pro-anim-nup-3,
  .pro-anim-nup-4,
  .pro-anim-lock-shackle,
  .pro-anim-unlock-shackle,
  .pro-anim-pen-draw,
  .pro-anim-redact-censor,
  .pro-anim-compare-divider,
  .pro-anim-ai-twinkle,
  .pro-anim-chat-breathe,
  .pro-anim-trans-swap,
  .pro-anim-pencil-write,
  .pro-anim-photo-float,
  .pro-anim-magnify-sweep,
  .pro-anim-rotate-spin,
  .pro-anim-crop-contract,
  .pro-anim-num-badge,
  .pro-anim-hf-pulse,
  .pro-anim-stamp-pulse,
  .pro-anim-check-pop {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
    transform-box: fill-box;
  }
`}</style>
      {(() => {
        switch (toolId) {
          case 'jpg-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#D97706" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#B45309" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">JPG</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'word-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'powerpoint-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#EA580C" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#C2410C" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">P</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'excel-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#15803D" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#166534" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">X</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'csv-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#0D9488" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#0F766E" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">CSV</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'html-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#EA580C" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#9A3412" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">HTML</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'txt-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#475569" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#334155" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">TXT</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'markdown-to-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#6D28D9" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#4C1D95" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">MD</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-jpg':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#D97706" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#B45309" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">JPG</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-png':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#7C3AED" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#6D28D9" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PNG</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-word':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-excel':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#15803D" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#166534" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">X</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-powerpoint':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#EA580C" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#C2410C" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">P</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-txt':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#475569" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#334155" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">TXT</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-markdown':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#6D28D9" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#4C1D95" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">MD</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-html':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#EA580C" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#9A3412" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">HTML</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-pdfa':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#1E40AF" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#172554" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF/A</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'pdf-to-csv':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#DC2626" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#991B1B" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#0D9488" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#0F766E" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">CSV</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'csv-to-xlsx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#0D9488" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#0F766E" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">CSV</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#15803D" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#166534" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">X</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'txt-to-docx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#475569" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#334155" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">TXT</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'markdown-to-docx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#6D28D9" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#4C1D95" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">MD</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'docx-to-txt':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#475569" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#334155" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">TXT</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'docx-to-html':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="5" width="23" height="28" rx="4" fill="#1D4ED8" />
                <rect x="3" y="5" width="23" height="7" rx="4" fill="#1E40AF" opacity="0.85" />
                <text x="14.5" y="24" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">W</text>
                
                <rect x="24" y="17" width="23" height="28" rx="4" fill="#EA580C" />
                <rect x="24" y="17" width="23" height="7" rx="4" fill="#9A3412" opacity="0.85" />
                <text x="35.5" y="36" fill="#FFFFFF" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">HTML</text>
                
                <g className="pro-anim-convert-arrow">
                  <circle cx="25" cy="25" r="8.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.8" />
                  <path d="M21.5 25H28.5M26 22.5L28.8 25L26 27.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'merge-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="#DC2626" fontSize="7" fontWeight="bold" textAnchor="middle">PDF</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="#DC2626" fontSize="7" fontWeight="bold" textAnchor="middle">PDF</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'merge-docx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#1D4ED8" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="#1D4ED8" fontSize="7" fontWeight="bold" textAnchor="middle">DOC</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="#1D4ED8" fontSize="7" fontWeight="bold" textAnchor="middle">DOC</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'merge-xlsx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#15803D" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="#15803D" fontSize="7" fontWeight="bold" textAnchor="middle">XLS</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="#15803D" fontSize="7" fontWeight="bold" textAnchor="middle">XLS</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'merge-pptx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#EA580C" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="#EA580C" fontSize="7" fontWeight="bold" textAnchor="middle">PPT</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="#EA580C" fontSize="7" fontWeight="bold" textAnchor="middle">PPT</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'merge-images':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#D97706" />
                <g className="pro-anim-merge-left">
                  <rect x="9" y="10" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.9" />
                  <text x="16.5" y="24" fill="#D97706" fontSize="7" fontWeight="bold" textAnchor="middle">IMG</text>
                </g>
                <g className="pro-anim-merge-right">
                  <rect x="26" y="18" width="15" height="22" rx="2.5" fill="#FFFFFF" fillOpacity="0.95" />
                  <text x="33.5" y="32" fill="#D97706" fontSize="7" fontWeight="bold" textAnchor="middle">IMG</text>
                </g>
                <g className="pro-anim-merge-arrow">
                  <circle cx="25" cy="25" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M22 25H28M25.5 22.5L28 25L25.5 27.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'split-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <g className="pro-anim-split-left">
                  <path d="M12 11H23V39H12C10.9 39 10 38.1 10 37V13C10 11.9 10.9 11 12 11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="17" y="27" fill="#DC2626" fontSize="8" fontWeight="bold" textAnchor="middle">P</text>
                </g>
                <g className="pro-anim-split-right">
                  <path d="M27 11H38C39.1 11 40 11.9 40 13V37C40 38.1 39.1 39 38 39H27V11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="33" y="27" fill="#DC2626" fontSize="8" fontWeight="bold" textAnchor="middle">F</text>
                </g>
                <line x1="25" y1="8" x2="25" y2="42" stroke="#FEF08A" strokeWidth="2.2" strokeDasharray="3 2" className="pro-anim-split-cut" />
                <circle cx="25" cy="25" r="4.5" fill="#0F172A" />
                <path d="M23 23L27 27M27 23L23 27" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            );
          case 'split-docx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#1D4ED8" />
                <g className="pro-anim-split-left">
                  <path d="M12 11H23V39H12C10.9 39 10 38.1 10 37V13C10 11.9 10.9 11 12 11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="17" y="27" fill="#1D4ED8" fontSize="8" fontWeight="bold" textAnchor="middle">D</text>
                </g>
                <g className="pro-anim-split-right">
                  <path d="M27 11H38C39.1 11 40 11.9 40 13V37C40 38.1 39.1 39 38 39H27V11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="33" y="27" fill="#1D4ED8" fontSize="8" fontWeight="bold" textAnchor="middle">C</text>
                </g>
                <line x1="25" y1="8" x2="25" y2="42" stroke="#FEF08A" strokeWidth="2.2" strokeDasharray="3 2" className="pro-anim-split-cut" />
                <circle cx="25" cy="25" r="4.5" fill="#0F172A" />
                <path d="M23 23L27 27M27 23L23 27" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            );
          case 'split-xlsx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#15803D" />
                <g className="pro-anim-split-left">
                  <path d="M12 11H23V39H12C10.9 39 10 38.1 10 37V13C10 11.9 10.9 11 12 11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="17" y="27" fill="#15803D" fontSize="8" fontWeight="bold" textAnchor="middle">X</text>
                </g>
                <g className="pro-anim-split-right">
                  <path d="M27 11H38C39.1 11 40 11.9 40 13V37C40 38.1 39.1 39 38 39H27V11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="33" y="27" fill="#15803D" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                </g>
                <line x1="25" y1="8" x2="25" y2="42" stroke="#FEF08A" strokeWidth="2.2" strokeDasharray="3 2" className="pro-anim-split-cut" />
                <circle cx="25" cy="25" r="4.5" fill="#0F172A" />
                <path d="M23 23L27 27M27 23L23 27" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            );
          case 'split-pptx':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#EA580C" />
                <g className="pro-anim-split-left">
                  <path d="M12 11H23V39H12C10.9 39 10 38.1 10 37V13C10 11.9 10.9 11 12 11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="17" y="27" fill="#EA580C" fontSize="8" fontWeight="bold" textAnchor="middle">P</text>
                </g>
                <g className="pro-anim-split-right">
                  <path d="M27 11H38C39.1 11 40 11.9 40 13V37C40 38.1 39.1 39 38 39H27V11Z" fill="#FFFFFF" fillOpacity="0.92" />
                  <text x="33" y="27" fill="#EA580C" fontSize="8" fontWeight="bold" textAnchor="middle">T</text>
                </g>
                <line x1="25" y1="8" x2="25" y2="42" stroke="#FEF08A" strokeWidth="2.2" strokeDasharray="3 2" className="pro-anim-split-cut" />
                <circle cx="25" cy="25" r="4.5" fill="#0F172A" />
                <path d="M23 23L27 27M27 23L23 27" stroke="#FEF08A" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            );
          case 'compress-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#DC2626" />
                <rect x="14" y="12" width="22" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <text x="25" y="28" fill="#DC2626" fontSize="9" fontWeight="900" textAnchor="middle">PDF</text>
                <g className="pro-anim-compress-arrows">
                  <path d="M8 8L14 14M14 9V14H9" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 8L36 14M36 9V14H41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 42L14 36M9 36H14V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 42L36 36M41 36H36V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'compress-image':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#D97706" />
                <rect x="14" y="12" width="22" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
                <text x="25" y="28" fill="#D97706" fontSize="9" fontWeight="900" textAnchor="middle">IMG</text>
                <g className="pro-anim-compress-arrows">
                  <path d="M8 8L14 14M14 9V14H9" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 8L36 14M36 9V14H41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 42L14 36M9 36H14V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M42 42L36 36M41 36H36V41" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'repair-pdf':
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
          case 'ocr-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
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
          case 'scan-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
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
          case 'image-to-text':
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
          case 'flatten-pdf':
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
          case 'organize-pdf':
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
          case 'extract-pages':
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
          case 'remove-pages':
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
          case 'replace-pages':
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
          case 'insert-pages':
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
          case 'duplicate-pages':
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
          case 'nup-pdf':
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
          case 'protect-pdf':
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
          case 'unlock-pdf':
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
          case 'sign-pdf':
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
          case 'redact-pdf':
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
          case 'compare-pdf':
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
          case 'summarize-pdf':
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
          case 'pdf-qa':
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
          case 'translate-pdf':
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
          case 'edit-pdf':
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
          case 'add-image-to-pdf':
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
          case 'pdf-find-replace':
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
          case 'rotate-pdf':
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
          case 'rotate-pages':
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
          case 'crop-pdf':
            return (
              <svg width={s} height={s} viewBox="0 0 50 50" fill="none">
                <rect x="3" y="3" width="44" height="44" rx="10" fill="#0F766E" />
                <rect x="14" y="13" width="22" height="24" rx="2" fill="#FFFFFF" fillOpacity="0.6" />
                <g className="pro-anim-crop-contract">
                  <path d="M10 16V10H16M34 10H40V16M40 34V40H34M16 40H10V34" fill="none" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            );
          case 'add-page-numbers':
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
          case 'add-header-footer':
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
          case 'watermark-pdf':
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
          case 'pdf-forms':
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

          default:
            return <FallbackIcon size={s * 0.7} className="text-gray-700 dark:text-gray-300" />;
        }
      })()}
    </div>
  );
};
