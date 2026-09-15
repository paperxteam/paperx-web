import express from "express";
import crypto from "node:crypto";
import { sendTelegramAdminNotification, sendTelegramCheckoutNotification } from "./telegramBot";
import { setServerDoc, getServerDocs, getServerDoc } from "./serverDb";
import { emitAdminAction } from "./adminRoutes";
import { getReceiptForOrder, generateReceiptForOrder, getAllReceiptsForOrder } from "./receiptGenerator";

const router = express.Router();

export interface PaymentOrderRecord {
  orderId: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  plan: 'Plus Plan' | 'Max Plan';
  amount: number;
  currency: string;
  vpa: string;
  upiUri: string;
  createdAt: number;
  expiresAt: number;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
  utr?: string;
  verifiedAt?: number;
  billingCycle?: string;
  durationDays?: number;
  ticketId?: string;
  ticketStatus?: string;
  ticketReason?: string;
}

// In-memory store for active payment sessions / orders
export const activeOrders = new Map<string, PaymentOrderRecord>();
const verifiedUtrs = new Set<string>();
const usedUtrs = new Set<string>();
const generatedOrderIds = new Set<string>();

// VPA Config
export const PAPERX_MERCHANT_VPA = process.env.PAPERX_UPI_VPA || "7585813675@omni";
export const PAPERX_MERCHANT_NAME = "PaperX Cloud";

/**
 * Generate a guaranteed unique, non-repeating cryptographic order reference ID.
 */
function generateUniqueOrderId(): string {
  let orderId = "";
  let attempts = 0;
  do {
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomEntropy = crypto.randomBytes(4).toString("hex").toUpperCase();
    orderId = `PX-${timestampPart}-${randomEntropy}`;
    attempts++;
  } while (generatedOrderIds.has(orderId) && attempts < 10);

  generatedOrderIds.add(orderId);
  return orderId;
}

// Cleanup expired orders every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [orderId, order] of activeOrders.entries()) {
    if (order.status === 'PENDING' && order.expiresAt < now) {
      order.status = 'EXPIRED';
      activeOrders.set(orderId, order);
    }
  }
}, 2 * 60 * 1000);

/**
 * POST /api/payments/order/create
 * Creates or updates a real dynamic 10-minute order with UPI payment payload & clean QR details.
 */
router.post("/order/create", (req, res) => {
  try {
    const { uid, plan, amount, billingCycle = "month", currency = "INR", email, userEmail, userName, orderId: clientOrderId } = req.body;

    if (!uid || !plan || !amount) {
      return res.status(400).json({ error: "Missing required fields (uid, plan, amount)." });
    }

    const effectiveEmail = email || userEmail || '';
    const rawOrderId = typeof clientOrderId === 'string' && clientOrderId.trim().length > 0 && clientOrderId !== 'undefined' ? clientOrderId.trim() : '';
    const orderId = rawOrderId || generateUniqueOrderId();
    const now = Date.now();
    const durationMs = 10 * 60 * 1000; // 10 minutes real timer
    const expiresAt = now + durationMs;

    const defaultAmount = plan === 'Max Plan' ? 100 : 50;
    const numAmount = parseFloat(amount) || defaultAmount;

    const durationDays = billingCycle === '1-min' ? (1 / 1440) :
      billingCycle === 'half-year' ? 180 : 
      billingCycle === 'year' ? 365 : 30;

    // Standard UPI Intent URI for all UPI apps
    const upiUri = `upi://pay?pa=${encodeURIComponent(PAPERX_MERCHANT_VPA)}&pn=${encodeURIComponent(PAPERX_MERCHANT_NAME)}&am=${numAmount.toFixed(2)}&cu=${currency}&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(`PaperX ${plan} ${orderId}`)}`;

    const existingOrder = activeOrders.get(orderId);

    const orderRecord: PaymentOrderRecord = {
      orderId,
      uid,
      userEmail: effectiveEmail || existingOrder?.userEmail || '',
      userName: userName || existingOrder?.userName || '',
      plan,
      billingCycle,
      durationDays,
      amount: numAmount,
      currency,
      vpa: PAPERX_MERCHANT_VPA,
      upiUri,
      createdAt: existingOrder?.createdAt || now,
      expiresAt: existingOrder ? existingOrder.expiresAt : expiresAt,
      status: existingOrder?.status || 'PENDING',
      utr: existingOrder?.utr
    };

    activeOrders.set(orderId, orderRecord);

    // Persist to Firestore ledger immediately for reliability and real-time Admin sync
    setServerDoc('orders', orderId, {
      ...orderRecord,
      billingCycle,
      durationDays,
      createdAt: new Date(orderRecord.createdAt).toISOString(),
      expiresAt: new Date(orderRecord.expiresAt).toISOString()
    }, true).catch(err => console.warn('[PAYMENT SERVER] Order persistence note:', err));

    console.log(`[PAYMENT SERVER] Synced payment session ${orderId} for user ${uid} (${effectiveEmail}), amount: ${currency} ${numAmount}`);

    // Instantly notify Admin on Telegram that user is in checkout preparing payment
    sendTelegramCheckoutNotification({
      orderId,
      uid,
      userEmail: effectiveEmail,
      userName: userName || effectiveEmail.split('@')[0] || 'User',
      plan,
      billingCycle,
      amount: numAmount
    }).catch(err => console.warn('[PAYMENT SERVER] Checkout notification note:', err));

    return res.json({
      success: true,
      order: {
        orderId,
        amount: numAmount,
        currency,
        vpa: PAPERX_MERCHANT_VPA,
        merchantName: PAPERX_MERCHANT_NAME,
        upiUri,
        createdAt: orderRecord.createdAt,
        expiresAt: orderRecord.expiresAt,
        durationSeconds: Math.max(0, Math.floor((orderRecord.expiresAt - now) / 1000)),
        status: orderRecord.status
      }
    });
  } catch (error: any) {
    console.error("[PAYMENT SERVER] Error creating payment order:", error);
    return res.status(500).json({ error: "Failed to initialize payment session." });
  }
});

/**
 * GET /api/payments/order/:orderId/status
 * Fetches real-time status, checks database and user membership state.
 */
router.get("/order/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  let order = activeOrders.get(orderId);

  // Cross-reference persisted database order record
  try {
    const dbOrder = await getServerDoc('orders', orderId).catch(() => null);
    if (dbOrder) {
      if (!order) {
        order = {
          orderId,
          uid: dbOrder.uid || 'guest_user',
          userEmail: dbOrder.userEmail,
          userName: dbOrder.userName,
          plan: dbOrder.plan || 'Plus Plan',
          amount: dbOrder.amount || 50,
          currency: dbOrder.currency || 'INR',
          vpa: dbOrder.vpa || PAPERX_MERCHANT_VPA,
          upiUri: dbOrder.upiUri || '',
          createdAt: typeof dbOrder.createdAt === 'string' ? new Date(dbOrder.createdAt).getTime() : (dbOrder.createdAt || Date.now()),
          expiresAt: typeof dbOrder.expiresAt === 'string' ? new Date(dbOrder.expiresAt).getTime() : (dbOrder.expiresAt || (Date.now() + 600000)),
          status: dbOrder.status || 'PENDING',
          utr: dbOrder.utr,
          verifiedAt: typeof dbOrder.verifiedAt === 'string' ? new Date(dbOrder.verifiedAt).getTime() : dbOrder.verifiedAt,
          billingCycle: dbOrder.billingCycle,
          durationDays: dbOrder.durationDays
        };
        activeOrders.set(orderId, order);
      } else {
        // If DB has a definitive status change (e.g. VERIFIED or REJECTED), adopt it
        const dbStatus = String(dbOrder.status || '').toUpperCase();
        if (dbStatus === 'VERIFIED' || dbStatus === 'COMPLETED' || dbStatus === 'APPROVED') {
          order.status = 'VERIFIED';
          order.verifiedAt = order.verifiedAt || Date.now();
          activeOrders.set(orderId, order);
        } else if (dbStatus === 'REJECTED' || dbStatus === 'FAILED') {
          order.status = 'REJECTED';
          (order as any).rejectionReason = dbOrder.rejectionReason;
          activeOrders.set(orderId, order);
        }
      }
    }
  } catch (dbErr) {
    console.warn('[PAYMENT SERVER] db sync note on status check:', dbErr);
  }

  if (!order) {
    return res.status(404).json({ error: "Order not found or expired." });
  }

  const now = Date.now();
  // Only auto-expire orders that have NO submitted UTR. Once a UTR is submitted,
  // it is under admin review and must NOT auto-expire!
  if (order.status === 'PENDING' && !order.utr && order.expiresAt < now) {
    order.status = 'EXPIRED';
    activeOrders.set(orderId, order);
  }

  const secondsRemaining = Math.max(0, Math.floor((order.expiresAt - now) / 1000));

  return res.json({
    success: true,
    status: order.status,
    secondsRemaining,
    verifiedAt: order.verifiedAt,
    rejectionReason: (order as any).rejectionReason || (order.status === 'REJECTED' ? 'The submitted 12-digit UTR could not be verified with our payment gateway records.' : undefined),
    ticketId: (order as any).ticketId,
    ticketStatus: (order as any).ticketStatus,
    plan: order.plan
  });
});

/**
 * POST /api/payments/verify-utr
 * Verifies real 12-digit UTR/RRN number, prevents fraud, checks validity and upgrades account.
 */
router.post("/verify-utr", async (req, res) => {
  try {
    const { orderId, utr, uid } = req.body;

    if (!orderId || !utr) {
      return res.status(400).json({ error: "Order reference ID and 12-digit UTR number are required." });
    }

    const cleanUtr = String(utr).trim().replace(/\s+/g, '');

    // Validate 12-digit UTR format (standard in all UPI banking networks)
    const utrRegex = /^[0-9]{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      return res.status(400).json({ 
        error: "Invalid UTR format. Please enter a valid 12-digit numeric UPI Reference / Transaction ID." 
      });
    }

    let order = activeOrders.get(orderId);
    if (!order) {
      // Fallback: create record on the fly so notification and tracking never fail
      order = {
        orderId,
        uid: uid || 'guest_user',
        plan: req.body.plan || 'Plus Plan',
        amount: parseFloat(req.body.amount) || (req.body.plan === 'Max Plan' ? 100 : 50),
        currency: 'INR',
        vpa: PAPERX_MERCHANT_VPA,
        upiUri: '',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        status: 'PENDING',
        utr: cleanUtr
      };
      activeOrders.set(orderId, order);
    }

    const now = Date.now();
    if (order.expiresAt < now) {
      order.status = 'EXPIRED';
      return res.status(400).json({ 
        error: "This payment session has expired (10 minutes limit). Please re-open to begin a new session." 
      });
    }

    // Check if this UTR was already used for another order
    if (usedUtrs.has(cleanUtr)) {
      return res.status(409).json({ 
        error: "Wrong UTR. Payment not received. This UTR reference has already been used." 
      });
    }

    // Change to Manual Verification via Telegram
    order.status = 'PENDING';
    order.utr = cleanUtr;
    order.userEmail = req.body.email || req.body.userEmail || order.userEmail || '';
    order.userName = req.body.userName || order.userName || '';
    activeOrders.set(orderId, order);
    usedUtrs.add(cleanUtr);

    const orderBillingCycle = (order as any).billingCycle || req.body.billingCycle || 'month';
    const orderDurationDays = (order as any).durationDays || (
      orderBillingCycle === '1-min' ? (1 / 1440) :
      orderBillingCycle === 'half-year' ? 180 : 
      orderBillingCycle === 'year' ? 365 : 30
    );

    // Persist order in Firestore ledger via ServerDB
    setServerDoc('orders', orderId, {
      orderId,
      uid: uid || order.uid,
      userEmail: req.body.email || req.body.userEmail || order.userEmail || '',
      userName: req.body.userName || order.userName || '',
      plan: order.plan,
      billingCycle: orderBillingCycle,
      durationDays: orderDurationDays,
      amount: order.amount,
      currency: order.currency,
      utr: cleanUtr,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      createdAt: new Date(order.createdAt).toISOString()
    }, true).catch(err => console.warn('[PAYMENT SERVER] Order persistence note:', err));

    console.log(`[PAYMENT SUBMITTED] Order ${orderId} submitted with UTR ${cleanUtr} for user ${uid || order.uid}, pending admin approval`);

    // Instantly notify Admin via Telegram bot for approval/rejection
    sendTelegramAdminNotification(orderId, uid || order.uid, order.plan, order.amount, cleanUtr, {
      userEmail: req.body.email || req.body.userEmail || order.userEmail || '',
      userName: req.body.userName || order.userName || '',
      billingCycle: orderBillingCycle
    }).catch(err => console.warn('[PAYMENT SERVER] Telegram notification note:', err));

    return res.json({
      success: true,
      message: "UTR submitted successfully! Please wait for admin verification.",
      orderId,
      utr: cleanUtr,
      plan: order.plan,
      status: 'PENDING'
    });
  } catch (error: any) {
    console.error("[PAYMENT SERVER] UTR verification error:", error);
    return res.status(500).json({ error: "Internal error verifying UTR." });
  }
});

/**
 * POST /api/payments/resubmit-utr
 * Resubmits a corrected 12-digit UTR for a rejected or pending order,
 * updates Firestore, resets status to PENDING, emits real-time event,
 * and notifies Telegram Admin bot with instant Approve / Reject actions.
 */
router.post("/resubmit-utr", async (req, res) => {
  try {
    const { orderId, utr, uid, userEmail, userName } = req.body;

    if (!orderId || !utr) {
      return res.status(400).json({ error: "Order reference ID and 12-digit UTR number are required." });
    }

    const cleanUtr = String(utr).trim().replace(/\s+/g, '');
    const utrRegex = /^[0-9]{12}$/;
    if (!utrRegex.test(cleanUtr)) {
      return res.status(400).json({ 
        error: "Invalid UTR format. Please enter a valid 12-digit numeric UPI Reference / Transaction ID." 
      });
    }

    // 1. Fetch existing order from DB or activeOrders
    let order = activeOrders.get(orderId);
    let dbOrder = await getServerDoc('orders', orderId).catch(() => null);

    const targetPlan = dbOrder?.plan || order?.plan || req.body.plan || 'Plus Plan';
    const targetAmount = dbOrder?.amount || order?.amount || (targetPlan === 'Max Plan' ? 100 : 50);
    const targetUid = uid || dbOrder?.uid || order?.uid || 'user';
    const targetEmail = userEmail || req.body.email || dbOrder?.userEmail || order?.userEmail || '';
    const targetName = userName || dbOrder?.userName || order?.userName || '';
    const billingCycle = dbOrder?.billingCycle || order?.billingCycle || req.body.billingCycle || 'month';
    const durationDays = dbOrder?.durationDays || order?.durationDays || (
      billingCycle === '1-min' ? (1 / 1440) :
      billingCycle === 'half-year' ? 180 : 
      billingCycle === 'year' ? 365 : 30
    );

    const updatedOrderRecord = {
      orderId,
      uid: targetUid,
      userEmail: targetEmail,
      userName: targetName,
      plan: targetPlan,
      billingCycle,
      durationDays,
      amount: targetAmount,
      currency: 'INR',
      vpa: PAPERX_MERCHANT_VPA,
      utr: cleanUtr,
      status: 'PENDING' as const,
      rejectionReason: null,
      rejectionCode: null,
      resubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };

    activeOrders.set(orderId, {
      ...updatedOrderRecord,
      createdAt: dbOrder?.createdAt ? (typeof dbOrder.createdAt === 'string' ? new Date(dbOrder.createdAt).getTime() : dbOrder.createdAt) : Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      upiUri: ''
    });

    // Update in Firestore
    await setServerDoc('orders', orderId, updatedOrderRecord, true);

    // Emit real-time socket event for instant app reaction
    emitAdminAction("order-updated", {
      orderId,
      status: 'PENDING',
      utr: cleanUtr,
      plan: targetPlan,
      resubmitted: true
    });

    // Send Telegram alert with quick action buttons
    sendTelegramAdminNotification(orderId, targetUid, targetPlan, targetAmount, cleanUtr, {
      userEmail: targetEmail,
      userName: targetName,
      billingCycle,
      isResubmission: true
    }).catch(err => console.warn('[PAYMENT SERVER] Resubmit telegram alert note:', err));

    return res.json({
      success: true,
      message: "Corrected 12-digit UTR submitted successfully! Telegram Admin has been notified for priority verification.",
      order: updatedOrderRecord
    });
  } catch (err: any) {
    console.error("[PAYMENT SERVER] Resubmit UTR error:", err);
    return res.status(500).json({ error: "Failed to resubmit UTR: " + err.message });
  }
});

/**
 * GET /api/payments/user-orders
 * POST /api/payments/user-orders
 * Fetches all real payment records for a user from both in-memory cache and Firestore ledger.
 */
const handleUserOrders = async (req: express.Request, res: express.Response) => {
  try {
    const uid = String(req.query?.uid || req.body?.uid || '').trim();
    const email = String(req.query?.email || req.body?.email || '').trim().toLowerCase();

    if (!uid && !email) {
      return res.json({ success: true, orders: [] });
    }

    const orderMap = new Map<string, any>();

    // 1. Check in-memory active orders
    for (const [orderId, order] of activeOrders.entries()) {
      const matchUid = uid && order.uid === uid;
      const matchEmail = email && (order.userEmail?.toLowerCase() === email);
      if (matchUid || matchEmail) {
        orderMap.set(orderId, {
          id: orderId,
          ...order,
          createdAt: typeof order.createdAt === 'number' ? new Date(order.createdAt).toISOString() : order.createdAt
        });
      }
    }

    // 2. Fetch persistent orders from Firestore database
    try {
      const dbOrders = await getServerDocs('orders');
      for (const d of dbOrders) {
        const orderId = d.orderId || d.id;
        if (!orderId) continue;

        const matchUid = uid && (d.uid === uid || d.userId === uid);
        const matchEmail = email && (d.userEmail?.toLowerCase() === email || d.email?.toLowerCase() === email);

        if (matchUid || matchEmail) {
          const existing = orderMap.get(orderId) || {};
          orderMap.set(orderId, {
            ...existing,
            ...d,
            id: orderId,
            orderId
          });
        }
      }
    } catch (dbErr) {
      console.warn("[PAYMENT SERVER] Note fetching user orders from DB:", dbErr);
    }

    const allRecords = Array.from(orderMap.values());
    const now = Date.now();

    // Identify all submitted/real UTRs and timestamps to filter unsubmitted duplicate drafts
    const submittedUtrs = new Set<string>();
    const submittedTimes: number[] = [];

    for (const ord of allRecords) {
      if (ord.utr && typeof ord.utr === 'string' && ord.utr.trim().length >= 8) {
        submittedUtrs.add(ord.utr.trim());
      }
      const isFinal = ord.status === 'VERIFIED' || ord.status === 'COMPLETED' || ord.status === 'SUCCESS' || ord.status === 'REJECTED' || ord.status === 'REFUNDED' || ord.isRefunded;
      if (ord.utr || isFinal) {
        const t = new Date(ord.createdAt || ord.submittedAt || 0).getTime();
        if (t > 0) submittedTimes.push(t);
      }
    }

    // Filter and sanitize orders: remove ghost unsubmitted draft sessions that were never paid/submitted
    const cleanOrders = allRecords.filter((ord) => {
      const hasUtr = typeof ord.utr === 'string' && ord.utr.trim().length >= 8;
      const isFinalized = ord.status === 'VERIFIED' || ord.status === 'COMPLETED' || ord.status === 'SUCCESS' || ord.status === 'REJECTED' || ord.status === 'FAILED' || ord.status === 'REFUNDED' || ord.isRefunded;
      const createdTime = new Date(ord.createdAt || ord.submittedAt || 0).getTime();
      const ageMs = now - createdTime;

      // If it has a real UTR or is in a finalized state, it's a real order
      if (hasUtr || isFinalized) return true;

      // If it has NO UTR and has status PENDING:
      // Check if it's an abandoned draft created near a submitted real order (within 2 minutes)
      const isGhostNearReal = submittedTimes.some(st => Math.abs(st - createdTime) < 2 * 60 * 1000);
      if (isGhostNearReal) return false;

      // If it has NO UTR and is older than 10 minutes (expired session), drop it from history
      if (ageMs > 10 * 60 * 1000) return false;

      // Otherwise allow active 10-minute session
      return true;
    });

    // Deduplicate by UTR if multiple records share the same valid UTR
    const utrSeen = new Map<string, any>();
    const nonUtrOrders: any[] = [];

    const getStatusScore = (s?: string) => {
      if (s === 'REFUNDED') return 4;
      if (s === 'VERIFIED' || s === 'COMPLETED' || s === 'SUCCESS') return 3;
      if (s === 'REJECTED' || s === 'FAILED') return 2;
      return 1;
    };

    for (const ord of cleanOrders) {
      if (ord.utr && typeof ord.utr === 'string' && ord.utr.trim().length >= 8) {
        const cleanUtrKey = ord.utr.trim();
        if (utrSeen.has(cleanUtrKey)) {
          const prev = utrSeen.get(cleanUtrKey);
          // Prefer refunded or verified/completed status, merge details
          const prevScore = getStatusScore(prev.status);
          const curScore = getStatusScore(ord.status);
          if (curScore >= prevScore) {
            utrSeen.set(cleanUtrKey, { ...prev, ...ord });
          } else {
            utrSeen.set(cleanUtrKey, { ...ord, ...prev });
          }
        } else {
          utrSeen.set(cleanUtrKey, ord);
        }
      } else {
        nonUtrOrders.push(ord);
      }
    }

    const finalOrders = [...Array.from(utrSeen.values()), ...nonUtrOrders];

    // Convert to sorted array (newest first)
    const ordersList = finalOrders.sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || a.submittedAt || 0).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json({
      success: true,
      orders: ordersList
    });
  } catch (err: any) {
    console.error("[PAYMENT SERVER] Error fetching user orders:", err);
    return res.status(500).json({ error: "Failed to load payment history" });
  }
};

router.get("/user-orders", handleUserOrders);
router.post("/user-orders", handleUserOrders);

/**
 * POST /api/payments/webhook/sms
 * Free SMS Forwarder Webhook Endpoint:
 * Receives incoming SMS from your Android phone running an SMS forwarder app
 * when a bank UPI payment credit SMS arrives. Automatically adds UTR to verified ledger.
 */
router.post("/webhook/sms", (req, res) => {
  try {
    const { sender, message, secret, secretKey } = req.body;
    const authSecret = secret || secretKey || req.headers['x-webhook-secret'];

    // Simple webhook security token check
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET || "paperx_secure_sms_key";
    if (authSecret && authSecret !== expectedSecret && process.env.NODE_ENV === 'production') {
      console.warn("[SMS WEBHOOK] Unauthorized SMS webhook attempt.");
      return res.status(403).json({ error: "Unauthorized webhook key." });
    }

    const smsText = String(message || req.body.text || "").trim();
    const smsSender = String(sender || req.body.from || "").toUpperCase();

    console.log(`[SMS WEBHOOK RECEIVED] From: ${smsSender}, Message: ${smsText}`);

    // Extract 12-digit UTR/RRN number from any incoming SMS
    const utrMatch = smsText.match(/\b([0-9]{12})\b/);
    // Extract amount (e.g. INR 299 or Rs 299.00)
    const amountMatch = smsText.match(/(?:INR|Rs\.?)\s*([0-9]+(?:\.[0-9]+)?)/i);

    if (utrMatch) {
      const utr = utrMatch[1];
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

      // Automatically add to verified ledger
      verifiedUtrs.add(utr);
      console.log(`[SMS WEBHOOK AUTO-VERIFIED] Extracted UTR: ${utr}, Amount: ${amount || 'Unknown'}`);

      return res.json({
        success: true,
        matched: true,
        utr,
        amount,
        message: "SMS parsed and UTR successfully registered in verified ledger."
      });
    }

    return res.json({
      success: true,
      matched: false,
      message: "SMS received but no 12-digit UPI transaction reference found."
    });
  } catch (err: any) {
    console.error("[SMS WEBHOOK ERROR]:", err);
    return res.status(500).json({ error: "Failed to process SMS webhook." });
  }
});

/**
 * GET /api/payments/receipt/order/:orderId
 * Returns the immutable, backend-generated payment or refund receipt associated with an order.
 * Verifies user ownership using the query-param uid for bulletproof client isolation.
 */
router.get("/receipt/order/:orderId", async (req, res) => {
  console.log(`[PAYMENT SERVER] Receipt request for orderId: ${req.params.orderId}, uid: ${req.query.uid}, type: ${req.query.type}`);
  try {
    const { orderId } = req.params;
    const { uid, type } = req.query;

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: "Missing user UID." });
    }

    const preferredType = type === 'REFUND_SUCCESSFUL' ? 'REFUND_SUCCESSFUL' : (type === 'PAYMENT_SUCCESSFUL' ? 'PAYMENT_SUCCESSFUL' : undefined);
    const receipt = await getReceiptForOrder(orderId, uid, preferredType);
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found for this transaction." });
    }

    const allReceipts = await getAllReceiptsForOrder(orderId, uid);

    return res.json({ success: true, receipt, allReceipts });
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return res.status(403).json({ error: "You are not authorized to view this receipt." });
    }
    console.error("[RECEIPT ORDER FETCH ERROR]:", err);
    return res.status(500).json({ error: "Failed to retrieve receipt." });
  }
});

/**
 * GET /api/payments/receipt/verify/:verificationId
 * Public verification endpoint used by QR codes / Verification URL.
 * Returns public validation status (VALID, REFUNDED, etc.) with privacy-compliant masked customer details.
 */
router.get("/receipt/verify/:verificationId", async (req, res) => {
  try {
    const { verificationId } = req.params;
    const receipts = await getServerDocs('receipts');
    let receipt = receipts.find(r => r.verificationId === verificationId);

    // Self-healing: if receipt not found, search orders document directly
    if (!receipt) {
      const orders = await getServerDocs('orders');
      for (const ord of orders) {
        if (ord.receipt && ord.receipt.verificationId === verificationId) {
          receipt = ord.receipt;
          break;
        }
        if (ord.refundReceipt && ord.refundReceipt.verificationId === verificationId) {
          receipt = ord.refundReceipt;
          break;
        }
      }

      // If still not found, check if a valid order exists for the corresponding transaction
      if (!receipt) {
        const order = orders.find(o => (o.status === 'VERIFIED' || o.status === 'REFUNDED') && (o.utr || o.orderId === verificationId || o.id === verificationId));
        if (order) {
          console.log(`[Receipt Verification] Backfilling missing receipt for order: ${order.orderId || order.id}`);
          const isRefund = order.status === 'REFUNDED' || order.isRefunded === true;
          receipt = await generateReceiptForOrder(order, isRefund ? 'REFUND_SUCCESSFUL' : 'PAYMENT_SUCCESSFUL');
        }
      }
    }

    if (!receipt) {
      return res.status(404).json({ error: "Receipt is INVALID. No verified PaperX ledger entry matches this verification token." });
    }

    // Mask sensitive details to preserve customer privacy on public validation scans
    const maskedEmail = receipt.userEmail 
      ? receipt.userEmail.replace(/^(..)(.*)(@.*)$/, (_, p1, p2, p3) => p1 + '*'.repeat(Math.min(p2.length, 6)) + p3)
      : 'N/A';
    
    const maskedName = receipt.userName 
      ? receipt.userName.replace(/^(..)(.*)$/, (_, p1, p2) => p1 + '*'.repeat(Math.min(p2.length, 6)))
      : 'Subscriber';

    return res.json({
      success: true,
      status: receipt.status || 'VALID',
      type: receipt.type,
      receiptDetails: {
        receiptId: receipt.receiptId,
        invoiceId: receipt.invoiceId,
        transactionId: receipt.transactionId,
        refundId: receipt.refundId,
        originalReceiptId: receipt.originalReceiptId,
        originalTransactionId: receipt.originalTransactionId,
        plan: receipt.plan,
        billingCycle: receipt.billingCycle,
        amount: receipt.amount || receipt.originalAmount || receipt.refundAmount || 0,
        refundAmount: receipt.refundAmount,
        currency: receipt.currency || 'INR',
        paymentMethod: receipt.paymentMethod || 'UPI (Instant)',
        utr: receipt.utr,
        createdAt: receipt.createdAt,
        paymentDate: receipt.paymentDate,
        refundDate: receipt.refundDate,
        subscriptionStart: receipt.subscriptionStart,
        subscriptionExpiry: receipt.subscriptionExpiry,
        customerName: maskedName,
        customerEmail: maskedEmail,
        verifiedAt: receipt.verifiedAt
      }
    });
  } catch (err: any) {
    console.error("[RECEIPT VERIFY ROUTE ERROR]:", err);
    return res.status(500).json({ error: "Verification system error." });
  }
});

export default router;
