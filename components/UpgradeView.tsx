import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Zap, Sparkles, Check, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, getUserPurchasedTier, isBillingCycleCovered, BillingCycleType, getPlanCreditValue } from '../types';
import { Button } from './Button';

export interface UpgradeViewProps {
    onUpgrade: (plan: 'Pro Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void;
    onSwitchPlan?: (plan: 'Basic Plan' | 'Pro Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
    currentPlan?: string;
    user?: User | null;
    isExpired?: boolean;
    orders?: any[];
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({
    onUpgrade,
    onSwitchPlan,
    currentPlan = 'Basic Plan',
    user = null,
    isExpired = false,
    orders = []
}) => {
    const purchasedTier = getUserPurchasedTier(user);
    const userCycle = (user?.billingCycle as BillingCycleType) || 'month';
    const activePlanName = user?.activePlanMode || user?.plan || currentPlan || 'Basic Plan';
    const isUsingMax = !isExpired && activePlanName.toLowerCase().includes('max');
    const isUsingPlus = !isExpired && (activePlanName.toLowerCase().includes('plus') || activePlanName.toLowerCase().includes('pro'));
    const isUsingFree = isExpired || (!isUsingMax && !isUsingPlus);

    const ownsMax = !isExpired && purchasedTier === 'Max';
    const ownsPlus = !isExpired && purchasedTier === 'Plus';

    const [selectedCycle, setSelectedCycle] = useState<'month' | 'half-year' | 'year'>(
        (user?.billingCycle as any) || 'month'
    );

    // Dynamic operations used calculation
    const currentTierName = isUsingMax ? 'MAX' : (isUsingPlus ? 'PRO' : 'FREE');
    const maxOps = isUsingMax ? 1000 : (isUsingPlus ? 100 : 5);
    const opsUsed = Number(user?.projectsUsed ?? user?.featureUsageCount ?? 0);
    const opsRemaining = Math.max(0, maxOps - opsUsed);
    const isLimitReached = isUsingFree && opsUsed >= 5;

    // Check if the currently viewed cycle is covered by the user's purchased subscription
    const isCycleCovered = isBillingCycleCovered(userCycle, selectedCycle);
    const ownsMaxInCycle = ownsMax && isCycleCovered;
    const ownsPlusInCycle = (ownsMax || ownsPlus) && isCycleCovered;

    // Active membership credit value for upgrades
    const userActiveCredit = (() => {
        if (!user || user?.isRefunded || isExpired || purchasedTier === 'Free' || user.plan === 'Basic Plan' || user.subscriptionStatus === 'free') return 0;
        if (purchasedTier === 'Max') {
            return getPlanCreditValue('Max Plan', userCycle);
        }
        if (purchasedTier === 'Plus') {
            return getPlanCreditValue('Pro Plan', userCycle);
        }
        return 0;
    })();

    const cycleDetails = {
        'month': {
            plusPrice: '₹29',
            plusDuration: '/ month',
            plusRaw: '29',
            maxPrice: '₹49',
            maxDuration: '/ month',
            maxRaw: '49',
            label: 'Month',
            badge: ''
        },
        'half-year': {
            plusPrice: '₹145',
            plusDuration: '/ 6 months',
            plusRaw: '145',
            maxPrice: '₹245',
            maxDuration: '/ 6 months',
            maxRaw: '245',
            label: 'Half-Year',
            badge: 'Save ₹29'
        },
        'year': {
            plusPrice: '₹290',
            plusDuration: '/ year',
            plusRaw: '290',
            maxPrice: '₹490',
            maxDuration: '/ year',
            maxRaw: '490',
            label: 'Year',
            badge: 'Save ₹58'
        }
    };

    const cycleKeys = ['month', 'half-year', 'year'] as const;
    const activeIndex = cycleKeys.indexOf(selectedCycle);
    const currentPricing = cycleDetails[selectedCycle];

    return (
        <div className="max-w-6xl mx-auto w-full pb-12">
            {/* Cycle Selector with Smooth Liquid Water Droplet Transition & Small Dewdrops */}
            <div className="flex justify-center mb-6 sm:mb-8 px-2 sm:px-4 w-full">
                <div className="w-full max-w-[440px] sm:max-w-md p-1 sm:p-1.5 rounded-full bg-stone-100/95 dark:bg-stone-900/95 border border-stone-200/90 dark:border-stone-800 shadow-sm relative z-10">
                    {/* Animated Sliding Water Droplet Track Indicator */}
                    <motion.div
                        className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 rounded-full pointer-events-none z-0"
                        initial={false}
                        animate={{
                            left: `calc(${activeIndex} * ((100% - 8px) / 3) + 4px)`,
                            width: `calc((100% - 8px) / 3)`
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 28,
                            mass: 0.7
                        }}
                    >
                        {/* Liquid Water Droplet Body without scaling artifacts or black fringing */}
                        <div className="relative w-full h-full rounded-full bg-white/95 dark:bg-white/20 shadow-sm border border-white dark:border-white/20 overflow-hidden">
                            {/* Liquid surface tension meniscus highlight (water sheen) */}
                            <div className="absolute inset-x-2 top-0.5 h-[42%] rounded-t-full bg-gradient-to-b from-white/95 via-white/40 to-transparent pointer-events-none" />
                            
                            {/* Specular water droplet glint (reflection on upper-left curve) */}
                            <div className="absolute top-1 left-2.5 w-2 h-1 rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.9)] blur-[0.2px] pointer-events-none -rotate-12" />
                            
                            {/* Subtle secondary micro-specular point */}
                            <div className="absolute top-1.5 left-5 w-1 h-0.5 rounded-full bg-white/80 blur-[0.2px] pointer-events-none" />
                            
                            {/* Subtle bottom liquid bead refraction */}
                            <div className="absolute inset-x-3 bottom-0.5 h-[2px] rounded-full bg-white/60 dark:bg-white/25 blur-[0.3px] pointer-events-none" />

                            {/* Small Water Droplet 1 (Dewdrop bead nestled safely inside the active pill) */}
                            <div 
                                className="absolute top-1.5 right-2.5 sm:right-3 w-2 h-2 rounded-full bg-white/90 dark:bg-white/40 shadow-xs border border-white dark:border-white/50 pointer-events-none"
                            >
                                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white blur-[0.1px]" />
                            </div>

                            {/* Small Water Droplet 2 (Satellite micro-dewdrop) */}
                            <div 
                                className="absolute top-3.5 right-4 sm:right-4.5 w-1.5 h-1.5 rounded-full bg-white/85 dark:bg-white/35 shadow-xs border border-white dark:border-white/40 pointer-events-none"
                            >
                                <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white blur-[0.1px]" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Button Grid on top of the liquid droplet track */}
                    <div className="relative z-10 grid grid-cols-3 gap-1 w-full">
                        {cycleKeys.map((cycleKey) => {
                            const item = cycleDetails[cycleKey];
                            const isActive = selectedCycle === cycleKey;
                            const isUserCurrent = userCycle === cycleKey && (ownsMax || ownsPlus);
                            return (
                                <button
                                    key={cycleKey}
                                    type="button"
                                    onClick={() => {
                                        if (selectedCycle !== cycleKey) {
                                            setSelectedCycle(cycleKey);
                                            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                                try { navigator.vibrate(10); } catch (_) {}
                                            }
                                        }
                                    }}
                                    className={`relative py-1.5 sm:py-2 px-1 rounded-full transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer select-none overflow-visible ${
                                        isActive
                                            ? 'text-stone-950 dark:text-white'
                                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                                    }`}
                                >
                                    {/* Line 1: Clear Label with ample margin - Half-Year H will NEVER be cut off */}
                                    <span className="text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap text-center leading-none overflow-visible">
                                        {item.label}
                                    </span>

                                    {/* Line 2: Badge or uniform spacing */}
                                    {isUserCurrent ? (
                                        <span className="text-[7.5px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-500 dark:text-amber-400 leading-none tracking-tight mt-0.5">
                                            Active
                                        </span>
                                    ) : item.badge ? (
                                        <span className={`text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-tight mt-0.5 ${
                                            isActive
                                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    ) : (
                                        /* Subtle transparent placeholder to preserve identical height across all buttons */
                                        <span className="h-[12px] opacity-0 text-[7.5px] select-none pointer-events-none mt-0.5" aria-hidden="true">
                                            •
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className={selectedCycle === 'month' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6"}>
                {/* 1. Free Plan */}
                {selectedCycle === 'month' && (
                <div className={`bg-white/70 dark:bg-gray-900/70 rounded-3xl p-6 sm:p-7 border ${isUsingFree ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-900/10 dark:ring-stone-100/10' : 'border-gray-200 dark:border-gray-800'} shadow-sm flex flex-col justify-between relative`}>
                    {isUsingFree && (
                        <div className="absolute -top-3 left-6 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Currently In Use
                        </div>
                    )}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-heading font-black text-gray-900 dark:text-white tracking-tight">Free Plan</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">Basic Limits</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-5">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">₹0</span>
                            <span className="text-gray-400 font-medium text-xs">/ free forever</span>
                        </div>
                        <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            5 operations total across all PaperX tools • Standard resolution processing
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> <strong>5 operations total</strong> (shared across all tools)</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Max file size up to 50 MB</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Core Organize tools (Merge, Split, Remove, Rotate)</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Compress PDF & Repair PDF</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Camera Scanner & Edge Detection</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> 100% Client-side privacy and security</li>
                        </ul>
                    </div>
                    {isUsingFree ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => onSwitchPlan?.('Basic Plan', selectedCycle)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>Use Free Plan</span>
                        </button>
                    )}
                </div>
                )}

                {/* 2. Pro Plan */}
                <div className={`bg-stone-900 text-stone-50 rounded-3xl p-6 sm:p-7 border ${isUsingPlus && isCycleCovered ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-stone-800'} shadow-xl flex flex-col justify-between relative group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={100} className="text-white" />
                    </div>
                    {isUsingPlus && isCycleCovered && (
                        <div className="absolute -top-3 left-6 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Currently In Use
                        </div>
                    )}
                    {!isUsingPlus && ownsMaxInCycle && (
                        <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles size={10} /> Free with Max
                        </div>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-[0_2px_8px_rgba(99,102,241,0.35)] tracking-tight">Pro Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700">PRO PLAN</span>
                        </div>
                        {ownsMaxInCycle ? (
                            <div className="flex items-baseline gap-2 mb-5">
                                <span className="text-3xl font-black text-white">FREE</span>
                                <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.plusPrice}</span>
                                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Unlocked with Max</span>
                            </div>
                        ) : (userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit && !isCycleCovered) ? (() => {
                            const plusRawVal = Number(currentPricing.plusRaw);
                            const discountedPlus = Math.max(1, plusRawVal - userActiveCredit);
                            return (
                                <div className="flex flex-col gap-1 mb-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">₹{discountedPlus}</span>
                                        <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.plusPrice}</span>
                                        <span className="text-stone-400 font-medium text-xs">{currentPricing.plusDuration}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 w-fit">
                                        <Sparkles size={11} /> Save ₹{userActiveCredit} with past membership
                                    </span>
                                </div>
                            );
                        })() : (
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-3xl font-black text-white">{currentPricing.plusPrice}</span>
                                <span className="text-stone-400 font-medium text-xs">{currentPricing.plusDuration}</span>
                            </div>
                        )}
                        <p className="text-xs font-bold text-stone-300 mb-4 pb-3 border-b border-stone-800">
                            Higher limits (100 operations) • Advanced tools & Batch processing
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> <strong>100 operations</strong> quota per cycle</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> <strong>Batch processing</strong> (multiple files simultaneously)</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Larger file limit: up to <strong>100 MB</strong></li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Office conversions (Word, Excel, PowerPoint to/from PDF)</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Edit PDF text, annotations & Crop PDF</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Searchable OCR & Text extraction</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Priority processing queue</li>
                        </ul>
                    </div>
                    {isUsingPlus && isCycleCovered ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 cursor-default flex items-center justify-center gap-1.5 relative z-10"
                        >
                            <CheckCircle2 size={14} className="text-indigo-400" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : ownsMaxInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Pro Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Pro Plan (Free with Max)</span>
                        </Button>
                    ) : ownsPlusInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Pro Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Pro Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discountToApply = (!isCycleCovered && userActiveCredit > 0 && plusRawVal > userActiveCredit) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, plusRawVal - discountToApply)) : currentPricing.plusRaw;
                                onUpgrade('Pro Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer"
                        >
                            {(!isCycleCovered && userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit) ? (() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discounted = Math.max(1, plusRawVal - userActiveCredit);
                                return `Upgrade to Pro Plan (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Pro Plan (${currentPricing.plusPrice})`}
                        </Button>
                    )}
                </div>

                {/* 3. Max Plan */}
                <div className={`bg-black text-white rounded-3xl p-6 sm:p-7 border ${isUsingMax && isCycleCovered ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-800'} shadow-2xl flex flex-col justify-between relative group`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none rounded-3xl"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition-opacity">
                        <Crown size={100} className="text-yellow-400" />
                    </div>
                    {isUsingMax && isCycleCovered && (
                        <div className="absolute -top-3 left-6 bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Crown size={11} /> Currently In Use
                        </div>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)] tracking-tight">Max Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-xs">MAX</span>
                        </div>
                        {(userActiveCredit > 0 && Number(currentPricing.maxRaw) > userActiveCredit && !isExpired && !user?.isRefunded) ? (() => {
                            const maxRawVal = Number(currentPricing.maxRaw) || 100;
                            const discountedMax = Math.max(1, maxRawVal - userActiveCredit);
                            return (
                                <div className="flex flex-col gap-1 mb-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">₹{discountedMax}</span>
                                        <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.maxPrice}</span>
                                        <span className="text-stone-400 font-medium text-xs">{currentPricing.maxDuration}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 w-fit">
                                        <Sparkles size={11} /> Save ₹{userActiveCredit} with past membership
                                    </span>
                                </div>
                            );
                        })() : (
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-3xl font-black text-white">{currentPricing.maxPrice}</span>
                                <span className="text-stone-400 font-medium text-xs">{currentPricing.maxDuration}</span>
                            </div>
                        )}
                        <p className="text-xs font-bold text-yellow-300/90 mb-4 pb-3 border-b border-gray-800">
                            Maximum limits (1,000 operations) • All tools & Full AI intelligence suite
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> <strong>1,000 operations</strong> quota per cycle</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> <strong>All 35 PaperX tools</strong> completely unlocked</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Maximum file size: up to <strong>500 MB</strong></li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> AI Suite: Summarizer, PDF Q&A, Document Analysis & Translate</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Full PDF Security: Unlock, Sign, Redact & Compare</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> PDF to PDF/A archival & HTML conversion</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Priority batch processing & VIP execution queue</li>
                        </ul>
                    </div>
                    {isUsingMax && isCycleCovered ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 cursor-default flex items-center justify-center gap-1.5 relative z-10"
                        >
                            <Crown size={14} className="text-yellow-400" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : ownsMaxInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Max Plan', selectedCycle)} 
                            className="w-full font-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-stone-950 border-none shadow-lg text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Crown size={13} />
                            <span>Use Max Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const maxRawVal = Number(currentPricing.maxRaw) || 100;
                                const discountToApply = (userActiveCredit > 0 && maxRawVal > userActiveCredit && !isExpired && !user?.isRefunded) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, maxRawVal - discountToApply)) : currentPricing.maxRaw;
                                onUpgrade('Max Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-stone-950 border-none shadow-lg text-xs relative z-10 cursor-pointer"
                        >
                            {(userActiveCredit > 0 && Number(currentPricing.maxRaw) > userActiveCredit && !isExpired && !user?.isRefunded) ? (() => {
                                const maxRawVal = Number(currentPricing.maxRaw) || 100;
                                const discounted = Math.max(1, maxRawVal - userActiveCredit);
                                return `Upgrade to Max (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Max (${currentPricing.maxPrice})`}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
