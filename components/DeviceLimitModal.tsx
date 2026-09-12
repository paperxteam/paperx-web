import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Smartphone, Laptop, Tablet, Monitor, AlertCircle, X, LogOut, Lock, Sparkles, ShieldX } from 'lucide-react';

interface DeviceLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

export const DeviceLimitModal: React.FC<DeviceLimitModalProps> = ({
  isOpen,
  onClose,
  email
}) => {
  if (!isOpen) return null;

  // Device slot representations for 5 active sessions
  const activeDeviceTypes = [
    { type: 'Mobile', icon: Smartphone, label: 'Device 1' },
    { type: 'Laptop', icon: Laptop, label: 'Device 2' },
    { type: 'Tablet', icon: Tablet, label: 'Device 3' },
    { type: 'Desktop', icon: Monitor, label: 'Device 4' },
    { type: 'Mobile', icon: Smartphone, label: 'Device 5' },
  ];

  return (
    <AnimatePresence>
      <div 
        id="device-limit-modal-backdrop"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-stone-950/75 backdrop-blur-md"
      >
        {/* Backdrop click handler */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          id="device-limit-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800 p-6 sm:p-7 overflow-hidden z-10 text-stone-900 dark:text-stone-100"
        >
          {/* Subtle Brand Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

          {/* Header Close Button */}
          <button
            id="device-limit-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Hero Section */}
          <div className="flex flex-col items-center text-center pt-2">
            {/* Animated Shield Container */}
            <div className="relative mb-3 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/25 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShieldAlert size={32} strokeWidth={2.2} />
                </motion.div>
              </motion.div>
            </div>

            {/* Modal Title */}
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
              Device Limit Exceeded
            </h2>
            
            <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-xs">
              You are signed in on the maximum allowed <strong className="text-red-600 dark:text-red-400 font-bold">5 devices simultaneously</strong> for this account.
            </p>

            {email && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 text-[11px] font-mono font-medium text-stone-600 dark:text-stone-300">
                <Lock size={12} className="text-stone-400 shrink-0" />
                <span className="truncate max-w-[220px]">{email}</span>
              </div>
            )}
          </div>

          {/* Active Device Slots Section */}
          <div className="mt-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-200">
              <span className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-red-500" />
                Active Device Slots
              </span>
              <span className="text-red-600 dark:text-red-400 font-black">
                5 of 5 Occupied
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <div className="h-full bg-red-500 rounded-full w-full" />
            </div>

            {/* Device Slot Icons Grid */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {activeDeviceTypes.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700/80 flex flex-col items-center justify-center gap-1 shadow-2xs"
                  >
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <IconComponent size={16} className="text-red-500 dark:text-red-400" />
                    </motion.div>
                    <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400">
                      Slot {index + 1}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Instructions Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-stone-800 dark:text-stone-200 flex items-start gap-3">
            <motion.div 
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            >
              <AlertCircle size={16} />
            </motion.div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-stone-900 dark:text-white block">
                How to sign in on this device:
              </span>
              <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                Log out of PaperX on one of your other 5 active browsers or devices. Once a slot is released, you can immediately log in here.
              </p>
            </div>
          </div>

          {/* Primary Footer Button */}
          <div className="mt-5">
            <button
              id="device-limit-modal-back-btn"
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
