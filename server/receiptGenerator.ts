import crypto from "node:crypto";
import { setServerDoc, getServerDocs } from "./serverDb";

export interface ReceiptRecord {
  receiptId: string;
  invoiceId?: string;
  orderId: string;
  transactionId?: string;
  refundId?: string;
  originalReceiptId?: string;
  originalTransactionId?: string;
  uid: string;
  userName: string;
  userEmail: string;
  plan?: string;
  billingCycle?: string;
  durationDays?: number;
  amount?: number;
  originalAmount?: number;
  refundAmount?: number;
  currency: string;
  paymentMethod: string;
  utr?: string;
  paymentDate?: string;
  refundDate?: string;
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  status: 'VALID' | 'REFUNDED' | 'CANCELLED';
  verifiedAt: string;
  createdAt: string;
  verificationId: string;
  type: 'PAYMENT_SUCCESSFUL' | 'REFUND_SUCCESSFUL';
  reason?: string;
  subscriptionStatusAfter?: string;
}

/**
 * Generate a cryptographically secure, immutable, unique receipt record
 */
export async function generateReceiptForOrder(
  order: any, 
  type: 'PAYMENT_SUCCESSFUL' | 'REFUND_SUCCESSFUL' = 'PAYMENT_SUCCESSFUL',
  originalReceipt?: any
): Promise<ReceiptRecord> {
  const isRefund = type === 'REFUND_SUCCESSFUL';
  const prefix = isRefund ? 'RF' : 'RC';
  
  // Create unique cryptographically secure IDs
  const receiptId = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const transactionId = `TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const refundId = isRefund ? `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}` : undefined;
  const verificationId = crypto.randomBytes(16).toString('hex');
  
  const nowStr = new Date().toISOString();
  const targetPlan = order.plan || 'Plus Plan';
  const durationDays = order.durationDays || 30;

  // Exact dates
  const subscriptionStart = order.verifiedAt 
    ? (typeof order.verifiedAt === 'number' ? new Date(order.verifiedAt).toISOString() : String(order.verifiedAt))
    : nowStr;
  
  const subscriptionExpiry = new Date(new Date(subscriptionStart).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  let receiptDoc: ReceiptRecord;

  if (!isRefund) {
    receiptDoc = {
      receiptId,
      invoiceId,
      orderId: order.orderId || order.id,
      transactionId: order.utr ? `TX-${order.utr}` : transactionId,
      uid: order.uid,
      userName: order.userName || order.userEmail?.split('@')[0] || 'Subscriber',
      userEmail: order.userEmail || '',
      plan: targetPlan,
      billingCycle: order.billingCycle || 'month',
      durationDays,
      amount: Number(order.amount) || 50,
      currency: order.currency || 'INR',
      paymentMethod: 'UPI (Instant)',
      utr: order.utr || 'Verified',
      paymentDate: subscriptionStart,
      subscriptionStart,
      subscriptionExpiry,
      status: 'VALID',
      verifiedAt: subscriptionStart,
      createdAt: nowStr,
      verificationId,
      type
    };
  } else {
    const origReceiptId = originalReceipt?.receiptId || `RC-PRE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const origTxId = originalReceipt?.transactionId || (order.utr ? `TX-${order.utr}` : `TX-PRE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);
    
    receiptDoc = {
      receiptId,
      originalReceiptId: origReceiptId,
      originalTransactionId: origTxId,
      refundId: refundId!,
      orderId: order.orderId || order.id,
      uid: order.uid,
      userName: order.userName || order.userEmail?.split('@')[0] || 'Subscriber',
      userEmail: order.userEmail || '',
      originalAmount: Number(order.amount) || 50,
      refundAmount: Number(order.amount) || 50,
      currency: order.currency || 'INR',
      paymentMethod: 'UPI (Instant)',
      utr: order.utr || 'Verified',
      refundDate: nowStr,
      status: 'REFUNDED',
      reason: order.ticketReason || 'Refund processed',
      subscriptionStatusAfter: 'Basic Plan',
      verifiedAt: nowStr,
      createdAt: nowStr,
      verificationId,
      type
    };
  }

  // Persist to Firestore receipts collection
  await setServerDoc('receipts', receiptId, receiptDoc);

  // Also persist directly into the Order document for permanent dual-persistence
  const orderDocId = order.orderId || order.id;
  if (orderDocId) {
    if (!isRefund) {
      await setServerDoc('orders', orderDocId, { 
        receipt: receiptDoc, 
        receiptId: receiptDoc.receiptId,
        paymentVerifiedReceiptGenerated: true
      }, true).catch(() => {});
    } else {
      await setServerDoc('orders', orderDocId, { 
        refundReceipt: receiptDoc, 
        refundReceiptId: receiptDoc.receiptId,
        refundReceiptGenerated: true
      }, true).catch(() => {});
    }
  }

  console.log(`[Receipt Generator] Successfully generated and stored ${type} receipt: ${receiptId} for order ${orderDocId}`);
  return receiptDoc;
}

/**
 * Fetch all available receipts for an order (both payment and refund receipts)
 */
export async function getAllReceiptsForOrder(orderId: string, uid?: string): Promise<ReceiptRecord[]> {
  const result: ReceiptRecord[] = [];
  try {
    const receipts = await getServerDocs('receipts');
    const matching = receipts.filter(r => r.orderId === orderId);
    result.push(...matching);

    // Also check order document directly
    const orders = await getServerDocs('orders');
    const order = orders.find(o => (o.orderId === orderId || o.id === orderId));
    if (order) {
      if (order.receipt && !result.some(r => r.receiptId === order.receipt.receiptId)) {
        result.push(order.receipt);
      }
      if (order.refundReceipt && !result.some(r => r.receiptId === order.refundReceipt.receiptId)) {
        result.push(order.refundReceipt);
      }

      // Self-heal: If order is verified or paid, ensure payment receipt exists
      const isVerified = ['VERIFIED', 'COMPLETED', 'SUCCESS', 'PAID', 'APPROVED'].includes(String(order.status || '').toUpperCase());
      const isRefunded = order.status === 'REFUNDED' || order.isRefunded === true || 
        (order.ticketStatus === 'COMPLETED' && String(order.ticketReason || '').toLowerCase().includes('refund'));

      if ((isVerified || isRefunded) && !result.some(r => r.type === 'PAYMENT_SUCCESSFUL')) {
        const payRc = await generateReceiptForOrder(order, 'PAYMENT_SUCCESSFUL');
        result.push(payRc);
      }

      // Self-heal: If order is refunded, ensure refund receipt exists
      if (isRefunded && !result.some(r => r.type === 'REFUND_SUCCESSFUL')) {
        const origRc = result.find(r => r.type === 'PAYMENT_SUCCESSFUL');
        const refRc = await generateReceiptForOrder(order, 'REFUND_SUCCESSFUL', origRc);
        result.push(refRc);
      }
    }

    // Security check if uid provided
    if (uid) {
      const unauthorized = result.some(r => r.uid && r.uid !== uid && !uid.startsWith('guest_') && r.uid !== 'guest_user');
      if (unauthorized && order && order.uid && order.uid !== uid) {
        console.warn(`[ReceiptGenerator] Unauthorized access attempt for order ${orderId} by user ${uid}`);
        return [];
      }
    }

    return result;
  } catch (err) {
    console.error(`[ReceiptGenerator] Error fetching all receipts for ${orderId}:`, err);
    return result;
  }
}

/**
 * High-performance query handler for fetching or dynamically backfilling a receipt
 */
export async function getReceiptForOrder(
  orderId: string, 
  uid?: string,
  preferredType?: 'PAYMENT_SUCCESSFUL' | 'REFUND_SUCCESSFUL'
): Promise<ReceiptRecord | null> {
  console.log(`[ReceiptGenerator] Fetching receipt for order: ${orderId}, preferredType: ${preferredType || 'ANY'}`);
  try {
    const allReceipts = await getAllReceiptsForOrder(orderId, uid);

    if (allReceipts.length > 0) {
      if (preferredType) {
        const exact = allReceipts.find(r => r.type === preferredType);
        if (exact) return exact;
      }

      // Check orders to see whether this order is refunded
      const orders = await getServerDocs('orders');
      const order = orders.find(o => (o.orderId === orderId || o.id === orderId));
      const isRefunded = order ? (order.status === 'REFUNDED' || order.isRefunded === true) : false;

      if (isRefunded) {
        const refundRc = allReceipts.find(r => r.type === 'REFUND_SUCCESSFUL');
        if (refundRc) return refundRc;
      }

      return allReceipts[0];
    }

    // If still no receipts found, attempt direct backfill from orders
    console.log(`[ReceiptGenerator] Receipt not found for ${orderId}, checking orders for backfill...`);
    const orders = await getServerDocs('orders');
    const order = orders.find(o => (o.orderId === orderId || o.id === orderId));
    
    if (order) {
      const normStatus = String(order.status || '').toUpperCase();
      const isRefunded = normStatus === 'REFUNDED' || order.isRefunded === true;
      const isVerified = ['VERIFIED', 'COMPLETED', 'SUCCESS', 'PAID', 'APPROVED'].includes(normStatus);

      if (isRefunded || preferredType === 'REFUND_SUCCESSFUL') {
        const paymentRc = await generateReceiptForOrder(order, 'PAYMENT_SUCCESSFUL');
        const refundRc = await generateReceiptForOrder(order, 'REFUND_SUCCESSFUL', paymentRc);
        return preferredType === 'PAYMENT_SUCCESSFUL' ? paymentRc : refundRc;
      } else if (isVerified) {
        return await generateReceiptForOrder(order, 'PAYMENT_SUCCESSFUL');
      }
    }

    return null;
  } catch (err: any) {
    console.error(`[ReceiptGenerator] Error fetching/generating receipt for ${orderId}:`, err);
    return null;
  }
}
