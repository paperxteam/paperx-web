import React, { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles, Check, CheckCircle2, Undo2, Clock, X } from 'lucide-react';
import { User, getUserPurchasedTier, isBillingCycleCovered, BILLING_CYCLE_LABELS, BillingCycleType, getPlanCreditValue } from '../types';
import { Button } from './Button';
import { updateUserInFirestore } from '../services/firebase';

export interface UpgradeViewProps {
    onUpgrade: (plan: 'Plus Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void;
    onSwitchPlan?: (plan: 'Basic Plan' | 'Plus Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
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

    const [dismissRefundNotice, setDismissRefundNotice] = useState<boolean>(() => {
        try {
            return user?.uid ? localStorage.getItem(`paperx_refund_dismissed_${user.uid}`) === 'true' : false;
        } catch (e) {
            return false;
        }
    });

    // Refund success is shown ONLY when user account is actively marked as isRefunded and not dismissed
    const showRefundSuccess = Boolean(user?.isRefunded) && !dismissRefundNotice && !ownsMax && !ownsPlus;

    const hasPendingRefund = !showRefundSuccess && orders.some(o => 
        o.ticketId && o.ticketStatus !== 'RESOLVED' && o.ticketStatus !== 'COMPLETED' && Boolean(o.ticketReason && (o.ticketReason.toLowerCase().includes('refund') || o.ticketReason.toLowerCase().includes('payout')))
    );

    const [selectedCycle, setSelectedCycle] = useState<'month' | 'half-year' | 'year'>(
        (user?.billingCycle as any) || 'month'
    );

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
            return getPlanCreditValue('Plus Plan', userCycle);
        }
        return 0;
    })();

    const cycleDetails = {
        'month': {
            plusPrice: '₹50',
            plusDuration: '/ month',
            plusRaw: '50',
            maxPrice: '₹100',
            maxDuration: '/ month',
            maxRaw: '100',
            label: 'Month',
            badge: 'Basic • Plus • Max'
        },
        'half-year': {
            plusPrice: '₹250',
            plusDuration: '/ 6 months',
            plusRaw: '250',
            maxPrice: '₹500',
            maxDuration: '/ 6 months',
            maxRaw: '500',
            label: 'Half-Year',
            badge: 'Save ₹50'
        },
        'year': {
            plusPrice: '₹500',
            plusDuration: '/ year',
            plusRaw: '500',
            maxPrice: '₹1000',
            maxDuration: '/ year',
            maxRaw: '1000',
            label: 'Year',
            badge: 'Save ₹100'
        }
    };

    const currentPricing = cycleDetails[selectedCycle];

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
            <div className="text-center mb-8">
                {/* Billing Cycle Duration Selector Tabs */}
                <div className="inline-flex p-1.5 rounded-full flex-wrap justify-center gap-1 ios-water-pill-container relative z-10">
                    {(['month', 'half-year', 'year'] as const).map((cycleKey) => {
                        const item = cycleDetails[cycleKey];
                        const isActive = selectedCycle === cycleKey;
                        const isUserCurrent = userCycle === cycleKey && (ownsMax || ownsPlus);
                        return (
                            <button
                                key={cycleKey}
                                type="button"
                                onClick={() => setSelectedCycle(cycleKey)}
                                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                                    isActive
                                        ? 'ios-water-pill-active'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <span>{item.label}</span>
                                {isUserCurrent && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                        Active
                                    </span>
                                )}
                                {!isUserCurrent && item.badge && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className={selectedCycle === 'month' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6"}>
                {/* Free / Basic Plan */}
                {selectedCycle === 'month' && (
                <div className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingFree ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-900/10 dark:ring-stone-100/10' : 'border-gray-200 dark:border-gray-800'} shadow-sm flex flex-col justify-between relative`}>
                    {isUsingFree && (
                        <div className="absolute -top-3 left-6 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Currently In Use
                        </div>
                    )}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-heading font-black text-gray-900 dark:text-white">Basic Plan</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">5 Days</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-5">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">₹0</span>
                            <span className="text-gray-400 font-medium text-xs">/ 5 days</span>
                        </div>
                        <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            10 feature operations total (once per user) • Essential document editing & standard conversion tools
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Text, Image, PDF converters</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Add text, Highlight, Underline, Draw</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Merge, Split, Extract, Delete, Rotate</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Create Document, Create PDF</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Camera Scanner & Edge Detection</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Basic OCR & Image → Text</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> 10 Operations Total (Once Per User)</li>
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
                            <span>Use Basic Plan</span>
                        </button>
                    )}
                </div>
                )}

                {/* Plus Plan */}
                <div className={`bg-stone-900 text-stone-50 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingPlus && isCycleCovered ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-stone-800'} shadow-xl flex flex-col justify-between relative group`}>
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
                            <h3 className="text-xl font-heading font-black text-white">Plus Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700">PLUS</span>
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
                            Basic + Plus features • Unlimited daily operations
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> All Basic features included</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Word, Excel, PowerPoint converters</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Edit PDF text & images</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Crop pages, PDF Organizer</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Searchable PDF & Auto Enhance</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Resume builder & Letter templates</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Private Folder & Unlimited daily files</li>
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
                            onClick={() => onSwitchPlan?.('Plus Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Plus (Free with Max)</span>
                        </Button>
                    ) : ownsPlusInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Plus Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Plus Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discountToApply = (!isCycleCovered && userActiveCredit > 0 && plusRawVal > userActiveCredit) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, plusRawVal - discountToApply)) : currentPricing.plusRaw;
                                onUpgrade('Plus Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer"
                        >
                            {(!isCycleCovered && userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit) ? (() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discounted = Math.max(1, plusRawVal - userActiveCredit);
                                return `Upgrade to Plus (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Plus (${currentPricing.plusPrice})`}
                        </Button>
                    )}
                </div>

                {/* Max Plan */}
                <div className={`bg-black text-white backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingMax && isCycleCovered ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-800'} shadow-2xl flex flex-col justify-between relative group`}>
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
                            <h3 className="text-xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">Max Plan</h3>
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
                            Basic + Plus + Max AI Suite • Unlimited access
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> All Basic + Plus features</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Full AI Document Suite & Q&A</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Handwriting recognition & OCR</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Whiteout / Redact & Digital Signatures</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Batch Scanner & Batch Compression</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> HTML/Markdown to PDF, PDF to Excel/PPT</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> 100GB Cloud Storage & 24/7 Support</li>
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
