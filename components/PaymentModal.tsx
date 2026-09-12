import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Copy, Clock, ShieldCheck, ShieldAlert,
  Loader2, CheckCircle2, AlertCircle, AlertTriangle, KeyRound, Sparkles, Crown, Zap, QrCode,
  RefreshCw, Mail, Info, ArrowRight, RotateCcw, MessageSquare, ShieldX, Download,
  LifeBuoy, Send, ArrowLeft, BanknoteArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { playPaymentApprovedAudio, playPaymentRejectedAudio, triggerPaymentApprovedConfetti } from '../lib/paymentFeedback';
import { downloadReceiptPdf } from '../src/utils/receiptPdf';
import { UpiAppIconsStrip } from './UpiBrandIcons';

export type BillingCycle = 'month' | 'half-year' | 'year';

export interface PlanPricingItem {
  amount: number;
  label: string;
  cycleShort: string;
  perDurationText: string;
  durationDays: number;
  savingsBadge?: string;
}

export const PLAN_PRICING: Record<'Plus Plan' | 'Max Plan', Record<BillingCycle, PlanPricingItem>> = {
  'Plus Plan': {
    'month': {
      amount: 50,
      label: 'Month',
      cycleShort: '1 Month',
      perDurationText: '/ month',
      durationDays: 30,
    },
    'half-year': {
      amount: 250,
      label: 'Half-Year',
      cycleShort: '6 Months',
      perDurationText: '/ 6 months',
      durationDays: 180,
      savingsBadge: 'Save ₹50',
    },
    'year': {
      amount: 500,
      label: 'Year',
      cycleShort: '1 Year',
      perDurationText: '/ year',
      durationDays: 365,
      savingsBadge: 'Save ₹100',
    },
  },
  'Max Plan': {
    'month': {
      amount: 100,
      label: 'Month',
      cycleShort: '1 Month',
      perDurationText: '/ month',
      durationDays: 30,
    },
    'half-year': {
      amount: 500,
      label: 'Half-Year',
      cycleShort: '6 Months',
      perDurationText: '/ 6 months',
      durationDays: 180,
      savingsBadge: 'Save ₹100',
    },
    'year': {
      amount: 1000,
      label: 'Year',
      cycleShort: '1 Year',
      perDurationText: '/ year',
      durationDays: 365,
      savingsBadge: 'Save ₹200',
    },
  },
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'Plus Plan' | 'Max Plan';
  amount?: string;
  billingCycle?: BillingCycle;
  onSuccess: () => void;
  defaultCurrency?: string;
  uid?: string;
  email?: string;
  userName?: string;
  forceResubmitOrderId?: string;
  isUpgradePath?: boolean;
  upgradeFromOrderId?: string;
  discountAmount?: number;
  originalAmount?: number;
  onOpenSupport?: () => void;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { code: 'EU', name: 'European Union', currency: 'EUR', symbol: '€' },
];

function generateRareOrderId(userIdentifier?: string, email?: string): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let userBadge = '';
  if (email && email.includes('@')) {
    const cleanEmail = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    userBadge = cleanEmail.slice(0, 3).padEnd(3, 'X');
  } else if (userIdentifier) {
    userBadge = userIdentifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  } else {
    userBadge = 'PX1';
  }
  
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timeHex = Date.now().toString(36).slice(-4).toUpperCase();
  return `PX-${userBadge}-${timeHex}-${rand}`;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  plan, 
  amount,
  billingCycle = 'month',
  onSuccess, 
  defaultCurrency, 
  uid,
  email,
  userName,
  forceResubmitOrderId,
  isUpgradePath,
  upgradeFromOrderId,
  discountAmount,
  originalAmount,
  onOpenSupport
}) => {
  const [currentPlan, setCurrentPlan] = useState<'Plus Plan' | 'Max Plan'>(plan || 'Plus Plan');
  const [currentCycle, setCurrentCycle] = useState<BillingCycle>(billingCycle || 'month');
  
  const [step, setStep] = useState<'form' | 'processing' | 'pending' | 'success' | 'error' | 'ticket' | 'ticket_success'>('form');
  const [copied, setCopied] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [errorMessage, setErrorMessage] = useState('');

  // Ticket / Dispute states
  const [ticketReason, setTicketReason] = useState<string>('Amount was deducted from my bank account, but marked declined');
  const [ticketNotes, setTicketNotes] = useState<string>('');
  const [ticketPhone, setTicketPhone] = useState<string>('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [orderTicketId, setOrderTicketId] = useState<string | null>(null);
  const [orderTicketStatus, setOrderTicketStatus] = useState<string | null>(null);
  
  // Real 10-Minute Timer & Guaranteed Instant Unique Order ID
  const [orderId, setOrderId] = useState<string>(() => forceResubmitOrderId || generateRareOrderId(uid, email));
  const [vpa] = useState<string>('7585813675@omni');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes = 600 seconds
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  // UTR Form state
  const [recipientEmail, setRecipientEmail] = useState<string>(() => email || localStorage.getItem('paperx_user_email') || '');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const receiptElement = document.getElementById('printable-receipt');
      const orderIdStr = orderId || 'order';
      const fileName = `PaperX_Receipt_${orderIdStr}.pdf`;

      await downloadReceiptPdf(receiptElement, fileName, {
        orderId: orderIdStr,
        plan: currentPlan || 'Plus Plan',
        billingCycle: activePricing?.cycleShort || '1 Month',
        amount: activeAmountNumber || 50,
        userName: userName || email?.split('@')[0] || 'Subscriber',
        userEmail: email,
        userUid: uid,
        createdAt: Date.now(),
        paymentMode: 'UPI (Instant)',
        utr: utrNumber || 'Verified',
        isRefunded: false,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyField = (text: string, fieldName: string) => {
    handleCopy(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualCheckStatus = async () => {
    if (!orderId || isCheckingStatus) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/payments/order/${orderId}/status`);
      if (res.ok) {
        const sData = await res.json();
        const normStatus = String(sData.status || '').toUpperCase();
        if (['COMPLETED', 'VERIFIED', 'APPROVED', 'SUCCESS', 'PAID'].includes(normStatus)) {
          setStep('success');
          playPaymentApprovedAudio();
          triggerPaymentApprovedConfetti();
        } else if (['FAILED', 'REJECTED', 'DISAPPROVED'].includes(normStatus)) {
          const rawR = sData.rejectionReason?.trim();
          const cleanReason = (rawR && !['fail', 'failed', 'rejected', 'error', 'null', 'undefined', 'utr'].includes(rawR.toLowerCase()))
            ? rawR
            : (rawR?.toLowerCase() === 'utr'
                ? 'The 12-digit UTR you entered was not found in our merchant bank account. Please check your UPI payment receipt and enter the correct 12-digit reference number.'
                : 'No matching transaction credit or funds were received in the merchant account for this 12-digit UTR.');
          setErrorMessage(cleanReason);
          playPaymentRejectedAudio();
          setStep('error');
        }
      }
    } catch (err) {
      console.warn('Manual status check:', err);
    } finally {
      setTimeout(() => setIsCheckingStatus(false), 600);
    }
  };

  const timerRef = useRef<any>(null);

  // Sync props when modal opens or plan/cycle changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPlan(plan || 'Plus Plan');
      if (billingCycle) {
        setCurrentCycle(billingCycle);
      }
      if (email) {
        setRecipientEmail(email);
      } else if (!recipientEmail) {
        const stored = localStorage.getItem('paperx_user_email') || localStorage.getItem('user_email');
        if (stored) setRecipientEmail(stored);
      }
      setUtrNumber('');
      setUtrError('');
    }
  }, [isOpen, plan, billingCycle, email]);

  // Derive active pricing config
  const activePricing: PlanPricingItem = PLAN_PRICING[currentPlan]?.[currentCycle] || PLAN_PRICING['Plus Plan']['month'];
  const regularPrice = activePricing.amount;

  // Format and resolve human-friendly explanation for rejected/declined payment
  const getRejectionDetails = (rawReason?: string) => {
    const code = (rawReason || '').trim().toLowerCase();

    if (
      !code ||
      code === 'utr' ||
      code === 'wrong utr' ||
      code === 'wrong_utr' ||
      code === 'invalid utr' ||
      code === 'invalid_utr' ||
      code === 'bad utr' ||
      code.includes('utr') ||
      code.includes('reference')
    ) {
      return {
        title: 'Wrong or Unmatched 12-Digit UTR',
        description: 'The 12-digit UTR you entered was not found in our merchant bank account. Please check your UPI payment receipt (Google Pay, PhonePe, Paytm, BHIM) and re-enter the correct 12-digit reference number.',
        isUtrIssue: true,
      };
    }

    if (code === 'fail' || code === 'failed' || code.includes('fail') || code.includes('revers')) {
      return {
        title: 'Bank Payment Failed or Reversed',
        description: 'Your bank indicated that this payment was failed or reversed back to your bank account. Please verify your banking app passbook/statement.',
        isUtrIssue: false,
      };
    }

    if (code === 'fake' || code.includes('fake') || code.includes('duplicate')) {
      return {
        title: 'Invalid or Duplicate UTR Reference',
        description: 'The submitted transaction reference is invalid or has already been used for another subscription order.',
        isUtrIssue: true,
      };
    }

    if (code.includes('mismatch')) {
      return {
        title: 'Payment Amount Mismatch',
        description: 'The amount received in our account does not match this plan price. If money was debited from your bank, please raise a ticket below.',
        isUtrIssue: false,
      };
    }

    return {
      title: 'Payment Verification Unsuccessful',
      description: rawReason || 'The submitted 12-digit UTR could not be verified with our payment gateway records.',
      isUtrIssue: true,
    };
  };
  
  // Calculate dynamic amount:
  // Discount applies when upgrading to higher value membership with past plan credit
  const isUpgradePathActive = Boolean((discountAmount && discountAmount > 0) || (forceResubmitOrderId && amount && Number(amount) < regularPrice) || (amount && Number(amount) < regularPrice));
  const calculatedDiscount = isUpgradePathActive ? Math.min(regularPrice - 1, discountAmount || (regularPrice - Number(amount || regularPrice))) : 0;
  const activeAmountNumber = forceResubmitOrderId && amount 
    ? Number(amount) 
    : (isUpgradePathActive ? Math.max(1, regularPrice - calculatedDiscount) : regularPrice);
  const formattedAmount = activeAmountNumber.toFixed(2);

  // Live Auto-Set UPI URI matching exact active amount & duration
  const activeUpiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent('PaperX Cloud')}&am=${formattedAmount}&cu=INR&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(`PaperX ${currentPlan} ${activePricing.cycleShort} ${orderId}`)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(activeUpiUri)}`;

  // Initialize and persist order session whenever opened or changed
  const syncOrderToBackend = async (freshId: string, planName: 'Plus Plan' | 'Max Plan', cycle: BillingCycle, cost: number) => {
    try {
      const cycleData = PLAN_PRICING[planName]?.[cycle] || PLAN_PRICING['Plus Plan']['month'];
      const uri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent('PaperX Cloud')}&am=${cost.toFixed(2)}&cu=INR&tr=${encodeURIComponent(freshId)}&tn=${encodeURIComponent(`PaperX ${planName} ${cycleData.cycleShort} ${freshId}`)}`;

      // Direct Firestore write for instant client persistence
      try {
        await setDoc(doc(db, 'orders', freshId), {
          orderId: freshId,
          uid: uid || 'guest_user',
          userEmail: email || '',
          userName: userName || '',
          plan: planName,
          billingCycle: cycle,
          durationDays: cycleData.durationDays,
          amount: cost,
          currency: 'INR',
          vpa,
          upiUri: uri,
          status: 'PENDING',
          isUpgradePath: isUpgradePathActive,
          upgradeFromOrderId: upgradeFromOrderId || null,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore order registration note:', fErr);
      }

      // Backend sync
      try {
        await fetch('/api/payments/order/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: uid || 'guest_user',
            userEmail: email || '',
            userName: userName || '',
            plan: planName,
            billingCycle: cycle,
            amount: cost,
            currency: 'INR',
            orderId: freshId
          })
        });
      } catch (fetchErr) {
        console.warn('Backend payment endpoint note:', fetchErr);
      }
    } catch (err: any) {
      console.warn('Payment order registration note:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrorMessage('');
      setUtrError('');
      setUtrNumber('');
      setIsExpired(false);
      setTimeLeft(600);
      
      if (defaultCurrency) {
        const country = COUNTRIES.find(c => c.currency === defaultCurrency);
        if (country) setSelectedCountry(country);
      }

      const freshId = generateRareOrderId(uid, email);
      setOrderId(freshId);

      const initialPlan = plan || 'Plus Plan';
      const initialCycle = (billingCycle || 'month') as BillingCycle;
      setCurrentPlan(initialPlan);
      setCurrentCycle(initialCycle);

      const initialPricing = PLAN_PRICING[initialPlan]?.[initialCycle] || PLAN_PRICING['Plus Plan']['month'];
      const initialPrice = amount ? Number(amount) : initialPricing.amount;

      syncOrderToBackend(freshId, initialPlan, initialCycle, initialPrice);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, uid, email, plan, billingCycle]);

  // Update order doc if plan or cycle changes during the open modal
  const handleCycleChange = (cycle: BillingCycle) => {
    setCurrentCycle(cycle);
    const newPricing = PLAN_PRICING[currentPlan][cycle];
    const newPrice = forceResubmitOrderId && amount 
      ? Number(amount) 
      : (discountAmount && discountAmount > 0 && newPricing.amount > discountAmount ? Math.max(1, newPricing.amount - discountAmount) : newPricing.amount);
    syncOrderToBackend(orderId, currentPlan, cycle, newPrice);
  };

  const handlePlanChange = (newPlan: 'Plus Plan' | 'Max Plan') => {
    setCurrentPlan(newPlan);
    const newPricing = PLAN_PRICING[newPlan][currentCycle];
    const newPrice = forceResubmitOrderId && amount 
      ? Number(amount) 
      : (discountAmount && discountAmount > 0 && newPricing.amount > discountAmount ? Math.max(1, newPricing.amount - discountAmount) : newPricing.amount);
    syncOrderToBackend(orderId, newPlan, currentCycle, newPrice);
  };

  // Real 10-Minute Countdown Timer Loop
  useEffect(() => {
    if (!isOpen || step !== 'form') return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, step, orderId]);

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.warn('Fallback copy warning:', err);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch (e) {
      fallbackCopy(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Gentle auto-redirect fallback after successful payment
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => {
      onSuccess();
      onClose();
    }, 15000);
    return () => clearTimeout(timer);
  }, [step, onSuccess, onClose]);

  // Real UTR Verification Realtime Listener & Polling Fallback
  useEffect(() => {
    if ((step !== 'pending' && step !== 'error' && step !== 'ticket') || !orderId) return;

    const handleOrderUpdate = (status: string, reason?: string, ticketId?: string, ticketStatus?: string) => {
      if (ticketId) setOrderTicketId(ticketId);
      if (ticketStatus) setOrderTicketStatus(ticketStatus);

      const normStatus = String(status || '').toUpperCase();
      if (['COMPLETED', 'VERIFIED', 'APPROVED', 'SUCCESS', 'PAID'].includes(normStatus)) {
        setStep('success');
        playPaymentApprovedAudio();
        triggerPaymentApprovedConfetti();
      } else if (['FAILED', 'REJECTED', 'DISAPPROVED'].includes(normStatus)) {
        const rawR = reason?.trim();
        const cleanReason = (rawR && !['fail', 'failed', 'rejected', 'error', 'null', 'undefined', 'utr'].includes(rawR.toLowerCase()))
          ? rawR
          : (rawR?.toLowerCase() === 'utr'
              ? 'The 12-digit UTR you entered was not found in our merchant bank account. Please check your UPI payment receipt and enter the correct 12-digit reference number.'
              : 'No matching transaction credit or funds were received in the merchant account for this 12-digit UTR.');
        setErrorMessage(cleanReason);
        playPaymentRejectedAudio();
        // Do not kick user out of ticket flow if they are writing a ticket
        setStep((prev) => (prev === 'ticket' || prev === 'ticket_success' ? prev : 'error'));
      }
    };

    // 1. Listen directly to Firestore order document (updated by Admin via Telegram or Admin Panel)
    const unsubscribeOrder = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.ticketId) setOrderTicketId(data.ticketId);
        if (data.ticketStatus) setOrderTicketStatus(data.ticketStatus);
        if (data.status) {
          handleOrderUpdate(data.status, data.rejectionReason, data.ticketId, data.ticketStatus);
        }
      }
    }, (err) => {
      console.warn('Orders snapshot listener note:', err);
    });

    // 2. Active server polling fallback (every 2s) to guarantee instant status sync for this order
    const checkOrderSync = async () => {
      try {
        const res = await fetch(`/api/payments/order/${orderId}/status`);
        if (res.ok) {
          const sData = await res.json();
          if (sData.ticketId) setOrderTicketId(sData.ticketId);
          if (sData.ticketStatus) setOrderTicketStatus(sData.ticketStatus);
          const normStatus = String(sData.status || '').toUpperCase();
          if (normStatus && normStatus !== 'PENDING') {
            handleOrderUpdate(normStatus, sData.rejectionReason, sData.ticketId, sData.ticketStatus);
          }
        }
      } catch (e) {
        // Fallback silently
      }
    };

    // Check immediately
    checkOrderSync();
    const pollInterval = setInterval(checkOrderSync, 2000);

    return () => {
      unsubscribeOrder();
      clearInterval(pollInterval);
    };
  }, [step, orderId]);

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTicket) return;
    setIsSubmittingTicket(true);
    setTicketError(null);

    try {
      const payload = {
        orderId: orderId,
        uid: uid || 'guest_user',
        userEmail: recipientEmail || email || '',
        userName: userName || 'User',
        plan: currentPlan,
        amount: activeAmountNumber,
        utr: utrNumber || '',
        orderStatus: 'REJECTED',
        reason: ticketReason || 'Amount was deducted from my bank account, but marked declined',
        notes: ticketNotes.trim(),
        payoutPhone: ticketPhone.trim()
      };

      const res = await fetch('/api/admin/tickets/raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const tid = data.ticketId || `TICK-${Date.now().toString(36).toUpperCase()}`;
        setCreatedTicketId(tid);
        setOrderTicketId(tid);
        setOrderTicketStatus('OPEN');
        setStep('ticket_success');
      } else {
        setTicketError(data.error || 'Failed to submit ticket. Please check your internet connection.');
      }
    } catch (err: any) {
      setTicketError(err.message || 'Error submitting ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setUtrError('Payment session has expired. Please re-open the payment window.');
      return;
    }

    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');
    if (!cleanUtr) {
      setUtrError('Please enter the 12-digit UTR number.');
      return;
    }

    if (!/^[0-9]{12}$/.test(cleanUtr)) {
      setUtrError('UTR must be exactly 12 numeric digits.');
      return;
    }

    const finalEmail = (email || recipientEmail || 'user@paperx.com').trim().toLowerCase();
    setUtrError('');
    setIsVerifyingUtr(true);

    // Save to localStorage for convenience
    try {
      localStorage.setItem('paperx_user_email', finalEmail);
    } catch (_) {}

    // Transition to wait screen immediately
    setStep('pending');

    try {
      // 1. Instantly update Firestore order document with UTR and verified recipient email
      await setDoc(doc(db, 'orders', orderId), {
        utr: cleanUtr,
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        orderId,
        uid: uid || 'guest_user',
        userEmail: finalEmail,
        userName: userName || finalEmail.split('@')[0] || '',
        plan: currentPlan,
        billingCycle: currentCycle,
        durationDays: activePricing.durationDays,
        amount: activeAmountNumber,
        currency: 'INR',
        isUpgradePath: isUpgradePathActive,
        upgradeFromOrderId: upgradeFromOrderId || null
      }, { merge: true });

      // 2. Trigger verification with server endpoint
      const response = await fetch('/api/payments/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          utr: cleanUtr,
          plan: currentPlan,
          billingCycle: currentCycle,
          amount: activeAmountNumber,
          uid: uid || 'guest_user',
          userEmail: finalEmail,
          userName: userName || finalEmail.split('@')[0] || '',
          isUpgradePath: isUpgradePathActive,
          upgradeFromOrderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409 || response.status === 400) {
          setErrorMessage(errorData.error || 'Invalid Payment. This UTR number is duplicate, fake, or invalid.');
          playPaymentRejectedAudio();
          setStep('error');
          return;
        }
      }
    } catch (err: any) {
      console.warn('UTR submission note:', err);
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  console.log("PaymentModal rendered, isOpen:", isOpen); if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="payment-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      >
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/90 backdrop-blur-lg" 
          onClick={onClose} 
        />

        {/* Main Dialog Box */}
        <motion.div 
          id="payment-modal"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="relative w-full max-w-md p-5 sm:p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.55)] bg-white dark:bg-stone-900 text-stone-900 dark:text-white my-auto z-10 max-h-[94vh] overflow-y-auto overflow-x-hidden flex flex-col"
        >
          
          {/* Main Payment Checkout Area */}
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'form' && (
                <motion.div 
                  key="step-form"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="h-full flex flex-col justify-between space-y-2.5"
                >
                {/* Header with Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                      {currentPlan === 'Max Plan' ? <Crown size={16} /> : <Zap size={16} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight flex items-center gap-1.5">
                        <span>Upgrade to {currentPlan}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          {activePricing.cycleShort}
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Scan UPI QR & submit 12-digit UTR
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timer Bar with Pulse Glow */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/60 shadow-sm">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={timeLeft <= 60 ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isExpired 
                          ? 'bg-red-500/10 text-red-500' 
                          : timeLeft <= 60 
                            ? 'bg-amber-500/20 text-amber-500' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Clock size={12} />
                    </motion.div>
                    <div>
                      <div className="text-[8px] uppercase font-bold text-stone-400 tracking-wider leading-none">
                        {isExpired ? 'Session Expired' : '10-Min Payment Window'}
                      </div>
                      <div className={`text-[11px] font-black font-mono leading-none mt-0.5 ${
                        isExpired ? 'text-red-500' : timeLeft <= 60 ? 'text-amber-500' : 'text-stone-900 dark:text-white'
                      }`}>
                        {isExpired ? '00:00 - Expired' : `${formatTimer(timeLeft)} remaining`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block leading-none">Amount</span>
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5 block">
                      ₹{activeAmountNumber}
                    </span>
                  </div>
                </div>

                {/* Membership Upgrade Discount Breakdown */}
                {isUpgradePathActive && calculatedDiscount > 0 && (
                  <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-amber-50/50 to-yellow-50/60 dark:from-emerald-950/40 dark:via-stone-800/60 dark:to-amber-950/30 border border-emerald-300 dark:border-emerald-700/60 text-stone-900 dark:text-white space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        {currentPlan === 'Max Plan' ? <Crown size={12} className="text-yellow-500" /> : <Zap size={12} className="text-indigo-500" />} {currentPlan} ({activePricing.cycleShort}) Standard:
                      </span>
                      <span className="line-through text-stone-400 font-bold font-mono">₹{regularPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} /> Past Membership Credit:
                      </span>
                      <span className="font-black font-mono">-₹{calculatedDiscount}</span>
                    </div>
                    <div className="pt-1 border-t border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-between text-xs font-black">
                      <span className="text-stone-800 dark:text-stone-200">Total Payable Now:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-mono font-black">₹{activeAmountNumber}</span>
                    </div>
                  </div>
                )}

                {/* Unique Rare Order ID Bar for Every User */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700/60 shadow-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 shrink-0">Order ID:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-[11px] tracking-wide truncate select-all">
                      {orderId}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleCopy(orderId)}
                    className="text-[9px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 shrink-0"
                    title="Copy Order ID"
                  >
                    <Copy size={10} />
                    <span>Copy</span>
                  </motion.button>
                </div>

                {/* Clean Dynamic QR Code Card */}
                    <div className="p-2.5 rounded-2xl bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-800/40 dark:to-stone-800/70 border border-stone-200 dark:border-stone-700/80 flex flex-col items-center justify-center text-center relative shadow-sm">
                      {isExpired && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-3 text-center"
                        >
                          <AlertTriangle size={24} className="text-red-500 mb-1" />
                          <h4 className="font-bold text-[11px] text-stone-900 dark:text-white">Session Expired</h4>
                          <p className="text-[9px] text-stone-500 dark:text-stone-400 max-w-xs mt-0.5">
                            Please re-open the payment window to start a fresh 10-minute session.
                          </p>
                        </motion.div>
                      )}

                      {/* QR Image Container */}
                      <motion.div 
                        whileHover={{ scale: 1.04 }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                        className="bg-white p-1.5 rounded-xl shadow-md border border-stone-200/90 mb-1.5 relative group"
                      >
                        <img 
                          src={qrApiUrl} 
                          alt={`UPI Payment QR Code for ₹${activeAmountNumber}`}
                          className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>

                      {/* UPI VPA Pill with 1-Click Copy */}
                      <div className="flex items-center justify-center gap-1.5 max-w-full">
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 px-2.5 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-xs select-all whitespace-nowrap">
                          {vpa}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          type="button"
                          onClick={() => handleCopy(vpa)}
                          className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
                          title="Copy UPI ID"
                        >
                          {copied ? <Check size={11} className="text-stone-950 stroke-[3]" /> : <Copy size={11} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </motion.button>
                      </div>

                      {/* Real Official UPI App Badges (Google Pay, PhonePe, Paytm, BHIM UPI) */}
                      <UpiAppIconsStrip
                        upiUri={activeUpiUri}
                        vpa={vpa}
                        payeeName="PaperX Cloud"
                        amount={formattedAmount}
                        orderId={orderId}
                        membershipName={`PaperX ${currentPlan}`}
                        billingCycle={activePricing.cycleShort}
                      />
                    </div>

                    {/* 12-Digit UTR Verification Form */}
                    <form onSubmit={handleVerifyUtr} className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[9px] sm:text-[10px] font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1">
                            <KeyRound size={10} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Enter 12-Digit UTR Number</span>
                          </label>
                          <span className="text-[8px] text-stone-400 font-medium">{utrNumber.length}/12</span>
                        </div>

                        <div className="relative">
                          <input 
                            type="text"
                            maxLength={12}
                            placeholder="e.g. 423456789012"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            disabled={isExpired || isVerifyingUtr}
                            className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all tracking-wider"
                          />
                          {utrNumber.length === 12 && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                            >
                              <CheckCircle2 size={15} />
                            </motion.div>
                          )}
                        </div>

                        {utrError && (
                          <motion.p 
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] font-bold text-red-500 mt-0.5 flex items-center gap-1"
                          >
                            <AlertCircle size={10} /> {utrError}
                          </motion.p>
                        )}
                      </div>

                      {/* High Polish Action Button */}
                      <div className="pt-2 space-y-2.5">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isExpired || isVerifyingUtr || utrNumber.length !== 12}
                          className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                        >
                          {isVerifyingUtr ? (
                            <div className="flex items-center gap-2">
                              <Loader2 size={15} className="animate-spin" />
                              <span>Verifying UTR...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 font-black">
                                <ShieldCheck size={16} className="shrink-0 text-stone-950" />
                                <span>Verify & Unlock {currentPlan} (₹{activeAmountNumber})</span>
                              </div>
                              {isUpgradePathActive && calculatedDiscount > 0 && (
                                <span className="text-[10px] font-bold text-stone-900/90 bg-black/10 dark:bg-black/25 px-2.5 py-0.5 rounded-full">
                                  ✓ ₹{calculatedDiscount} Plus Member Discount Credited
                                </span>
                              )}
                            </>
                          )}
                        </motion.button>

                        {/* Distinct Cancel Button with clear spacing */}
                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-0.5 px-1">
                          <span className="flex items-center gap-1 text-[10px] text-stone-400">
                            <Info size={11} className="text-amber-500 shrink-0" />
                            12-digit UTR is in your UPI bank receipt
                          </span>
                          <button
                            type="button"
                            onClick={onClose}
                            className="font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer hover:underline px-2 py-1 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
              </motion.div>
            )}

            {step === 'pending' && (
              <motion.div 
                key="step-pending"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Header with Close */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                        Payment Verification
                      </h3>
                      <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {orderId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated Verification Hero */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/5 to-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                  <div className="relative w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mb-3">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        className="stroke-amber-500/20"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        className="stroke-amber-500"
                        strokeWidth="3.5"
                        strokeDasharray="160"
                        strokeDashoffset="65"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 32 32"
                          to="360 32 32"
                          dur="1.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                    <Clock size={26} className="text-amber-500 animate-pulse" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                    Verifying Payment
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                    Matching your 12-digit UTR with bank records. Your {currentPlan} will unlock automatically.
                  </p>
                </div>

                {/* Structured Details Card */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Invoice Number</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-stone-900 dark:text-white">
                      <span>{orderId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(orderId, 'orderId')}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        title="Copy Invoice"
                      >
                        {copiedField === 'orderId' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Selected Plan</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {currentPlan} ({activePricing.cycleShort})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Amount Payable</span>
                    <span className="font-mono font-black text-stone-900 dark:text-white">
                      ₹{activeAmountNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Status</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Clock size={10} className="animate-spin" /> Verifying
                    </span>
                  </div>

                  {utrNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400">Submitted UTR</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-stone-900 dark:text-white">
                        <span>{utrNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyField(utrNumber, 'utr')}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          title="Copy UTR"
                        >
                          {copiedField === 'utr' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualCheckStatus}
                    disabled={isCheckingStatus}
                    className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <RefreshCw size={13} className={isCheckingStatus ? "animate-spin text-amber-500" : "text-stone-400"} />
                    <span>{isCheckingStatus ? "Checking Admin Approval..." : "Check Status Now"}</span>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Continue to Workspace</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="step-success"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                        Order Confirmed
                      </h3>
                      <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {orderId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Celebratory Hero Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2.5"
                  >
                    <Check size={30} strokeWidth={3} />
                  </motion.div>
                  <h4 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                    Payment Successful!
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                    Your account has been upgraded to <strong className="text-emerald-600 dark:text-emerald-400">{currentPlan}</strong> ({activePricing.cycleShort}).
                  </p>
                </div>

                {/* Structured Receipt Card */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Invoice Number</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-stone-900 dark:text-white">
                      <span>{orderId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(orderId, 'orderId')}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        title="Copy Invoice Number"
                      >
                        {copiedField === 'orderId' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Order Time</span>
                    <span className="font-medium text-stone-900 dark:text-white">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Payment Method</span>
                    <span className="font-medium text-stone-900 dark:text-white">
                      UPI / QR Scan
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Payment Status</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={10} strokeWidth={3} /> Successful
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Amount Paid</span>
                    <span className="font-mono font-black text-stone-900 dark:text-white text-sm">
                      ₹{activeAmountNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Plan Upgraded</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {currentPlan} ({activePricing.cycleShort})
                    </span>
                  </div>

                  {utrNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400">12-Digit UTR</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-stone-900 dark:text-white">
                        <span>{utrNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyField(utrNumber, 'utr')}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          title="Copy UTR"
                        >
                          {copiedField === 'utr' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingPDF}
                    onClick={handleDownloadPDF}
                    className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download size={15} />
                        <span>Download PDF Receipt</span>
                      </>
                    )}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <span>Start Using {currentPlan}</span>
                    <ArrowRight size={15} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div 
                key="step-error"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Header with Close */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                        Verification Failed
                      </h3>
                      <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {orderId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Hero */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 mb-2.5">
                    <X size={30} strokeWidth={3} />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                    Payment Declined
                  </h4>

                  {/* Informative Explanation about Wrong UTR / Decline Reason */}
                  {(() => {
                    const info = getRejectionDetails(errorMessage);
                    return (
                      <div className="mt-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 max-w-sm w-full text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{info.title}</span>
                        </div>
                        <p className="text-[11.5px] sm:text-xs text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                          {info.description}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* If Ticket already raised for this order */}
                {orderTicketId && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
                    <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <LifeBuoy size={15} className="text-amber-600 dark:text-amber-400" />
                        <span>Support Ticket: #{orderTicketId}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200">
                        {orderTicketStatus || 'OPEN'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
                      Your payment dispute is currently active and under manual investigation by our admin team.
                    </p>
                  </div>
                )}

                {/* Details Card */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Invoice Number</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">{orderId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Amount</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">₹{activeAmountNumber}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Status</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                      Declined
                    </span>
                  </div>

                  {utrNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400">Submitted UTR</span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">{utrNumber}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setStep('form')}
                    className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Re-enter UTR or Retry Payment</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setTicketError(null);
                      setStep('ticket');
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span className="inline-flex items-center justify-center shrink-0">
                      <BanknoteArrowDown size={17} className="text-amber-600 dark:text-amber-400" />
                    </span>
                    <span>{orderTicketId ? "View / Raise Another Ticket" : "Money Deducted? Raise a Ticket"}</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Close Window</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'ticket' && (
              <motion.div
                key="step-ticket"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('error')}
                    className="p-1.5 -ml-1 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">{orderId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <LifeBuoy size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                      Raise Payment Dispute Ticket
                    </h3>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                      Direct escalation to Admin Telegram for manual bank verification
                    </p>
                  </div>
                </div>

                {/* Ticket Form */}
                <form onSubmit={handleRaiseTicket} className="space-y-3">
                  {/* Order Context Pill */}
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px]">Plan & Amount</span>
                      <strong className="text-stone-900 dark:text-white">{currentPlan} • ₹{activeAmountNumber}</strong>
                    </div>
                    {utrNumber && (
                      <div className="text-right">
                        <span className="text-stone-500 dark:text-stone-400 block text-[10px]">Submitted UTR</span>
                        <strong className="font-mono text-stone-900 dark:text-white">{utrNumber}</strong>
                      </div>
                    )}
                  </div>

                  {/* Reason Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                      What is the issue?
                    </label>
                    <div className="space-y-1.5">
                      {[
                        "Amount was deducted from my bank account, but marked declined",
                        "Entered correct 12-digit UTR from UPI receipt",
                        "Paid via GooglePay / PhonePe / Paytm",
                        "Bank server delay / please verify bank statement",
                        "Other payment discrepancy"
                      ].map((reasonOption) => (
                        <label
                          key={reasonOption}
                          onClick={() => setTicketReason(reasonOption)}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            ticketReason === reasonOption
                              ? 'bg-amber-500/10 border-amber-500 text-stone-900 dark:text-white font-medium'
                              : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="ticketReason"
                            checked={ticketReason === reasonOption}
                            onChange={() => setTicketReason(reasonOption)}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="leading-snug">{reasonOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      Additional Notes <span className="font-normal text-stone-500">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={ticketNotes}
                      onChange={(e) => setTicketNotes(e.target.value)}
                      placeholder="e.g. Paid ₹50 at 5:15 PM from HDFC bank, debited reference 383773737389..."
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                    />
                  </div>

                  {/* Contact Phone / UPI */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                      Contact Phone / WhatsApp <span className="font-normal text-stone-500">(Optional for updates)</span>
                    </label>
                    <input
                      type="text"
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  {ticketError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{ticketError}</span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingTicket ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Dispatching Ticket to Admin...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Submit Dispute Ticket</span>
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setStep('error')}
                      className="w-full py-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'ticket_success' && (
              <motion.div
                key="step-ticket-success"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-2.5">
                    <Check size={30} strokeWidth={3} />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                    Dispute Ticket Raised!
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                    Your payment dispute has been dispatched directly to the admin operations team.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Ticket ID</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span>{createdTicketId || orderTicketId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(createdTicketId || orderTicketId || '', 'ticket')}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        title="Copy Ticket ID"
                      >
                        {copiedField === 'ticket' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Invoice Number</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">{orderId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 dark:text-stone-400">Status</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Under Admin Review
                    </span>
                  </div>

                  {utrNumber && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400">UTR / Ref</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-white">{utrNumber}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p>
                    ⚡ <strong>Admin Alert Sent:</strong> An automated escalation alert has been dispatched to our Telegram administrator team. We will reconcile with merchant bank statement within <strong>15–30 minutes</strong> and activate your plan.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Done & Close Window</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setStep('error')}
                    className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Back to Payment Status</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Printable Receipt for PDF Generation */}
          <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none w-[600px] bg-white">
            <div id="printable-receipt" className="p-4 sm:p-6 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4 sm:space-y-5 text-xs text-gray-700 dark:text-gray-300 font-sans w-full">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <h4 className="text-base font-black text-gray-900 dark:text-white font-heading tracking-tight">PaperX Cloud Suite</h4>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-wider inline-block mb-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    PAID & VERIFIED
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 block">
                    INV-{orderId}
                  </span>
                </div>
              </div>
              
              {/* Customer & Order Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Billed To</span>
                  <p className="font-bold text-gray-900 dark:text-white break-words">{userName || email?.split('@')[0] || 'Subscriber'}</p>
                  <p className="text-gray-500 text-[11px] font-mono break-all">{email || 'N/A'}</p>
                  <p className="text-gray-400 text-[10px] font-mono break-all">UID: {uid || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Transaction Details</span>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Date:</strong> {`${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Payment Mode:</strong> UPI (Instant)
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-[11px] break-all">
                    <strong>UTR / RRN:</strong> {utrNumber || 'Verified'}
                  </p>
                </div>
              </div>
              
              {/* Line Items Table */}
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3">
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Description</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <div>
                    <strong className="text-gray-900 dark:text-white">{currentPlan || 'Plus Plan'}</strong>
                    <span className="text-gray-400 text-[11px] ml-1.5">({activePricing?.cycleShort || '1 Month'} Subscription)</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    ₹{activeAmountNumber}.00
                  </span>
                </div>
              </div>
              
              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black">
                <span className="text-gray-900 dark:text-white">
                  Total Amount Paid
                </span>
                <span className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{activeAmountNumber}.00
                </span>
              </div>
              
              {/* Authorized Signatory */}
              <div className="flex justify-end pt-4 pb-2">
                <div className="text-center">
                  <div className="w-32 h-32 flex items-center justify-center -my-6 mx-auto overflow-visible">
                    <img 
                      src="/signature.png" 
                      alt="CEO Signature" 
                      className="w-full h-full object-contain mix-blend-multiply dark:invert contrast-150 grayscale -rotate-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = document.getElementById('signature-fallback-modal');
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <div id="signature-fallback-modal" className="hidden font-serif italic text-xl text-gray-800 dark:text-gray-200" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                      PaperX CEO
                    </div>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-600 w-32 mx-auto pt-1 relative z-10">
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Authorized Signatory</p>
                    <p className="text-[9px] text-gray-500">Chief Executive Officer</p>
                  </div>
                </div>
              </div>
              
              {/* Footer Stamp */}
              <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                This is an official and real electronically generated receipt. No GST or government tax information is applicable. <br />
                Support email: <strong className="text-gray-600 dark:text-gray-300">paperx.assist@gmail.com</strong>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
