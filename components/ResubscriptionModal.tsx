import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, CheckCircle2, ArrowRight, X, Clock, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { User } from '../types';

export type BillingCycle = 'month' | 'half-year' | 'year';

interface ResubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSelectPlanAndRenew: (plan: 'Plus Plan' | 'Max Plan', amount: string, cycle: BillingCycle) => void;
}

const PRICING_DATA: Record<'Plus Plan' | 'Max Plan', Record<BillingCycle, { amount: number; label: string; period: string; savings?: string }>> = {
  'Plus Plan': {
    'month': { amount: 50, label: '1 Month', period: '30 days' },
    'half-year': { amount: 250, label: '6 Months', period: '180 days', savings: 'Save ₹50' },
    'year': { amount: 500, label: '1 Year', period: '365 days', savings: 'Save ₹100' },
  },
  'Max Plan': {
    'month': { amount: 100, label: '1 Month', period: '30 days' },
    'half-year': { amount: 500, label: '6 Months', period: '180 days', savings: 'Save ₹100' },
    'year': { amount: 1000, label: '1 Year', period: '365 days', savings: 'Save ₹200' },
  }
};

export const ResubscriptionModal: React.FC<ResubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectPlanAndRenew,
}) => {
  const initialPlan = (user?.previousPlan === 'Max Plan' || user?.plan === 'Max Plan') ? 'Max Plan' : 'Plus Plan';
  const [selectedPlan, setSelectedPlan] = useState<'Plus Plan' | 'Max Plan'>(initialPlan);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>((user?.billingCycle as BillingCycle) || 'month');

  if (!isOpen) return null;

  const currentPricing = PRICING_DATA[selectedPlan][selectedCycle];
  const previousPlanName = user?.previousPlan || user?.plan || 'Plus Plan';

  const handleRenewClick = () => {
    onSelectPlanAndRenew(selectedPlan, currentPricing.amount.toString(), selectedCycle);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="resubscription-modal-backdrop" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-stone-950/80 backdrop-blur-md"
      >
        <motion.div
          id="resubscription-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-100 p-6 sm:p-8"
        >
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Close button */}
          <button
            id="resubscription-modal-close-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors z-10 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
              <Clock size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Plan Expired
                </span>
                <span className="text-xs text-stone-400 font-medium">Reverted to Free Tier</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
                Renew Your Membership
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 leading-relaxed">
                Your <strong className="text-amber-400 font-semibold">{previousPlanName}</strong> has completed its cycle. Your account is currently on the <strong className="text-stone-300">Free Tier</strong> (10 daily conversions limit). Re-subscribe below to immediately unlock unlimited high-speed conversions and all premium tools.
              </p>
            </div>
          </div>

          {/* Plan Selection Tabs */}
          <div className="mb-5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
              1. Choose Membership Plan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="resubscribe-select-plus-plan"
                onClick={() => setSelectedPlan('Plus Plan')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedPlan === 'Plus Plan'
                    ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-950/40'
                    : 'bg-stone-800/40 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                    <Crown size={15} className={selectedPlan === 'Plus Plan' ? 'text-blue-400' : 'text-stone-400'} />
                    Plus Plan
                  </span>
                  {selectedPlan === 'Plus Plan' && (
                    <CheckCircle2 size={16} className="text-blue-400" />
                  )}
                </div>
                <span className="text-[11px] text-stone-400 leading-tight">
                  Unlimited projects, 100MB files, priority conversion
                </span>
              </button>

              <button
                type="button"
                id="resubscribe-select-max-plan"
                onClick={() => setSelectedPlan('Max Plan')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  selectedPlan === 'Max Plan'
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/40'
                    : 'bg-stone-800/40 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                    <Zap size={15} className={selectedPlan === 'Max Plan' ? 'text-amber-400' : 'text-stone-400'} />
                    Max Plan
                  </span>
                  {selectedPlan === 'Max Plan' && (
                    <CheckCircle2 size={16} className="text-amber-400" />
                  )}
                </div>
                <span className="text-[11px] text-stone-400 leading-tight">
                  500MB limits, Neural OCR, 4K OCR, Ultra speed
                </span>
              </button>
            </div>
          </div>

          {/* Billing Cycle Duration Selection */}
          <div className="mb-5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
              2. Select Membership Duration
            </label>

            {/* Standard 3-Season Duration Grid */}
            <div className="grid grid-cols-3 gap-2">
              {(['month', 'half-year', 'year'] as BillingCycle[]).map((cycle) => {
                const info = PRICING_DATA[selectedPlan][cycle];
                const isSelected = selectedCycle === cycle;
                return (
                  <button
                    key={cycle}
                    type="button"
                    id={`resubscribe-cycle-${cycle}`}
                    onClick={() => setSelectedCycle(cycle)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-stone-800 border-amber-400/80 text-stone-100 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-stone-800/30 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    {info.savings && (
                      <span className="absolute -top-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/90 text-white shadow-xs">
                        {info.savings}
                      </span>
                    )}
                    <span className="text-xs font-bold block mb-0.5">{info.label}</span>
                    <span className={`text-sm font-black ${isSelected ? 'text-amber-400' : 'text-stone-300'}`}>
                      ₹{info.amount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Included Features Reminder */}
          <div className="p-3.5 bg-stone-950/60 border border-stone-800/80 rounded-2xl mb-6">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Instant Auto-Activation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-400 shrink-0" />
                <span>All Locked Tools Restored</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Real 12-Digit UTR Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400 shrink-0" />
                <span>Fast Cloud Queue</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="resubscribe-confirm-renew-btn"
              onClick={handleRenewClick}
              className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
            >
              <span>Re-subscribe Now — ₹{currentPricing.amount}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              id="resubscribe-continue-free-btn"
              onClick={onClose}
              className="w-full sm:w-auto py-3.5 px-4 bg-stone-800/80 hover:bg-stone-800 text-stone-300 font-semibold text-xs rounded-2xl border border-stone-700/60 transition-colors cursor-pointer text-center"
            >
              Continue Free Tier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
