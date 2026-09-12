import React, { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Download, 
  Ticket, 
  ShieldCheck, 
  Search, 
  ArrowUpRight, 
  FileText, 
  Info, 
  ExternalLink,
  ChevronRight,
  Printer,
  Mail,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Zap,
  Crown,
  User as UserIcon,
  Phone,
  Wallet,
  QrCode,
  UploadCloud,
  X,
  ArrowLeft,
  RotateCcw,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { downloadReceiptPdf } from '../src/utils/receiptPdf';
import { 
  User, 
  READYMADE_TICKET_REASONS, 
  isOrderAwaitingLongTime, 
  getOrderWaitMinutes, 
  getOrderTimestamp,
  ReadyMadeTicketReason 
} from '../types';

export interface PaymentOrder {
  id: string;
  orderId?: string;
  uid?: string;
  userEmail?: string;
  userName?: string;
  plan?: string;
  billingCycle?: string;
  durationDays?: number;
  amount?: number;
  currency?: string;
  status: 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'SUCCESS' | 'REJECTED' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  utr?: string;
  isRefunded?: boolean;
  createdAt?: string | number;
  submittedAt?: string | number;
  verifiedAt?: string | number;
  rejectedAt?: string | number;
  rejectionReason?: string;
  vpa?: string;
  upiUri?: string;
  ticketId?: string;
  ticketStatus?: string;
  ticketReason?: string;
}

interface PaymentHistoryViewProps {
  user: User | null;
  onUpgrade?: (plan: 'Plus Plan' | 'Max Plan', amount?: number, cycle?: any, upgradeFromId?: string, oldAmount?: number) => void;
  onResubmitPayment?: (order: PaymentOrder) => void;
  onOpenBilling?: () => void;
  onOpenSupport?: () => void;
  onRefundDowngrade?: () => void;
}

export const isOrderRefunded = (order: PaymentOrder | null | undefined): boolean => {
  if (!order) return false;
  if (order.isRefunded || order.status === 'REFUNDED') return true;
  if (order.ticketStatus === 'COMPLETED' && order.ticketReason) {
    const reason = order.ticketReason.toLowerCase();
    return reason.includes('refund') || reason.includes('payout') || reason.includes('money back');
  }
  return false;
};

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({
  user,
  onUpgrade,
  onResubmitPayment,
  onOpenBilling,
  onOpenSupport,
  onRefundDowngrade
}) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!selectedOrderForInvoice) return;
    setIsGeneratingPDF(true);
    
    try {
      const receiptElement = document.getElementById('printable-receipt');
      const orderIdStr = selectedOrderForInvoice.orderId || selectedOrderForInvoice.id || 'order';
      const fileName = `PaperX_Receipt_${orderIdStr}.pdf`;

      await downloadReceiptPdf(receiptElement, fileName, {
        orderId: orderIdStr,
        plan: selectedOrderForInvoice.plan || 'Plus Plan',
        billingCycle: selectedOrderForInvoice.billingCycle || 'Monthly',
        amount: selectedOrderForInvoice.amount || 50,
        userName: user?.name || user?.email?.split('@')[0] || 'Subscriber',
        userEmail: user?.email,
        userUid: user?.uid,
        createdAt: selectedOrderForInvoice.createdAt,
        paymentMode: 'UPI (Instant)',
        utr: selectedOrderForInvoice.utr || 'Verified',
        isRefunded: isOrderRefunded(selectedOrderForInvoice),
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'policy'>('ledger');
  const [showRefundPolicy, setShowRefundPolicy] = useState<boolean>(false);

  // Ticket Modal State
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<PaymentOrder | null>(null);
  const [ticketReason, setTicketReason] = useState('Amount debited from Bank / UPI, but order is marked Rejected');
  const [ticketNotes, setTicketNotes] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<{ type: 'success' | 'error'; message: string; ticketId?: string } | null>(null);

  // Open Ticket Modal with real ready-made reason tailored to order status (Rejected vs Awaiting Long Time)
  const openTicketModal = (order: PaymentOrder) => {
    setSelectedOrderForTicket(order);
    const isRej = order.status === 'REJECTED' || order.status === 'FAILED' || order.status === 'EXPIRED';
    const reasons = isRej ? READYMADE_TICKET_REASONS.REJECTED : READYMADE_TICKET_REASONS.AWAITING_LONG;
    setTicketReason(reasons[0].title);
    setTicketNotes('');
    setTicketFeedback(null);
  };

  // Invoice / Receipt Modal State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<PaymentOrder | null>(null);

  // UTR Resubmission Form State (for rejected or review orders)
  const [resubmittingOrderMap, setResubmittingOrderMap] = useState<Record<string, string>>({});
  const [isSubmittingResubmit, setIsSubmittingResubmit] = useState<string | null>(null);
  const [resubmitFeedbackMap, setResubmitFeedbackMap] = useState<Record<string, { type: 'success' | 'error'; message: string } | null>>({});

  // Refund Request Modal State
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<PaymentOrder | null>(null);
  const [showConfirmRefundModal, setShowConfirmRefundModal] = useState(false);
  const [refundName, setRefundName] = useState('');
  const [refundPhone, setRefundPhone] = useState('');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [refundQrBase64, setRefundQrBase64] = useState('');
  const [qrFileName, setQrFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundFeedback, setRefundFeedback] = useState<{ type: 'success' | 'error'; message: string; ticketId?: string } | null>(null);

  const openRefundModal = (order: PaymentOrder) => {
    setSelectedOrderForRefund(order);
    setShowConfirmRefundModal(false);
    setRefundName(user?.name || user?.email?.split('@')[0] || '');
    setRefundPhone('');
    setRefundUpiId('');
    setRefundQrBase64('');
    setQrFileName('');
    setRefundReason('');
    setRefundFeedback(null);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle instant 12-digit UTR resubmission
  const handleResubmitUtr = async (order: PaymentOrder, inputUtr: string) => {
    const cleanUtr = String(inputUtr || '').trim().replace(/\D/g, '');
    const orderId = order.orderId || order.id;

    if (!cleanUtr || cleanUtr.length !== 12) {
      setResubmitFeedbackMap(prev => ({
        ...prev,
        [orderId]: { type: 'error', message: 'Please enter a valid 12-digit numeric UPI UTR / Reference ID.' }
      }));
      return;
    }

    setIsSubmittingResubmit(orderId);
    setResubmitFeedbackMap(prev => ({ ...prev, [orderId]: null }));

    try {
      const res = await fetch('/api/payments/resubmit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          utr: cleanUtr,
          uid: user?.uid || order.uid,
          userEmail: user?.email || order.userEmail,
          userName: user?.name || order.userName,
          plan: order.plan,
          billingCycle: order.billingCycle
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResubmitFeedbackMap(prev => ({
          ...prev,
          [orderId]: { 
            type: 'success', 
            message: '✅ Corrected 12-digit UTR submitted! Telegram Admin has been notified for priority verification.' 
          }
        }));

        // Optimistically update order in state
        setOrders(prev => prev.map(o => {
          if ((o.orderId || o.id) === orderId) {
            return {
              ...o,
              utr: cleanUtr,
              status: 'PENDING',
              rejectionReason: undefined,
              rejectionCode: undefined as any,
              submittedAt: new Date().toISOString()
            };
          }
          return o;
        }));
      } else {
        setResubmitFeedbackMap(prev => ({
          ...prev,
          [orderId]: { type: 'error', message: data.error || 'Failed to submit UTR. Please check the digits and try again.' }
        }));
      }
    } catch (err: any) {
      setResubmitFeedbackMap(prev => ({
        ...prev,
        [orderId]: { type: 'error', message: err.message || 'Network error submitting UTR. Please try again.' }
      }));
    } finally {
      setIsSubmittingResubmit(null);
    }
  };

  // Sanitize and deduplicate orders list (removes ghost drafts, merges matching UTRs, protects REJECTED status)
  const sanitizeOrdersList = (rawOrders: PaymentOrder[]): PaymentOrder[] => {
    const map = new Map<string, PaymentOrder>();
    const now = Date.now();

    // Index by ID first, merging fields cleanly
    for (const o of rawOrders) {
      const id = o.orderId || o.id;
      if (!id) continue;
      const existing = map.get(id);
      map.set(id, { ...existing, ...o, id, orderId: id });
    }

    const all = Array.from(map.values());
    const submittedTimes: number[] = [];

    for (const ord of all) {
      const isFinal = ord.status === 'VERIFIED' || ord.status === 'COMPLETED' || ord.status === 'SUCCESS' || ord.status === 'REJECTED';
      if (ord.utr || isFinal) {
        const t = new Date(ord.createdAt || ord.submittedAt || 0).getTime();
        if (t > 0) submittedTimes.push(t);
      }
    }

    // Filter out unsubmitted phantom drafts that were never submitted
    const filtered = all.filter((ord) => {
      const hasUtr = typeof ord.utr === 'string' && ord.utr.trim().length >= 8;
      const isFinalized = ord.status === 'VERIFIED' || ord.status === 'COMPLETED' || ord.status === 'SUCCESS' || ord.status === 'REJECTED' || ord.status === 'FAILED';
      const createdTime = new Date(ord.createdAt || ord.submittedAt || 0).getTime();
      const ageMs = now - createdTime;

      if (hasUtr || isFinalized) return true;

      // Drop ghost drafts created around the same time as a real submitted order
      const isGhostNearReal = submittedTimes.some(st => Math.abs(st - createdTime) < 2 * 60 * 1000);
      if (isGhostNearReal) return false;

      // Drop expired unsubmitted sessions
      if (ageMs > 10 * 60 * 1000) return false;

      return true;
    });

    // Deduplicate by UTR or ID to ensure absolute uniqueness
    const utrMap = new Map<string, PaymentOrder>();
    const nonUtrOrders: PaymentOrder[] = [];

    for (const ord of filtered) {
      if (ord.utr && typeof ord.utr === 'string' && ord.utr.trim().length >= 8) {
        const cleanUtr = ord.utr.trim();
        if (utrMap.has(cleanUtr)) {
          const prev = utrMap.get(cleanUtr)!;
          // Priority: VERIFIED (3) > REJECTED (2) > PENDING (1)
          const prevScore = (prev.status === 'VERIFIED' || prev.status === 'COMPLETED' || prev.status === 'SUCCESS') ? 3 : (prev.status === 'REJECTED' ? 2 : 1);
          const curScore = (ord.status === 'VERIFIED' || ord.status === 'COMPLETED' || ord.status === 'SUCCESS') ? 3 : (ord.status === 'REJECTED' ? 2 : 1);
          if (curScore >= prevScore) {
            utrMap.set(cleanUtr, { ...prev, ...ord });
          }
        } else {
          utrMap.set(cleanUtr, ord);
        }
      } else {
        nonUtrOrders.push(ord);
      }
    }

    const result = [...Array.from(utrMap.values()), ...nonUtrOrders];

    return result.sort((a, b) => {
      const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || a.submittedAt || 0).getTime();
      const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || b.submittedAt || 0).getTime();
      return tB - tA;
    });
  };

  // Fetch from Server API as reliable sync layer
  const fetchServerOrders = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/payments/user-orders?uid=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(user.email || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders((prev) => sanitizeOrdersList([...prev, ...data.orders]));
        }
      }
    } catch (err) {
      console.warn('Backend payment history fetch note:', err);
    }
  }, [user?.uid, user?.email]);

  // Primary Real-time Firestore Listener + Background Sync
  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: PaymentOrder[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, orderId: docSnap.id, ...docSnap.data() } as PaymentOrder);
      });

      setOrders(sanitizeOrdersList(fetched));
      setLoading(false);
    }, (err) => {
      console.warn('Firestore orders real-time listener notice:', err);
      // Fallback to server endpoint
      fetchServerOrders().finally(() => setLoading(false));
    });

    // Also call server endpoint initially to merge any non-uid indexed records
    fetchServerOrders();

    // Set real-time background sync interval (every 4 seconds) to guarantee instant Telegram Admin action sync
    const syncInterval = setInterval(() => {
      fetchServerOrders();
    }, 4000);

    // Listen to custom window events for immediate refresh
    const handleSyncEvent = () => {
      fetchServerOrders();
    };
    window.addEventListener('order-updated', handleSyncEvent);
    window.addEventListener('admin_action', handleSyncEvent);
    window.addEventListener('ticket-updated', handleSyncEvent);
    window.addEventListener('refresh_payments', handleSyncEvent);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
      window.removeEventListener('order-updated', handleSyncEvent);
      window.removeEventListener('admin_action', handleSyncEvent);
      window.removeEventListener('ticket-updated', handleSyncEvent);
      window.removeEventListener('refresh_payments', handleSyncEvent);
    };
  }, [user?.uid, fetchServerOrders]);

  // Manual Refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchServerOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Submit Support Ticket to PaperX Team
  const handleRaiseTicket = async () => {
    if (!selectedOrderForTicket || !user?.uid) return;

    setIsSubmittingTicket(true);
    setTicketFeedback(null);

    try {
      const payload = {
        orderId: selectedOrderForTicket.orderId || selectedOrderForTicket.id,
        uid: user.uid,
        userEmail: user.email || '',
        userName: user.name || user.email?.split('@')[0] || 'User',
        plan: selectedOrderForTicket.plan || 'Plus Plan',
        amount: selectedOrderForTicket.amount || 50,
        utr: selectedOrderForTicket.utr || '',
        orderStatus: selectedOrderForTicket.status || 'PENDING',
        reason: ticketReason,
        notes: ticketNotes.trim()
      };

      const res = await fetch('/api/admin/tickets/raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTicketFeedback({
          type: 'success',
          ticketId: data.ticketId || `TICK-${Date.now().toString(36).toUpperCase()}`,
          message: data.message || 'Support ticket dispatched to PaperX Team. Priority verification is now in progress.'
        });
        // Optimistically update order
        setOrders(prev => prev.map(o => {
          if ((o.orderId || o.id) === (selectedOrderForTicket.orderId || selectedOrderForTicket.id)) {
            return { ...o, ticketId: data.ticketId, ticketStatus: 'OPEN' };
          }
          return o;
        }));
      } else {
        setTicketFeedback({
          type: 'error',
          message: data.error || 'Failed to submit ticket. Please check your network and try again.'
        });
      }
    } catch (err: any) {
      setTicketFeedback({
        type: 'error',
        message: err.message || 'Error communicating with support service.'
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleProceedToConfirm = () => {
    if (!selectedOrderForRefund) return;
    if (!refundName.trim() || !refundPhone.trim() || !refundUpiId.trim()) {
      setRefundFeedback({
        type: 'error',
        message: 'Please fill in Name, Phone Number, and UPI ID to receive the payout.'
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(refundPhone.trim())) {
      setRefundFeedback({
        type: 'error',
        message: 'Invalid Phone Number: Please enter exactly a 10-digit mobile number (e.g. 9876543210).'
      });
      return;
    }

    const upiRegex = /^[\w.-]{2,50}@[a-zA-Z0-9.-]{2,30}$/;
    if (!upiRegex.test(refundUpiId.trim())) {
      setRefundFeedback({
        type: 'error',
        message: 'Invalid UPI ID format: Must be in standard username@handle format (e.g. name@paytm, 9876543210@ybl).'
      });
      return;
    }

    // Verify refund eligibility: < 10 features/documents used and within 2 days
    if (selectedOrderForRefund) {
      const orderTime = getOrderTimestamp(selectedOrderForRefund);
      // 2-day guarantee: Within 2 calendar days or up to 72 hours for fair timezone/hour tolerance
      const isWithin2Days = orderTime && ((Date.now() - orderTime) <= 3 * 24 * 60 * 60 * 1000 || Math.floor((Date.now() - orderTime) / (24 * 60 * 60 * 1000)) <= 2);
      const featureUsage = Math.max(Number((user as any)?.featureUsageCount || 0), Number((user as any)?.projectsUsed || 0));
      const isEligibleUsage = featureUsage < 10;

      if (!isWithin2Days || !isEligibleUsage) {
        let errDesc = '';
        if (!isWithin2Days && !isEligibleUsage) {
          errDesc = 'exceeded 2 days limit & 10 feature usages';
        } else if (!isWithin2Days) {
          errDesc = 'exceeded 2 days limit since purchase';
        } else {
          errDesc = `exceeded 10 feature operations (${featureUsage}/10 used)`;
        }
        setRefundFeedback({
          type: 'error',
          message: `Refund Not Eligible (${errDesc}): Refunds are strictly valid only for accounts with less than 10 feature operations and requested within 2 days of payment.`
        });
        return;
      }
    }

    setRefundFeedback(null);
    setShowConfirmRefundModal(true);
  };

  // Submit Refund Request Ticket to PaperX Team / Admin
  const handleRequestRefund = async () => {
    if (!selectedOrderForRefund || !user?.uid) return;

    if (!refundName.trim() || !refundPhone.trim() || !refundUpiId.trim()) {
      setRefundFeedback({
        type: 'error',
        message: 'Please fill in Name, Phone Number, and UPI ID to receive the payout.'
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(refundPhone.trim())) {
      setRefundFeedback({
        type: 'error',
        message: 'Invalid Phone Number: Please enter exactly a 10-digit mobile number (e.g. 9876543210).'
      });
      return;
    }

    const upiRegex = /^[\w.-]{2,50}@[a-zA-Z0-9.-]{2,30}$/;
    if (!upiRegex.test(refundUpiId.trim())) {
      setRefundFeedback({
        type: 'error',
        message: 'Invalid UPI ID format: Must be in standard username@handle format (e.g. name@paytm, 9876543210@ybl).'
      });
      return;
    }

    // Verify refund eligibility: < 10 features/documents used and within 2 days
    const orderTime = getOrderTimestamp(selectedOrderForRefund);
    // 2-day guarantee: Within 2 calendar days or up to 72 hours for fair timezone/hour tolerance
    const isWithin2Days = orderTime && ((Date.now() - orderTime) <= 3 * 24 * 60 * 60 * 1000 || Math.floor((Date.now() - orderTime) / (24 * 60 * 60 * 1000)) <= 2);
    const featureUsage = Math.max(Number((user as any)?.featureUsageCount || 0), Number((user as any)?.projectsUsed || 0));
    const isEligibleUsage = featureUsage < 10;

    if (!isWithin2Days || !isEligibleUsage) {
      setRefundFeedback({
        type: 'error',
        message: 'Refund Not Eligible: You must have used less than 10 feature operations or documents, and requested within 2 days of purchase.'
      });
      return;
    }

    setIsSubmittingRefund(true);
    setRefundFeedback(null);

    try {
      const payload = {
        orderId: selectedOrderForRefund.orderId || selectedOrderForRefund.id,
        uid: user.uid,
        userEmail: user.email || '',
        userName: user.name || user.email?.split('@')[0] || 'User',
        plan: selectedOrderForRefund.plan || 'Plus Plan',
        amount: selectedOrderForRefund.amount || 50,
        utr: selectedOrderForRefund.utr || '',
        orderStatus: selectedOrderForRefund.status || 'SUCCESS',
        reason: 'Refund requested under 2-day membership guarantee (<10 feature operations)',
        notes: `REFUND PAYOUT DETAILS:\n- Name: ${refundName.trim()}\n- Phone: ${refundPhone.trim()}\n- UPI ID: ${refundUpiId.trim()}\n- QR Code uploaded: ${qrFileName ? 'Yes (' + qrFileName + ')' : 'No'}${refundReason.trim() ? '\n- Additional Context: ' + refundReason.trim() : ''}`,
        upiId: refundUpiId.trim(),
        payoutPhone: refundPhone.trim(),
        payoutName: refundName.trim(),
        qrCodeBase64: refundQrBase64
      };

      const res = await fetch('/api/admin/tickets/raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRefundFeedback({
          type: 'success',
          ticketId: data.ticketId || `TICK-${Date.now().toString(36).toUpperCase()}`,
          message: data.message || 'Refund Request successfully submitted! Your account has automatically and smoothly reverted to the Basic 5-day Plan, and payout will arrive to your UPI.'
        });

        // Optimistically update order to REFUNDED
        setOrders(prev => prev.map(o => {
          if ((o.orderId || o.id) === (selectedOrderForRefund.orderId || selectedOrderForRefund.id)) {
            return { ...o, ticketId: data.ticketId, ticketStatus: 'COMPLETED', status: 'REFUNDED', ticketReason: 'Refund requested under 2-day membership guarantee (<10 feature operations)' };
          }
          return o;
        }));

        // Instant smooth transition to Basic 5-day Plan
        if (onRefundDowngrade) {
          onRefundDowngrade();
        }

        // Direct Firestore ledger write for consistency
        try {
          const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
          const fiveDaysExpiresAt = new Date(Date.now() + fiveDaysMs).toISOString();
          await setDoc(doc(db, 'users', user.uid), {
            plan: 'Basic Plan',
            purchasedPlan: 'Basic Plan',
            activePlanMode: 'Basic Plan',
            isPro: false,
            isRefunded: true,
            membershipTier: 'free',
            billingCycle: 'month',
            planExpiresAt: fiveDaysExpiresAt,
            maxProjects: 5,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Direct refund downgrade write note:', dbErr);
        }
      } else {
        setRefundFeedback({
          type: 'error',
          message: data.error || 'Failed to submit refund request. Please try again.'
        });
      }
    } catch (err: any) {
      setRefundFeedback({
        type: 'error',
        message: err.message || 'Error communicating with support service.'
      });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleRefundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processRefundFile(file);
    }
  };

  const processRefundFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setRefundFeedback({
        type: 'error',
        message: 'Wrong UPI QR format: Please upload a valid image file (PNG, JPEG, WEBP) containing your UPI QR code.'
      });
      return;
    }
    setRefundFeedback(null);
    setQrFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setRefundQrBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRefundDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleRefundDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processRefundFile(e.dataTransfer.files[0]);
    }
  };

  const handleRefundPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const itemType = items[i].type;
        if (itemType && typeof itemType === 'string' && itemType.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processRefundFile(file);
            break;
          }
        }
      }
    }
  };

  // Filter & Search
  const filteredOrders = orders.filter((order) => {
    const isSuccess = order.status === 'VERIFIED' || order.status === 'COMPLETED' || order.status === 'SUCCESS';
    const isPending = order.status === 'PENDING';
    const isRejected = order.status === 'REJECTED' || order.status === 'FAILED' || order.status === 'EXPIRED';

    if (statusFilter === 'VERIFIED' && !isSuccess) return false;
    if (statusFilter === 'PENDING' && !isPending) return false;
    if (statusFilter === 'REJECTED' && !isRejected) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const oid = (order.orderId || order.id || '').toLowerCase();
      const utr = (order.utr || '').toLowerCase();
      const plan = (order.plan || '').toLowerCase();
      return oid.includes(q) || utr.includes(q) || plan.includes(q);
    }

    return true;
  });

  const verifiedCount = orders.filter(o => o.status === 'VERIFIED' || o.status === 'COMPLETED' || o.status === 'SUCCESS').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const rejectedCount = orders.filter(o => o.status === 'REJECTED' || o.status === 'FAILED' || o.status === 'EXPIRED').length;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-6 overflow-x-hidden min-w-0">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800 mb-6 px-1 sm:px-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-sm shrink-0">
              <Receipt size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white font-heading tracking-tight truncate">
                Payment History & Orders
              </h1>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => setShowRefundPolicy(!showRefundPolicy)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Info size={14} />
            <span>{showRefundPolicy ? "Hide Refund Policy" : "View Upgrade & Refund Policy"}</span>
          </button>
        </div>
      </div>

       {showRefundPolicy && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Welcome Card */}
          <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold font-heading text-sm">2-Day Upgrade Refund Guarantee</h3>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-700/95 dark:text-emerald-300/90 leading-relaxed">
              We want to make sure your learning or professional workspace fits you perfectly. If you subscribed to a membership plan and decided to upgrade to a higher tier membership within <strong>2 days (48 hours)</strong>, we will issue a full, seamless refund on your original plan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline details */}
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                <Clock className="text-emerald-500" size={18} />
                <h4 className="font-bold text-xs">Refund Processing Timeline</h4>
              </div>

              <div className="relative pl-6 border-l border-emerald-100 dark:border-emerald-950/30 space-y-4 text-xs">
                {/* Stage 1 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-bold">1</div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-xs">Ticket Submission (Instant)</h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Submit your payout request. Include your name, active UPI ID (VPA), and the associated Order ID.
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-bold">2</div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-xs">Verification & Processing (1-12 Hours)</h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Our billing desk cross-references your transaction records and links the order to ensure instant clearance.
                  </p>
                </div>

                {/* Stage 3 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-bold">3</div>
                  <h5 className="font-bold text-gray-900 dark:text-white text-xs">Bank Settlement (Within 24 Hours)</h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    The refund is approved and transferred directly back to your provided bank account or UPI VPA address.
                  </p>
                </div>
              </div>
            </div>

            {/* Documentation Requirements */}
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                <FileText className="text-emerald-500" size={18} />
                <h4 className="font-bold text-xs">Documentation Requirements</h4>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-xs">UPI Payment Address (VPA)</h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      A valid UPI identifier linked to your bank account (e.g., name@upi or phone@paytm) is required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-xs">Full Name & Phone Number</h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Your legal holder name registered with the banking app or interface to guarantee secure matching.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-xs">Optional Payment QR Code</h5>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Drag-and-drop or copy-paste your personal UPI QR code to bypass text matching and fast-track processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showRefundPolicy && (
        <>
          {/* Orders List / Empty State */}
          {loading ? (
        <div className="py-20 text-center">
          <RefreshCw size={28} className="animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Loading payment ledger from Firestore...</p>
          <p className="text-xs text-gray-400 mt-1">Connecting to real-time sync channel</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 text-center bg-gray-50/50 dark:bg-gray-800/30">
          <Receipt size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-base font-black text-gray-900 dark:text-white font-heading">
            No payment records found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto mb-6">
            You have not initiated or submitted any UPI subscription payments for this account yet.
          </p>

          <div className="flex items-center justify-center gap-3">
            {onUpgrade && (
              <button
                onClick={() => onUpgrade('Plus Plan', 50, 'month')}
                className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <span>Upgrade to Plus (₹50)</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isSuccess = order.status === 'VERIFIED' || order.status === 'COMPLETED' || order.status === 'SUCCESS';
            const isPending = order.status === 'PENDING';
            const isRejected = order.status === 'REJECTED' || order.status === 'FAILED' || order.status === 'EXPIRED';
            const isAwaitingLong = isOrderAwaitingLongTime(order, 10);
            const waitMins = getOrderWaitMinutes(order);

            const orderIdStr = order.orderId || order.id || 'N/A';
            const formattedDate = order.createdAt 
              ? (typeof order.createdAt === 'number' ? new Date(order.createdAt).toLocaleString() : new Date(order.createdAt).toLocaleString())
              : 'Recent';

            return (
              <div
                key={orderIdStr}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 w-full max-w-full overflow-hidden min-w-0 ${
                  order.ticketId && order.ticketStatus !== 'RESOLVED'
                    ? 'bg-white dark:bg-gray-900 border-blue-200/80 dark:border-blue-800/50 shadow-sm'
                    : isSuccess
                    ? 'bg-white dark:bg-gray-900 border-emerald-200/80 dark:border-emerald-800/50 shadow-sm'
                    : isPending
                    ? 'bg-white dark:bg-gray-900 border-amber-200/80 dark:border-amber-800/50 shadow-sm'
                    : 'bg-white dark:bg-gray-900 border-red-200/80 dark:border-red-800/50 shadow-sm'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 min-w-0">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className={`p-2 sm:p-2.5 rounded-2xl shrink-0 ${
                      order.ticketId && order.ticketStatus !== 'RESOLVED'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : isSuccess
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : isPending
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    }`}>
                      {order.ticketId ? <Ticket size={18} className={order.ticketStatus === 'PROCESSING' ? 'animate-pulse' : ''} /> : isSuccess ? <CheckCircle2 size={18} /> : isPending ? <Clock size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span className="font-black text-gray-900 dark:text-white text-sm sm:text-base font-heading">
                          {order.plan || 'Plan Subscription'}
                        </span>
                        {order.billingCycle && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {order.billingCycle}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          order.ticketId && order.ticketStatus !== 'RESOLVED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                            : isSuccess
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                        }`}>
                          {isPending && !order.ticketId && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />}
                          {order.ticketId && order.ticketStatus !== 'RESOLVED'
                            ? (order.ticketStatus === 'PROCESSING' ? 'Refund Processing' : 'Manual Review / Dispute')
                            : isSuccess 
                            ? 'Verified / Active' 
                            : isPending 
                            ? (isAwaitingLong ? `Awaiting Verification (${waitMins}m)` : 'Under Verification') 
                            : 'Invalid Payment / Rejected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 min-w-0 flex-wrap">
                        <span className="text-[11px] sm:text-xs font-mono text-gray-400 truncate max-w-full">
                          Order ID: <strong className="text-gray-700 dark:text-gray-300 select-all">{orderIdStr}</strong>
                        </span>
                        <button
                          onClick={() => handleCopy(orderIdStr, `oid_${orderIdStr}`)}
                          className="text-gray-400 hover:text-black dark:hover:text-white transition cursor-pointer shrink-0"
                          title="Copy Order ID"
                        >
                          {copiedId === `oid_${orderIdStr}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-1 sm:pt-0">
                    <span className="text-base sm:text-xl font-black text-gray-900 dark:text-white font-heading">
                      ₹{order.amount || (order.plan === 'Max Plan' ? 100 : 50)}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400">{formattedDate}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 py-3 sm:py-4 text-xs min-w-0">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-0 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5 truncate">12-Digit UPI UTR</span>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 select-all truncate break-all">
                        {order.utr || 'Not submitted'}
                      </span>
                      {order.utr && (
                        <button
                          onClick={() => handleCopy(order.utr!, `utr_${orderIdStr}`)}
                          className="text-gray-400 hover:text-black dark:hover:text-white transition cursor-pointer shrink-0"
                          title="Copy UTR"
                        >
                          {copiedId === `utr_${orderIdStr}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-0 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5 truncate">Merchant & VPA</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 break-words block text-[11px] sm:text-xs">
                      PaperX Cloud (<strong className="font-mono text-[10px] sm:text-[11px]">7585813675@omni</strong>)
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-0 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5 truncate">Dispute / Support Status</span>
                    <span className={`font-bold break-words block text-[11px] sm:text-xs ${
                      order.ticketId && order.ticketStatus !== 'RESOLVED'
                        ? 'text-blue-600 dark:text-blue-400'
                        : isSuccess
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isPending
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {order.ticketId && order.ticketStatus !== 'RESOLVED'
                        ? `Ticket Raised (${order.ticketId})` 
                        : isSuccess 
                        ? 'Membership Activated' 
                        : isPending 
                        ? (isAwaitingLong ? `Awaiting (${waitMins}m)` : 'Reviewing') 
                        : 'Payment Rejected'}
                    </span>
                  </div>
                </div>

                {/* Refund Request Real-Time Status Tracker */}
                {order.ticketId && order.ticketStatus !== 'RESOLVED' && (order.ticketReason?.toLowerCase().includes('refund') || order.ticketReason?.toLowerCase().includes('upgrade')) && (() => {
                  const status = order.ticketStatus || 'OPEN';
                  // Stages: 0: Pending, 1: Processing, 2: Completed, 3: Error/Rejected
                  let activeStep = 0;
                  let isError = false;
                  let errorType: 'WRONG_INFO' | 'NOT_VALID' | null = null;

                  if (status === 'PROCESSING' || status === 'IN_PROGRESS' || status === 'UNDER_REVIEW') {
                    activeStep = 1;
                  } else if (status === 'COMPLETED' || status === 'RESOLVED' || status === 'REFUNDED') {
                    activeStep = 2;
                  } else if (status === 'REJECTED_WRONG_INFO') {
                    activeStep = 2;
                    isError = true;
                    errorType = 'WRONG_INFO';
                  } else if (status === 'REJECTED_NOT_VALID') {
                    activeStep = 2;
                    isError = true;
                    errorType = 'NOT_VALID';
                  }

                  return (
                    <div className={`mb-4 p-4 border rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 ${
                      isError 
                        ? 'bg-red-50/40 dark:bg-red-950/25 border-red-200/50 dark:border-red-900/40' 
                        : 'bg-amber-50/40 dark:bg-amber-950/25 border-amber-200/50 dark:border-amber-900/40'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          {isError ? (
                            <AlertCircle size={13} className="text-red-600 dark:text-red-400" />
                          ) : (
                            <RefreshCw size={13} className={`${activeStep === 1 ? 'animate-spin' : ''} ${
                              activeStep === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`} />
                          )}
                          <span className={`text-xs font-bold ${isError ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'}`}>
                            Refund Status
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                          isError 
                            ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60' 
                            : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60'
                        }`}>
                          Ticket #{order.ticketId}
                        </span>
                      </div>

                      <div className="relative grid grid-cols-3 px-2 mb-6 mt-2">
                        {/* Progress Background Line Container */}
                        <div className="absolute left-[16.66%] right-[16.66%] top-[14px] -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-800 z-0 overflow-hidden rounded-full">
                          {/* Progress Active Line - Constrained to parent bounds */}
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${
                              isError ? 'bg-red-500' : 'bg-emerald-500'
                            }`} 
                            style={{ 
                              width: activeStep === 0 ? '0%' : activeStep === 1 ? '50%' : '100%' 
                            }}
                          />
                        </div>

                        {/* Step 1: Pending */}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                            activeStep >= 0 
                              ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100 dark:ring-emerald-950/30' 
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            ✓
                          </div>
                          <span className="text-[10px] font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                            Pending
                          </span>
                          <span className="text-[8px] text-gray-400 dark:text-gray-500 block text-center max-w-[70px] mt-0.5 leading-none">
                            Reviewing details
                          </span>
                        </div>

                        {/* Step 2: Processing OR Error (Rejection) */}
                        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ease-in-out ${activeStep === 1 || isError ? 'scale-105' : 'scale-100'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ease-in-out ${
                            isError 
                              ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 dark:ring-red-950/40'
                              : activeStep >= 1 
                              ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-50'
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
                          }`}>
                            {isError ? '!' : (activeStep >= 1 ? '✓' : '2')}
                          </div>
                          <span className={`text-[10px] font-bold mt-1 transition-colors duration-500 ${
                            isError 
                              ? 'text-red-600 dark:text-red-400 font-black'
                              : activeStep >= 1 
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                              : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            {errorType === 'WRONG_INFO' ? 'Wrong Info' : errorType === 'NOT_VALID' ? 'Not Valid' : 'Processing'}
                          </span>
                          <span className={`text-[8px] block text-center max-w-[90px] mt-0.5 leading-none transition-colors duration-500 ${
                            isError ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {errorType === 'WRONG_INFO' 
                              ? 'Re-request Refund Again' 
                              : errorType === 'NOT_VALID' 
                              ? 'Policy criteria not met' 
                              : 'Bank transfer initiated'}
                          </span>
                        </div>

                        {/* Step 3: Completed */}
                        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ease-in-out ${activeStep === 2 && !isError ? 'scale-105' : 'scale-100'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ease-in-out ${
                            activeStep >= 2 && !isError
                              ? 'bg-emerald-500 text-white shadow-md ring-4 ring-emerald-100 dark:ring-emerald-950/50' 
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-800'
                          }`}>
                            {activeStep >= 2 && !isError ? '✓' : '3'}
                          </div>
                          <span className={`text-[10px] font-bold mt-1 transition-colors duration-500 ${
                            activeStep >= 2 && !isError
                              ? 'text-emerald-600 dark:text-emerald-400 font-black' 
                              : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            Completed
                          </span>
                          <span className="text-[8px] text-gray-400 dark:text-gray-500 block text-center max-w-[70px] mt-0.5 leading-none transition-colors duration-500">
                            Refunded to account
                          </span>
                        </div>
                      </div>

                      {/* Special Action for Rejections */}
                      {isError && (
                        <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-[10px] text-red-700 dark:text-red-300 font-medium text-center sm:text-left">
                            {errorType === 'WRONG_INFO' 
                              ? 'Your information was incorrect. Please resubmit your request with correct details.' 
                              : 'This request does not meet our refund eligibility criteria. Please contact support.'}
                          </p>
                          <button
                            onClick={() => errorType === 'WRONG_INFO' ? openRefundModal(order) : onOpenSupport?.()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer shrink-0 animate-pulse"
                          >
                            {errorType === 'WRONG_INFO' ? <Ticket size={12} /> : <MessageSquare size={12} />}
                            <span>{errorType === 'WRONG_INFO' ? 'Re-request Refund Again' : 'Contact Support Chat'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Payment Rejected Alert & Inline 12-Digit UTR Correction Flow */}
                {isRejected && !order.ticketId && order.ticketStatus !== 'OPEN' && (
                  <div className="mb-4 p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <h4 className="text-xs sm:text-sm font-black text-red-900 dark:text-red-200 font-heading">
                            Payment Rejected by Admin: {order.rejectionReason === 'utr' || order.rejectionReason?.toLowerCase().includes('utr') || !order.rejectionReason ? 'Invalid or Unmatched 12-Digit UTR' : order.rejectionReason}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-200/70 dark:bg-red-900/80 text-red-800 dark:text-red-300">
                            Action Required
                          </span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mb-3 leading-relaxed">
                          The Telegram admin could not match your submitted UTR (<strong>{order.utr || 'None'}</strong>) with bank settlements. If you typed the wrong digit or have your payment app receipt, enter your correct 12-digit UPI UTR below to re-submit for immediate verification.
                        </p>

                        {/* Inline 12-Digit UTR Correction Input */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              maxLength={12}
                              inputMode="numeric"
                              placeholder="Enter correct 12-digit UTR (e.g. 523412345678)"
                              value={resubmittingOrderMap[orderIdStr] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setResubmittingOrderMap(prev => ({ ...prev, [orderIdStr]: val }));
                              }}
                              className="w-full pl-3 pr-14 py-2 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-red-300 dark:border-red-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400">
                              {(resubmittingOrderMap[orderIdStr] ?? '').length}/12
                            </span>
                          </div>

                          <button
                            disabled={isSubmittingResubmit === orderIdStr || (resubmittingOrderMap[orderIdStr] ?? '').length !== 12}
                            onClick={() => handleResubmitUtr(order, resubmittingOrderMap[orderIdStr] ?? '')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          >
                            {isSubmittingResubmit === orderIdStr ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={13} />
                                <span>Re-Submit Correct UTR</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Feedback Message */}
                        {resubmitFeedbackMap[orderIdStr] && (
                          <div className={`text-[11px] font-bold py-1.5 px-2.5 rounded-lg mb-2 flex items-center gap-1.5 ${
                            resubmitFeedbackMap[orderIdStr]?.type === 'success'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}>
                            {resubmitFeedbackMap[orderIdStr]?.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                            <span>{resubmitFeedbackMap[orderIdStr]?.message}</span>
                          </div>
                        )}

                        {/* Quick Help & Support Options for Rejected Orders */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <button
                            onClick={() => onOpenSupport?.()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/60 hover:bg-red-50 text-red-800 dark:text-red-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            <MessageSquare size={12} />
                            <span>Ask Support: Why Payment Rejected?</span>
                          </button>

                          <button
                            onClick={() => openTicketModal(order)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            <Ticket size={12} />
                            <span>Raise Official Dispute Ticket</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Waiting More than 10 Minutes Alert & Automatic Speedup Ticket */}
                {isPending && !order.ticketId && order.ticketStatus !== 'OPEN' && waitMins >= 10 && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Order in review for {waitMins} minutes (Waiting too much time)
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          UPI bank statement reconciliation is taking longer than expected. You can automatically raise a high-priority ticket for instant admin dispatch.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openTicketModal(order)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0 flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <Ticket size={13} />
                      <span>Raise Waiting Ticket</span>
                    </button>
                  </div>
                )}

                {/* Footer Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 min-w-0">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-start sm:items-center gap-1.5 min-w-0">
                    <Info size={13} className="shrink-0 text-gray-400 mt-0.5 sm:mt-0" />
                    <span className="break-words">
                      {isSuccess 
                        ? 'Subscription active. Official receipt is available below.'
                        : isPending 
                        ? (isAwaitingLong 
                            ? `Payment awaiting verification (${waitMins}m). You can raise a priority ticket.` 
                            : 'UTR undergoing bank statement matching. Expected turnaround 2–5 mins.')
                        : 'Order rejected. You can re-submit the correct 12-digit UTR above or raise a dispute.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {/* Invoice Receipt Button */}
                    {(isSuccess || isOrderRefunded(order)) && (
                      <button
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition cursor-pointer min-w-0"
                      >
                        <FileText size={13} className="shrink-0" />
                        <span className="truncate">{isOrderRefunded(order) ? 'Refund Receipt' : 'Official Receipt'}</span>
                      </button>
                    )}

                    {/* 2-Day Refund Guarantee Action Button */}
                    {isSuccess && (() => {
                      const orderTime = getOrderTimestamp(order);
                      // Strict 2-day guarantee: Within 2 days (48 hours) from purchase
                      const isWithin2Days = orderTime > 0 && ((Date.now() - orderTime) <= (2 * 24 * 60 * 60 * 1000));
                      
                      // Feature usage logic: strictly under 10 operations (< 10)
                      const featureUsage = Math.max(
                        Number((user as any)?.featureUsageCount || 0), 
                        Number((user as any)?.operationsCount || 0),
                        Number((user as any)?.projectsUsed || 0)
                      );
                      const isEligibleUsage = featureUsage < 10;

                      const isEligibleForDirectRefund = isWithin2Days && isEligibleUsage;
                      const isEligibleForUpgradeRefund = isWithin2Days && isEligibleUsage;
                      
                      const ticketStatus = order.ticketStatus || 'OPEN';
                      const isRejectedWithWrongInfo = ticketStatus === 'REJECTED_WRONG_INFO';
                      const isResolved = ticketStatus === 'RESOLVED';

                      // Hide refund processing if the ticket is resolved or not applicable
                      if (isResolved) return null;

                      if ((order.ticketId || order.ticketStatus === 'OPEN') && !isRejectedWithWrongInfo) {
                        const isRefundCompleted = isOrderRefunded(order);
                        
                        return (
                          <div className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold ${
                            isRefundCompleted 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          }`}>
                            {isRefundCompleted ? <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Ticket size={13} className="text-amber-600 dark:text-amber-400" />}
                            <span>{isRefundCompleted ? 'Refund Successfully Processed' : 'Refund Processing & Payout Pending'}</span>
                          </div>
                        );
                      }
                      
                      // Show invalid reason if not eligible
                      if (!isEligibleForDirectRefund && !isEligibleForUpgradeRefund && !isRejectedWithWrongInfo) {
                        let invalidReason = "";
                        if (!isWithin2Days && !isEligibleUsage) {
                          invalidReason = `Exceeded 2 days limit (48h) & 10 feature usages (${featureUsage}/10)`;
                        } else if (!isWithin2Days) {
                          invalidReason = "Exceeded 2 days (48h) limit since purchase";
                        } else {
                          invalidReason = `Exceeded 10 feature operations (${featureUsage}/10)`;
                        }
                        
                        return (
                          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-xl text-[11px] font-bold cursor-not-allowed border border-stone-200 dark:border-stone-700">
                            <Ticket size={13} />
                            <span>Refund Invalid ({invalidReason})</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => openRefundModal(order)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                            isRejectedWithWrongInfo 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-md animate-pulse' 
                              : 'bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900'
                          }`}
                        >
                          <Ticket size={13} />
                          <span>{isRejectedWithWrongInfo ? 'Re-request Refund (Correct Info)' : isEligibleForDirectRefund ? 'Request Refund' : 'Upgrade & Refund Request'}</span>
                        </button>
                      );
                    })()}

                    {/* Active Ticket Status Badge */}
                    {!isSuccess && (order.ticketId || order.ticketStatus === 'OPEN') && (
                      <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300">
                        <Ticket size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>Ticket #{order.ticketId || 'OPEN'} Active (In Review)</span>
                      </div>
                    )}

                    {/* If Rejected: Raise Ticket or Resubmit UTR */}
                    {!isSuccess && !order.ticketId && order.ticketStatus !== 'OPEN' && isRejected && (
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <button
                          onClick={() => openTicketModal(order)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <Ticket size={13} />
                          <span>Raise Dispute</span>
                        </button>
                        <button
                          onClick={() => onOpenSupport?.()}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          <span>Support</span>
                        </button>
                      </div>
                    )}

                    {/* If Pending & Awaiting Long Time (> 5m): Prominent Raise Ticket Button */}
                    {!isSuccess && !order.ticketId && order.ticketStatus !== 'OPEN' && isPending && isAwaitingLong && (
                      <button
                        onClick={() => openTicketModal(order)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer animate-pulse"
                      >
                        <Ticket size={13} />
                        <span>Raise Ticket (Awaiting {waitMins}m)</span>
                      </button>
                    )}

                    {/* If Pending & Normal Wait (< 5m): Normal status with optional help link */}
                    {!isSuccess && !order.ticketId && order.ticketStatus !== 'OPEN' && isPending && !isAwaitingLong && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock size={12} className="animate-spin text-amber-500" />
                          <span>Verifying (~{waitMins}m)</span>
                        </span>
                        <button
                          onClick={() => openTicketModal(order)}
                          className="text-[11px] font-bold text-gray-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                          title="If you believe verification is delayed, you can raise a ticket"
                        >
                          Raise Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Ticket Raising Modal with Real Ready-Made Reasons */}
      {selectedOrderForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            {(() => {
              const isSelectedRejected = selectedOrderForTicket.status === 'REJECTED' || selectedOrderForTicket.status === 'FAILED' || selectedOrderForTicket.status === 'EXPIRED';
              const reasonOptions = isSelectedRejected ? READYMADE_TICKET_REASONS.REJECTED : READYMADE_TICKET_REASONS.AWAITING_LONG;
              const waitTime = getOrderWaitMinutes(selectedOrderForTicket);

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isSelectedRejected 
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' 
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Ticket size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base font-heading">
                            Raise Support Ticket
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isSelectedRejected 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}>
                            {isSelectedRejected ? 'Order Rejected' : `Awaiting ${waitTime}m`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isSelectedRejected 
                            ? 'Select readymade reason for payment dispute resolution' 
                            : 'Select readymade reason to expedite verification'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedOrderForTicket(null);
                        setTicketFeedback(null);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {ticketFeedback?.type === 'success' ? (
                    <div className="space-y-4 py-2">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-black">
                          ✓
                        </div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                          Ticket Dispatched to PaperX Team
                        </h4>
                        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold mt-1">
                          Ticket ID: {ticketFeedback.ticketId}
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2 leading-relaxed">
                          {ticketFeedback.message}
                        </p>
                      </div>

                      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="font-bold text-gray-900 dark:text-white">PaperX Team Resolution Steps:</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          The support officer is matching your 12-digit UTR against the UPI merchant bank ledger and will approve your account. Your subscription status will update automatically.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedOrderForTicket(null);
                          setTicketFeedback(null);
                        }}
                        className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-2xl text-xs hover:opacity-90 transition cursor-pointer"
                      >
                        Return to Payment History
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Order Summary */}
                      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Order ID:</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {selectedOrderForTicket.orderId || selectedOrderForTicket.id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Plan & Amount:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {selectedOrderForTicket.plan} (₹{selectedOrderForTicket.amount || 50})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">12-Digit UTR:</span>
                          <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                            {selectedOrderForTicket.utr || 'None provided'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Current Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            selectedOrderForTicket.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                          }`}>
                            {selectedOrderForTicket.status}
                          </span>
                        </div>
                      </div>

                      {/* Real Ready-Made Reasons Selection */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                          Select Real Issue Reason (Click to Choose)
                        </label>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {reasonOptions.map((item) => {
                            const isSelected = ticketReason === item.title;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setTicketReason(item.title)}
                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-white bg-white text-black dark:border-black dark:bg-black dark:text-white'
                                      : 'border-gray-400 dark:border-gray-600'
                                  }`}>
                                    {isSelected && <span className="w-2 h-2 rounded-full bg-black dark:bg-white inline-block" />}
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-xs leading-snug">
                                      {item.title}
                                    </h5>
                                    <p className={`text-[11px] mt-0.5 leading-normal ${
                                      isSelected 
                                        ? 'text-gray-300 dark:text-gray-700' 
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {item.desc}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Additional Bank Reference / Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={ticketNotes}
                          onChange={(e) => setTicketNotes(e.target.value)}
                          placeholder="Enter payer bank account name, correct 12-digit UTR if mistyped, or extra details for PaperX Team..."
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                        />
                      </div>

                      {/* PaperX Team Notice */}
                      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                        <Info size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                        <span>
                          When submitted, a priority alert is sent to <strong>PaperX Team</strong> with your UTR and selected ready-made reason for immediate manual ledger verification.
                        </span>
                      </div>

                      {ticketFeedback?.type === 'error' && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
                          {ticketFeedback.message}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setSelectedOrderForTicket(null);
                            setTicketFeedback(null);
                          }}
                          className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={isSubmittingTicket}
                          onClick={handleRaiseTicket}
                          className="flex-2 py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingTicket ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Alerting PaperX Team...</span>
                            </>
                          ) : (
                            <>
                              <Ticket size={14} />
                              <span>Submit Dispute Ticket</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2-Day Refund Guarantee Request Modal */}
      {selectedOrderForRefund && (
        <div 
          onPaste={handleRefundPaste}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center gap-2 font-heading">
                    <span>Request Membership Refund</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    2-Day Guarantee Payout • Direct Bank Transfer via UPI
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedOrderForRefund(null);
                  setRefundFeedback(null);
                  setShowConfirmRefundModal(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close refund modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {refundFeedback?.type === 'success' ? (
                <div className="space-y-4 py-1 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl text-center space-y-2.5">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-1 text-xl font-black shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100 dark:ring-emerald-900/40">
                      <Check size={26} className="stroke-[3]" />
                    </div>
                    <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-base sm:text-lg">
                      Refund Request Created Successfully!
                    </h4>
                    {refundFeedback.ticketId && (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700/80 rounded-full text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold shadow-xs">
                        <span>Ticket ID: {refundFeedback.ticketId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(refundFeedback.ticketId!, 'success-ticket')}
                          className="p-1 hover:text-emerald-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Copy Ticket ID"
                        >
                          {copiedId === 'success-ticket' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed max-w-md mx-auto pt-1">
                      {refundFeedback.message}
                    </p>
                  </div>

                  {/* 3-Step Live Processing Stepper */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3">
                    <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <Clock size={15} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Live Settlement Progress</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          ✓
                        </div>
                        <div className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-200">
                          Submitted
                        </div>
                        <div className="text-[9px] text-emerald-700 dark:text-emerald-400">
                          Ticket Active
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 animate-pulse">
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          2
                        </div>
                        <div className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200">
                          Review
                        </div>
                        <div className="text-[9px] text-amber-700 dark:text-amber-400">
                          Admin Ledger
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <div className="w-5 h-5 rounded-full bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                          3
                        </div>
                        <div className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                          UPI Payout
                        </div>
                        <div className="text-[9px] text-stone-400">
                          Within 24h
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderForRefund(null);
                      setRefundFeedback(null);
                      setShowConfirmRefundModal(false);
                    }}
                    className="w-full h-11 sm:h-12 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                  >
                    Done & Return to Orders
                  </button>
                </div>
              ) : showConfirmRefundModal ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Visual Header / Banner */}
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl text-center space-y-1">
                    <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                      Review & Confirm Payout Details
                    </h4>
                    <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
                      Please verify that your UPI VPA and phone number are accurate for direct credit.
                    </p>
                  </div>

                  <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden text-xs bg-stone-50/50 dark:bg-stone-800/20 divide-y divide-stone-200/70 dark:divide-stone-800 shadow-xs">
                    <div className="p-3.5 flex justify-between items-center bg-stone-100/60 dark:bg-stone-800/50">
                      <span className="text-stone-600 dark:text-stone-400 font-semibold">Refund Payout Amount</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                        ₹{selectedOrderForRefund.amount}
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Expected Settlement</span>
                      <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Zap size={13} className="fill-current" />
                        <span>Within 24 Hours</span>
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Beneficiary Name</span>
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {refundName}
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Phone Number</span>
                      <span className="font-mono font-semibold text-stone-900 dark:text-white">
                        {refundPhone}
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Target UPI ID (VPA)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        {refundUpiId}
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center">
                      <span className="text-stone-500 dark:text-stone-400 font-medium">Payment QR Code</span>
                      <span className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                        {refundQrBase64 ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span>QR Code Attached</span>
                          </>
                        ) : (
                          <span className="text-stone-400 font-normal">Direct VPA Payout</span>
                        )}
                      </span>
                    </div>

                    {refundReason.trim() && (
                      <div className="p-3 bg-stone-50 dark:bg-stone-800/30 text-left space-y-1">
                        <span className="text-stone-400 font-semibold block text-[10px] uppercase tracking-wider">
                          Reason / Context
                        </span>
                        <p className="text-stone-800 dark:text-stone-200 italic leading-relaxed whitespace-pre-wrap font-sans text-xs bg-white dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800 shadow-inner">
                          "{refundReason.trim()}"
                        </p>
                      </div>
                    )}
                  </div>

                  {refundFeedback?.type === 'error' && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{refundFeedback.message}</span>
                    </div>
                  )}

                  {/* Confirmation Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmRefundModal(false)}
                      className="flex-1 h-11 sm:h-12 px-4 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold rounded-xl text-xs sm:text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingRefund}
                      onClick={handleRequestRefund}
                      className="flex-1 sm:flex-[1.4] h-11 sm:h-12 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingRefund ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Creating Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Ticket size={15} />
                          <span>Confirm & Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Order Summary Info Card */}
                  <div className="p-4 sm:p-4.5 bg-stone-50/90 dark:bg-stone-800/50 rounded-2xl border border-stone-200/90 dark:border-stone-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 dark:text-white text-sm sm:text-base">
                          {selectedOrderForRefund.plan}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300 capitalize">
                          {selectedOrderForRefund.billingCycle || 'month'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Refund Amount:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl font-heading">
                          ₹{selectedOrderForRefund.amount}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-200/70 dark:border-stone-700/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="font-bold text-stone-400">UTR:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                          {selectedOrderForRefund.utr || selectedOrderForRefund.orderId || selectedOrderForRefund.id}
                        </span>
                        {selectedOrderForRefund.utr && (
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedOrderForRefund.utr!, 'refund-utr')}
                            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                            title="Copy UTR"
                          >
                            {copiedId === 'refund-utr' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/40">
                        <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
                        <span>48-Hour Guarantee (&lt;10 ops used)</span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Path Suggestion */}
                  {selectedOrderForRefund.plan === 'Plus Plan' && ((user as any)?.featureUsageCount || 0) < 10 && (
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl space-y-2.5">
                      <div className="flex gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-700 dark:text-amber-300 shrink-0">
                          <Zap size={18} className="fill-current" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-amber-900 dark:text-amber-100 text-xs sm:text-sm leading-tight">
                            Thinking of Upgrading to Max Plan?
                          </h4>
                          <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                            Skip the refund wait! Upgrade to <strong>Max Plan</strong>, and we will automatically refund this {selectedOrderForRefund.plan} payment immediately.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderForRefund(null);
                          onUpgrade?.('Max Plan', undefined, 'month', selectedOrderForRefund.orderId || selectedOrderForRefund.id, Number(selectedOrderForRefund.amount) || 50);
                        }}
                        className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Crown size={14} />
                        <span>Upgrade to Max Plan Instead</span>
                      </button>
                    </div>
                  )}

                  {/* Refund Form Inputs */}
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                        <label className="flex items-center gap-1.5">
                          <UserIcon size={14} className="text-stone-400" />
                          <span>Full Name</span>
                        </label>
                        <span className="text-[11px] font-normal text-stone-400">As registered on bank / UPI</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={refundName}
                          onChange={(e) => setRefundName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full h-11 px-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-stone-800 transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone & UPI ID in Responsive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                          <label className="flex items-center gap-1.5">
                            <Phone size={14} className="text-stone-400" />
                            <span>Phone Number</span>
                          </label>
                          <span className="text-[11px] font-normal text-stone-400">10 digits</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={refundPhone}
                          onChange={(e) => setRefundPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="e.g. 9876543210"
                          className="w-full h-11 px-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-stone-800 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                          <label className="flex items-center gap-1.5">
                            <Wallet size={14} className="text-stone-400" />
                            <span>UPI ID (Payout VPA)</span>
                          </label>
                          <span className="text-[11px] font-normal text-stone-400">name@handle</span>
                        </div>
                        <input
                          type="text"
                          value={refundUpiId}
                          onChange={(e) => setRefundUpiId(e.target.value.trim())}
                          placeholder="e.g. username@paytm"
                          className="w-full h-11 px-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-mono font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-stone-800 transition-all"
                        />
                      </div>
                    </div>

                    {/* Reason / Context with Quick Preset Chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                        <label className="flex items-center gap-1.5">
                          <FileText size={14} className="text-stone-400" />
                          <span>Reason for Refund</span>
                        </label>
                        <span className="text-[11px] font-normal text-stone-400">Optional</span>
                      </div>

                      {/* Quick Reason Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {[
                          'Upgrading to Max Plan',
                          'Testing workspace features',
                          'Selected wrong billing cycle',
                          'Accidental payment'
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setRefundReason(chip)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              refundReason === chip
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      <div className="relative pt-1">
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="Provide details or select a quick reason above..."
                          rows={2}
                          className="w-full p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-stone-800 transition-all resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* QR Code Upload Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200">
                        <label className="flex items-center gap-1.5">
                          <QrCode size={14} className="text-stone-400" />
                          <span>UPI Payment QR Code</span>
                        </label>
                        <span className="text-[11px] font-normal text-stone-400">Optional (Instant Scan)</span>
                      </div>
                      <div
                        onDragEnter={handleRefundDrag}
                        onDragOver={handleRefundDrag}
                        onDragLeave={handleRefundDrag}
                        onDrop={handleRefundDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 ${
                          dragActive
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                            : refundQrBase64
                            ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/20'
                        }`}
                      >
                        <input
                          id="qr-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleRefundFileChange}
                        />
                        
                        {refundQrBase64 ? (
                          <div className="space-y-2.5">
                            <div className="relative inline-block">
                              <img
                                src={refundQrBase64}
                                alt="Uploaded QR Code"
                                referrerPolicy="no-referrer"
                                className="max-h-24 sm:max-h-28 mx-auto rounded-xl shadow-xs border border-stone-200 dark:border-stone-700 object-contain bg-white"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRefundQrBase64('');
                                  setQrFileName('');
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                                title="Remove QR Code"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                <span>QR Attached ({qrFileName || 'Image'})</span>
                              </p>
                              <label
                                htmlFor="qr-file-input"
                                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer font-medium ml-2"
                              >
                                Replace
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="qr-file-input" className="cursor-pointer block w-full">
                            <div className="space-y-1.5 py-1">
                              <div className="mx-auto w-9 h-9 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center">
                                <QrCode size={18} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                                  Drag & drop or paste (Ctrl+V) UPI QR Code image
                                </p>
                                <p className="text-[11px] text-stone-400 mt-0.5">
                                  or <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">browse from your device</span>
                                </p>
                              </div>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {refundFeedback?.type === 'error' && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{refundFeedback.message}</span>
                    </div>
                  )}

                  {/* Footer Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForRefund(null);
                        setRefundFeedback(null);
                      }}
                      className="flex-1 h-11 sm:h-12 px-4 rounded-xl font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToConfirm}
                      className="flex-1 sm:flex-[1.4] h-11 sm:h-12 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Confirm</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base font-heading">
                  Official Payment Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div id="printable-receipt" className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-4 sm:space-y-5 text-xs text-gray-700 dark:text-gray-300 font-sans">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <h4 className="text-base font-black text-gray-900 dark:text-white font-heading tracking-tight">PaperX Cloud Suite</h4>
                </div>
                <div className="text-left sm:text-right">
                  <span className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase tracking-wider inline-block sm:block mb-1 ${
                    isOrderRefunded(selectedOrderForInvoice)
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}>
                    {isOrderRefunded(selectedOrderForInvoice) ? 'REFUNDED & CLOSED' : 'PAID & VERIFIED'}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 block">
                    {isOrderRefunded(selectedOrderForInvoice) ? 'REF-' : 'INV-'}
                    {selectedOrderForInvoice.orderId || selectedOrderForInvoice.id}
                  </span>
                </div>
              </div>

              {/* Customer & Order Metadata */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Billed To</span>
                  <p className="font-bold text-gray-900 dark:text-white break-words">{user?.name || user?.email?.split('@')[0] || 'Subscriber'}</p>
                  <p className="text-gray-500 text-[11px] font-mono break-all">{user?.email || 'N/A'}</p>
                  <p className="text-gray-400 text-[10px] font-mono break-all">UID: {user?.uid || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Transaction Details</span>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Date:</strong> {selectedOrderForInvoice.createdAt ? new Date(selectedOrderForInvoice.createdAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Payment Mode:</strong> UPI (Instant)
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-[11px] break-all">
                    <strong>UTR / RRN:</strong> {selectedOrderForInvoice.utr || 'Verified'}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3">
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Description</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs py-1 gap-1 sm:gap-0">
                  <div>
                    <strong className="text-gray-900 dark:text-white block sm:inline">{selectedOrderForInvoice.plan || 'Plus Plan'}</strong>
                    <span className="text-gray-400 text-[11px] sm:ml-1.5">({selectedOrderForInvoice.billingCycle || 'Monthly'} Subscription)</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900 dark:text-white self-start sm:self-auto">
                    ₹{selectedOrderForInvoice.amount || 50}.00
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black">
                <span className="text-gray-900 dark:text-white">
                  {isOrderRefunded(selectedOrderForInvoice) ? 'Total Amount Refunded' : 'Total Amount Paid'}
                </span>
                <span className={`text-base font-mono ${
                  isOrderRefunded(selectedOrderForInvoice)
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  ₹{selectedOrderForInvoice.amount || 50}.00
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
                        // Fallback text if the image isn't uploaded yet
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = document.getElementById('signature-fallback');
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <div id="signature-fallback" className="hidden font-serif italic text-xl text-gray-800 dark:text-gray-200" style={{ fontFamily: "'Brush Script MT', cursive" }}>
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
                This is an official and real electronically generated receipt. No GST or government tax information is applicable. <br className="hidden sm:block" />
                Support email: <strong className="text-gray-600 dark:text-gray-300">paperx.assist@gmail.com</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={isGeneratingPDF}
                onClick={handleDownloadPDF}
                className="flex-1 py-2.5 px-4 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
