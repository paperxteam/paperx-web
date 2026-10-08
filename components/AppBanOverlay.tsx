// components/AppBanOverlay.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Ban } from 'lucide-react';
import { checkPermanentSuspendedStatus } from '../src/utils/profanityFilter';
import { User } from '../types';

const BLOCK_ICON_DATA_URL = 'data:image/png;base64,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';

const AccountBannedIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img 
    src="/Blockimages-red.png" 
    alt="Account Banned" 
    className={`${className} object-contain select-none pointer-events-none drop-shadow-[0_2px_8px_rgba(239,68,68,0.35)]`} 
    onError={(e) => {
      e.currentTarget.src = BLOCK_ICON_DATA_URL;
    }}
  />
);

interface AppBanOverlayProps {
  user?: User | null;
  onLogout?: (destination?: string) => void;
}

export const AppBanOverlay: React.FC<AppBanOverlayProps> = ({ user, onLogout }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal whenever a user logs in, switches, or profile updates
  useEffect(() => {
    setIsDismissed(false);
  }, [user?.uid, user?.email]);

  const [isPermanent, setIsPermanent] = useState<boolean>(() => {
    if (!user) return false;
    if (user.isPermanentSuspended) return true;
    if (user.status === 'DISABLED' || (user as any).isBlocked) return true;
    return checkPermanentSuspendedStatus(user.email || user.uid);
  });

  const [banReason, setBanReason] = useState<string>(() => {
    return user?.permanentSuspensionReason || 
      localStorage.getItem('paperx_permanent_banned_reason') || 
      'Giving hate and slangs to PaperX after receiving 3 warnings. Strictly prohibited by PaperX App Rules.';
  });

  useEffect(() => {
    if (!user) {
      setIsPermanent(false);
      return;
    }

    const checkStatus = () => {
      const isChatSuspended = Boolean(
        user.isPermanentSuspended || 
        checkPermanentSuspendedStatus(user.email || user.uid)
      );
      const isAdminBlocked = Boolean(
        user.status === 'DISABLED' || (user as any).isBlocked
      );
      const isPerm = isChatSuspended || isAdminBlocked;

      setIsPermanent(isPerm);
      if (isPerm) {
        const reason = user.permanentSuspensionReason || 
          localStorage.getItem('paperx_permanent_banned_reason') || 
          'Giving hate and slangs to PaperX after receiving 3 warnings. Strictly prohibited by PaperX App Rules.';
        setBanReason(reason);
      }
    };

    checkStatus();
    window.addEventListener('paperx_permanent_ban_updated', checkStatus);
    window.addEventListener('paperx_ban_updated', checkStatus);

    return () => {
      window.removeEventListener('paperx_permanent_ban_updated', checkStatus);
      window.removeEventListener('paperx_ban_updated', checkStatus);
    };
  }, [user?.isPermanentSuspended, (user as any)?.isBlocked, user?.status, user?.email, user?.uid, user?.permanentSuspensionReason]);

  const isChatSuspended = Boolean(
    user && (user.isPermanentSuspended || checkPermanentSuspendedStatus(user.email || user.uid))
  );
  const isAdminBlocked = Boolean(
    user && (user.status === 'DISABLED' || (user as any).isBlocked)
  );

  const shouldShow = Boolean(user && !isDismissed && (isPermanent || isChatSuspended || isAdminBlocked));

  const isBlockedByAdmin = isAdminBlocked && !isChatSuspended;
  const userEmail = user?.email || localStorage.getItem('paperx_permanent_banned_email') || 'Google Account';

  const tagText = isBlockedByAdmin ? 'Account Blocked by Admin' : 'Permanent Account Suspension';
  const titleText = 'Account Permanently Suspended';
  const descriptionText = isBlockedByAdmin
    ? 'Your account has been disabled by the PaperX Administrator. Please switch to an authorized, compliant account to use PaperX.'
    : 'Giving hate and slangs to PaperX is strictly prohibited by our app rules. After exceeding 3 warnings, this account has been permanently banned.';
  const violationReasonText = isBlockedByAdmin
    ? (user?.blockReason || 'Account disabled by PaperX Administrator')
    : banReason;
  const actionTakenText = isBlockedByAdmin
    ? 'Admin Block (Access Revoked)'
    : 'Permanent Ban (Access Revoked)';

  const handleSignOutClick = () => {
    // Instantly dismiss overlay locally for zero lag
    setIsDismissed(true);

    if (onLogout) {
      onLogout('/signup');
    }
    if (typeof window !== 'undefined') {
      window.location.hash = '/signup';
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('hashchange'));
    }
  };

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div 
          key="ban-overlay-backdrop"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)', transition: { duration: 0.25, ease: 'easeOut' } }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
        >
          <motion.div
            key="ban-overlay-card"
            initial={{ scale: 0.94, opacity: 0, y: 14, filter: 'blur(16px)', WebkitFilter: 'blur(16px)' }}
            animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)', WebkitFilter: 'blur(0px)' }}
            exit={{ scale: 0.94, opacity: 0, y: -10, filter: 'blur(12px)', WebkitFilter: 'blur(12px)', transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg my-auto rounded-[36px] sm:rounded-[42px] bg-stone-900 border border-stone-800 p-6 sm:p-8 text-center shadow-2xl flex flex-col gap-5 select-none will-change-[transform,opacity,filter]"
          >
          {/* Account Banned Icon Badge */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <AccountBannedIcon className="w-8 h-8 text-red-500" />
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wide uppercase">
              <Ban size={13} />
              <span>{tagText}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {titleText}
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              {descriptionText}
            </p>
          </div>

          {/* Account Details Box */}
          <div className="rounded-2xl bg-stone-950/60 border border-stone-800/80 p-4 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">Account / Google Email:</span>
              <span className="font-mono font-medium text-white truncate max-w-[190px] sm:max-w-[240px]">{userEmail}</span>
            </div>
            <div className="border-t border-stone-800/60" />
            <div className="flex items-start justify-between text-xs gap-2">
              <span className="text-stone-400 shrink-0 font-medium">Violation Reason:</span>
              <span className="font-medium text-red-400 text-right leading-tight">
                {violationReasonText}
              </span>
            </div>
            <div className="border-t border-stone-800/60" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">Action Taken:</span>
              <span className="font-semibold text-red-500">{actionTakenText}</span>
            </div>
          </div>

          {/* Enforcement Notice */}
          <p className="text-[11px] text-stone-500 leading-relaxed font-normal">
            Opening this account again on any device will continue to display this permanent suspension. Please switch to an authorized, compliant account to use PaperX.
          </p>

          {/* Sign Out Button - Professional 3D Elevated/Raised Tactile Style */}
          {onLogout && (
            <div className="w-full pt-3 pb-1">
              <button
                onClick={handleSignOutClick}
                className="group relative w-full py-3.5 px-6 rounded-full bg-gradient-to-b from-stone-750 via-stone-800 to-stone-850 hover:from-stone-700 hover:to-stone-800 text-white font-heading font-bold text-xs sm:text-sm tracking-wide border-t border-t-stone-600/80 border-x border-x-stone-700/80 border-b-[4.5px] border-b-stone-950 shadow-[0_12px_28px_-3px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_34px_-3px_rgba(0,0,0,0.95)] hover:-translate-y-0.5 active:translate-y-[2.5px] active:border-b-[1.5px] active:shadow-[0_3px_8px_rgba(0,0,0,0.6)] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer select-none"
              >
                <LogOut size={16} className="text-stone-300 group-hover:-translate-x-0.5 transition-transform drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                <span className="text-white font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Sign Out / Switch Account</span>
              </button>
            </div>
          )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
