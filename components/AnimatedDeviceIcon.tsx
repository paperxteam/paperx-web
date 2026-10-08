import React, { useId } from 'react';
import { motion } from 'motion/react';

export type DeviceCategory = 'mobile' | 'laptop' | 'desktop' | 'tablet';

interface AnimatedDeviceIconProps {
  type: DeviceCategory | string;
  isCurrentSession?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const AnimatedDeviceIcon: React.FC<AnimatedDeviceIconProps> = ({
  type,
  isCurrentSession = false,
  size = 'md',
  className = '',
  animate = true
}) => {
  const uId = useId();
  const cleanId = uId.replace(/[^a-zA-Z0-9]/g, '');

  const normType: DeviceCategory = 
    type === 'mobile' ? 'mobile' :
    type === 'tablet' ? 'tablet' :
    type === 'laptop' ? 'laptop' : 'desktop';

  // Dimension scaling
  const dim = {
    sm: { box: 'w-8 h-8', svg: 22 },
    md: { box: 'w-10 h-10', svg: 28 },
    lg: { box: 'w-12 h-12', svg: 34 },
    xl: { box: 'w-16 h-16', svg: 46 }
  }[size];

  // Colors and Gradients definitions based on whether it is the active/current session
  const screenGradient = isCurrentSession 
    ? { start: '#10b981', end: '#6366f1' } // Vibrant Emerald to Indigo
    : { start: '#475569', end: '#94a3b8' }; // Cool Slate-Gray

  return (
    <div className={`relative flex items-center justify-center select-none ${dim.box} ${className}`}>
      {/* 1. MOBILE/SMARTPHONE */}
      {normType === 'mobile' && (
        <div className="relative flex items-center justify-center">
          <svg
            width={dim.svg}
            height={dim.svg}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <defs>
              <linearGradient id={`grad-mobile-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={screenGradient.start} stopOpacity="0.18" />
                <stop offset="100%" stopColor={screenGradient.end} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Phone Outer Chassis with premium bevel */}
            <rect 
              x="5" 
              y="1" 
              width="14" 
              height="22" 
              rx="3.5" 
              ry="3.5" 
              stroke="currentColor" 
              fill={`url(#grad-mobile-${cleanId})`} 
            />

            {/* Inner Screen Area */}
            <rect 
              x="6" 
              y="2.2" 
              width="12" 
              height="19.6" 
              rx="2.2" 
              ry="2.2" 
              stroke="currentColor" 
              strokeWidth="0.8"
              strokeOpacity="0.15" 
              fill="none"
            />

            {/* Notch / Dynamic Island */}
            <rect 
              x="9.5" 
              y="2" 
              width="5" 
              height="1.2" 
              rx="0.6" 
              fill="currentColor" 
              stroke="none"
            />

            {/* Bottom Home Indicator Bar */}
            <line 
              x1="9.5" 
              y1="20.5" 
              x2="14.5" 
              y2="20.5" 
              stroke="currentColor" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              strokeOpacity="0.8"
            />

            {/* UI Mockup list */}
            <rect
              x="7.5"
              y="5.5"
              width="9"
              height="3"
              rx="0.8"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="none"
            />
            <rect
              x="7.5"
              y="10"
              width="6"
              height="2.2"
              rx="0.6"
              fill="currentColor"
              fillOpacity="0.08"
              stroke="none"
            />

            {/* Sparkline/Graph representing activity on mobile device */}
            <path
              d="M7.5 16.5 q 2 -3, 4 -1 t 2 -2.5 t 3 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity={isCurrentSession ? "0.9" : "0.4"}
              className={isCurrentSession ? "text-emerald-500" : ""}
            />
          </svg>
        </div>
      )}

      {/* 2. LAPTOP */}
      {normType === 'laptop' && (
        <div className="relative flex items-center justify-center">
          <svg
            width={dim.svg}
            height={dim.svg}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <defs>
              <linearGradient id={`grad-laptop-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={screenGradient.start} stopOpacity="0.18" />
                <stop offset="100%" stopColor={screenGradient.end} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Laptop Screen Upper Bezel Frame */}
            <rect 
              x="3.5" 
              y="3.5" 
              width="17" 
              height="12" 
              rx="1.5" 
              stroke="currentColor" 
              fill={`url(#grad-laptop-${cleanId})`} 
            />

            {/* Laptop Webcam dot */}
            <circle cx="12" cy="4.7" r="0.6" fill="currentColor" stroke="none" />

            {/* Laptop Bottom Base & Keyboard Deck */}
            <path 
              d="M1 16.5h22c-.6-2-2-2.2-3.2-2.2H4.2c-1.2 0-2.6.2-3.2 2.2z" 
              stroke="currentColor" 
              fill="currentColor" 
              fillOpacity="0.12" 
            />

            {/* Bottom edge protective rubber foot indicator */}
            <line x1="1.2" y1="17.2" x2="22.8" y2="17.2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

            {/* Laptop Trackpad Notch */}
            <path d="M10 15.5h4" stroke="currentColor" strokeWidth="1.2" />

            {/* Dashboard widget mockup on screen */}
            <rect
              x="6"
              y="6.5"
              width="6"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="none"
            />
            
            {/* Visual graph lines on display */}
            <line
              x1="14"
              y1="7.5"
              x2="18"
              y2="7.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <line
              x1="14"
              y1="10.5"
              x2="17"
              y2="10.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
          </svg>
        </div>
      )}

      {/* 3. DESKTOP WORKSTATION */}
      {normType === 'desktop' && (
        <div className="relative flex items-center justify-center">
          <svg
            width={dim.svg}
            height={dim.svg}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <defs>
              <linearGradient id={`grad-desktop-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={screenGradient.start} stopOpacity="0.18" />
                <stop offset="100%" stopColor={screenGradient.end} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Monitor Screen Chassis */}
            <rect 
              x="2" 
              y="2.5" 
              width="20" 
              height="14" 
              rx="2" 
              stroke="currentColor" 
              fill={`url(#grad-desktop-${cleanId})`} 
            />

            {/* Monitor Stand Neck */}
            <path 
              d="M12 16.5v4.5" 
              stroke="currentColor" 
              strokeWidth="2.2" 
            />

            {/* Monitor Premium Trapezoid Base */}
            <path 
              d="M7 21h10" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />

            {/* Elegant Bento Mockup workspace */}
            <g className="opacity-70">
              {/* Left Side Navigation Panel Mock */}
              <rect x="4" y="4.5" width="3.5" height="10" rx="0.6" fill="currentColor" fillOpacity="0.08" stroke="none" />
              {/* Main Content Area Panel 1 */}
              <rect 
                x="9" 
                y="4.5" 
                width="11" 
                height="4.5" 
                rx="0.8" 
                fill="currentColor" 
                fillOpacity="0.1" 
                stroke="none"
              />
              {/* Main Content Area Panel 2 */}
              <rect 
                x="9" 
                y="10" 
                width="11" 
                height="4.5" 
                rx="0.8" 
                fill="currentColor" 
                fillOpacity="0.06" 
                stroke="none"
              />
            </g>

            {/* Power Indicator LED */}
            <circle cx="12" cy="15.2" r="0.5" fill={isCurrentSession ? "#10b981" : "currentColor"} opacity="0.8" />
          </svg>
        </div>
      )}

      {/* 4. TABLET */}
      {normType === 'tablet' && (
        <div className="relative flex items-center justify-center">
          <svg
            width={dim.svg}
            height={dim.svg}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-200"
          >
            <defs>
              <linearGradient id={`grad-tablet-${cleanId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={screenGradient.start} stopOpacity="0.18" />
                <stop offset="100%" stopColor={screenGradient.end} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Tablet Frame */}
            <rect 
              x="4" 
              y="1.5" 
              width="16" 
              height="21" 
              rx="2.5" 
              stroke="currentColor" 
              fill={`url(#grad-tablet-${cleanId})`} 
            />

            {/* Tablet Front Camera Dot */}
            <circle cx="12" cy="3" r="0.6" fill="currentColor" stroke="none" />

            {/* Home Screen Indicator Touch Bar */}
            <line 
              x1="10" 
              y1="21" 
              x2="14" 
              y2="21" 
              stroke="currentColor" 
              strokeWidth="1.4" 
              strokeLinecap="round" 
            />

            {/* Touch Signature stylus drawings mockup */}
            <g>
              <path
                d="M 7 11 C 10 7, 11 15, 17 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeOpacity={isCurrentSession ? "0.9" : "0.5"}
                className={isCurrentSession ? "text-indigo-400" : ""}
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
