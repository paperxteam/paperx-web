import express from "express";
import { activeOrders } from "./paymentRoutes";
import { getServerDoc, getServerDocs, setServerDoc, saveSupportChatDoc } from "./serverDb";
import { sendTelegramSupportNotification, sendTelegramPaymentTicketNotification } from "./telegramBot";
import { generateSupportAnswer, generateAdminSuggestedAnswer } from "./supportAgent";
import { generateReceiptForOrder } from "./receiptGenerator";

const router = express.Router();
let ioInstance: any = null;

export function setAdminSocketIO(io: any) {
  ioInstance = io;
}

export function emitAdminAction(type: string, data: any) {
  if (ioInstance) {
    ioInstance.emit(type, data);
  }
}

// Global App Settings (Synced with Firestore)
export let globalAppSettings = {
  bannerText: "",
  bannerActive: false,
  themePreset: "default",
  announcementBadge: "✨ PaperX Secure Cloud",
  maintenanceMode: false,
};

// Initial sync with Firestore
async function syncSettings() {
  try {
    const settings = await getServerDoc('app_settings', 'global');
    if (settings) {
      globalAppSettings = { ...globalAppSettings, ...settings };
      console.log("[AdminRoutes] Settings synced from Firestore");
    }
  } catch (err) {
    console.warn("[AdminRoutes] Initial settings sync note:", err);
  }
}
syncSettings();

// Admin PIN
const ADMIN_PIN = process.env.ADMIN_SECRET_PIN || "1234";

router.get("/settings", (req, res) => {
  res.json({ success: true, settings: globalAppSettings });
});

router.post("/settings", async (req, res) => {
  const { pin, ...newSettings } = req.body;

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid Admin PIN." });
  }

  // Update in-memory
  globalAppSettings = { ...globalAppSettings, ...newSettings };

  // Persist to Firestore
  try {
    await setServerDoc('app_settings', 'global', globalAppSettings, true);
  } catch (err) {
    console.warn("[AdminRoutes] Failed to persist settings to Firestore:", err);
  }

  if (ioInstance) {
    ioInstance.emit("settings-updated", globalAppSettings);
  }

  return res.json({ success: true, settings: globalAppSettings });
});

// Dispatch Custom Notification / Admin Broadcast
router.post("/notifications/dispatch", async (req, res) => {
  try {
    const { pin, title, body, recipient, recipientEmail, priority, type, actionUrl, actionLabel, isUrgentPopup } = req.body;
    if (pin && pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "Invalid Admin PIN." });
    }

    if (!title || !body) {
      return res.status(400).json({ error: "Notification title and body are required." });
    }

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const notification = {
      id: notifId,
      title: title.trim(),
      body: body.trim(),
      recipient: recipient || 'ALL',
      recipientEmail: recipientEmail ? recipientEmail.trim().toLowerCase() : '',
      priority: priority || 'NORMAL',
      type: type || 'CUSTOM_MESSAGE',
      actionUrl: actionUrl || '',
      actionLabel: actionLabel || '',
      isUrgentPopup: isUrgentPopup === true,
      sender: 'Official Support',
      senderName: 'Operations Desk',
      createdAt: Date.now(),
      timestamp: Date.now(),
      readBy: []
    };

    // 1. Save to server doc / Firestore
    await setServerDoc('notifications', notifId, notification, true);

    // 2. Log in audit logs
    await setServerDoc('audit_logs', `log_${Date.now()}`, {
      action: 'NOTIFICATION_DISPATCH',
      admin: 'Admin',
      details: `Broadcasted "${title}" to ${recipient}${recipientEmail ? ` (${recipientEmail})` : ''}`,
      timestamp: Date.now()
    }, true).catch(() => {});

    // 3. Emit via Socket.IO for active real-time sessions
    if (ioInstance) {
      ioInstance.emit("admin-notification", notification);
    }

    return res.json({ success: true, notification });
  } catch (err: any) {
    console.error("[AdminRoutes] Notification dispatch failed:", err);
    return res.status(500).json({ error: err.message || "Failed to dispatch notification" });
  }
});

// Delete Notification
router.post("/notifications/delete", async (req, res) => {
  try {
    const { pin, notifId } = req.body;
    if (pin && pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "Invalid Admin PIN." });
    }

    if (!notifId) {
      return res.status(400).json({ error: "Notification ID required" });
    }

    // Mark inactive or delete
    await setServerDoc('notifications', notifId, { deleted: true, deletedAt: Date.now() }, true);
    
    if (ioInstance) {
      ioInstance.emit("notification-deleted", { notifId });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Send Direct Custom Message to a Specific User
router.post("/user/custom-message", async (req, res) => {
  try {
    const { pin, userId, userEmail, userName, title, message, priority, sendToSupportChat, isUrgentPopup, actionUrl, actionLabel } = req.body;
    if (pin && pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "Invalid Admin PIN." });
    }

    if (!userEmail && !userId) {
      return res.status(400).json({ error: "User ID or Email is required." });
    }
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required." });
    }

    const now = Date.now();
    const notifId = `msg_user_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const notification = {
      id: notifId,
      title: title.trim(),
      body: message.trim(),
      recipient: 'CUSTOM',
      recipientEmail: userEmail ? userEmail.trim().toLowerCase() : '',
      recipientUserId: userId || '',
      priority: priority || 'HIGH',
      type: 'CUSTOM_MESSAGE',
      actionUrl: actionUrl || '',
      actionLabel: actionLabel || '',
      isUrgentPopup: isUrgentPopup === true,
      sender: 'Official Support',
      senderName: 'Customer Care',
      createdAt: now,
      timestamp: now,
      readBy: []
    };

    // 1. Save Notification
    await setServerDoc('notifications', notifId, notification, true);

    // 2. If sendToSupportChat is enabled, also post into user's support chat
    if (sendToSupportChat) {
      const chatId = userId ? `user_${userId}` : `user_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const existingDoc = await getServerDoc('support_chats', chatId);
      const messages = existingDoc ? (existingDoc.messages || []) : [];
      
      const adminChatMsg = {
        id: `msg_admin_${now}`,
        sender: 'admin',
        senderName: 'Official Support',
        text: `📌 **${title}**\n\n${message}`,
        timestamp: now,
        isSystemNotice: true
      };
      messages.push(adminChatMsg);

      await setServerDoc('support_chats', chatId, {
        userId: userId || '',
        userEmail: userEmail || '',
        userName: userName || 'Customer',
        messages,
        lastMessage: `📌 [Admin Message] ${title}`,
        updatedAt: now,
        status: 'active'
      }, true);
    }

    // 3. Socket broadcast
    if (ioInstance) {
      ioInstance.emit("admin-notification", notification);
    }

    return res.json({ success: true, notification });
  } catch (err: any) {
    console.error("[AdminRoutes] User custom message failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Update User Details (Role, Plan, Status)
router.post("/user/update", async (req, res) => {
  try {
    const { pin, userId, ...updates } = req.body;
    if (pin && pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "Invalid Admin PIN." });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Persist to Firestore
    await setServerDoc('users', userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, true);

    // Emit via Socket.IO
    if (ioInstance) {
      ioInstance.emit("user-updated", { userId, ...updates });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[AdminRoutes] User update failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Update Ticket Status (Refunds)
router.post("/ticket/action", async (req, res) => {
  try {
    const { pin, ticketId, status, reason } = req.body;
    if (pin && pin !== ADMIN_PIN) {
      return res.status(401).json({ error: "Invalid Admin PIN." });
    }

    if (!ticketId || !status) {
      return res.status(400).json({ error: "Ticket ID and status are required." });
    }

    const ticket = await getServerDoc('support_tickets', ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const updateData = {
      status,
      adminDecision: reason || status,
      updatedAt: Date.now()
    };

    await setServerDoc('support_tickets', ticketId, updateData, true);

    // Update linked order if exists
    if (ticket.orderId) {
      const orderUpdatePayload: any = {
        ticketStatus: status,
        updatedAt: Date.now()
      };
      if (status === 'COMPLETED' || status === 'REFUNDED') {
          orderUpdatePayload.status = 'REFUNDED';
      }

      await setServerDoc('orders', ticket.orderId, orderUpdatePayload, true).catch(() => {});
      
      // Auto-downgrade the user if the refund was completed to Basic 5-day Plan
      if ((status === 'COMPLETED' || status === 'REFUNDED') && ticket.uid) {
         // Generate immutable server-side REFUND SUCCESSFUL receipt
         try {
           const orders = await getServerDocs('orders');
           const order = orders.find((o: any) => o.orderId === ticket.orderId || o.id === ticket.orderId);
           if (order) {
             const receipts = await getServerDocs('receipts');
             const originalReceipt = receipts.find((r: any) => r.orderId === ticket.orderId && r.type === 'PAYMENT_SUCCESSFUL');
             await generateReceiptForOrder(order, 'REFUND_SUCCESSFUL', originalReceipt);
             console.log(`[Receipt System] Automatically generated refund receipt for ticket order: ${ticket.orderId}`);
           }
         } catch (err) {
           console.error("[Receipt System] Error generating refund receipt:", err);
         }

         const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
         const fiveDaysExpiresAt = new Date(Date.now() + fiveDaysMs).toISOString();
         await setServerDoc('users', ticket.uid, {
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
         }, true).catch(() => {});
         
         if (ioInstance) {
            ioInstance.emit("user-updated", { 
                userId: ticket.uid, 
                plan: 'Basic Plan',
                purchasedPlan: 'Basic Plan',
                activePlanMode: 'Basic Plan',
                isPro: false,
                isRefunded: true,
                membershipTier: 'free',
                billingCycle: 'month',
                planExpiresAt: fiveDaysExpiresAt,
                maxProjects: 5 
            });
         }
      }
    }

    // Emit via Socket.IO
    if (ioInstance) {
      ioInstance.emit("ticket-updated", { ticketId, status, orderId: ticket.orderId });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[AdminRoutes] Ticket action failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/orders", async (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid Admin PIN." });
  }

  try {
    const ordersMap = new Map<string, any>();

    // Load in-memory active orders first
    for (const order of activeOrders.values()) {
      ordersMap.set(order.orderId, { ...order });
    }

    // Load persisted orders from Firestore
    const dbOrders = await getServerDocs('orders').catch(() => []);
    for (const d of dbOrders) {
      const id = d.orderId || d.id;
      if (id) {
        const existing = ordersMap.get(id);
        const definitiveStatus = (d.status === 'VERIFIED' || d.status === 'COMPLETED' || d.status === 'REJECTED') 
          ? d.status 
          : (existing?.status || d.status);
        ordersMap.set(id, { ...existing, ...d, status: definitiveStatus, orderId: id });
      }
    }

    const ordersList = Array.from(ordersMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    res.json({ success: true, orders: ordersList });
  } catch (err: any) {
    console.error("[AdminRoutes] Failed to fetch orders:", err);
    const ordersList = Array.from(activeOrders.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, orders: ordersList });
  }
});

router.post("/order/action", async (req, res) => {
  const { pin, orderId, action } = req.body;

  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "Invalid Admin PIN." });
  }

  // Always fetch latest from Firestore to ensure we have ticketId and recent updates
  const dbOrder = await getServerDoc('orders', orderId).catch(() => null);
  let order: any = null;
  
  if (dbOrder) {
    order = { ...dbOrder, orderId };
    // Update in-memory cache
    activeOrders.set(orderId, order);
  } else {
    // Fallback to in-memory if Firestore fails/missing
    order = activeOrders.get(orderId);
  }

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  if (action === 'APPROVE') {
    order.status = 'VERIFIED';
    order.verifiedAt = Date.now();
    activeOrders.set(orderId, order);

    const updateData: any = {
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If there's an associated ticket, resolve it
    if (order.ticketId) {
      updateData.ticketStatus = 'RESOLVED';
      await setServerDoc('support_tickets', order.ticketId, {
        status: 'RESOLVED',
        adminDecision: 'Payment Verified & Membership Activated',
        updatedAt: Date.now()
      }, true).catch(() => {});
    }

    // Persist verified status to Firestore 'orders'
    await setServerDoc('orders', orderId, updateData, true);

    // Upgrade user's plan in Firestore 'users'
    if (order.uid && order.uid !== 'guest_user') {
      const targetPlan = String(order.plan || 'Plus Plan');
      const isPro = !targetPlan.toLowerCase().includes('free') && !targetPlan.toLowerCase().includes('basic');
      const tier = targetPlan.toLowerCase().includes('max') ? 'max' : 'plus';

      await setServerDoc('users', order.uid, {
        plan: targetPlan,
        purchasedPlan: targetPlan,
        activePlanMode: targetPlan,
        status: 'ACTIVE',
        paymentStatus: 'VERIFIED',
        isPro: isPro,
        maxProjects: 9999,
        membershipTier: tier,
        subscriptionStatus: 'active',
        billingCycle: order.billingCycle || 'month',
        planPurchasedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, true);
    }

    // Push notification to user
    const notifId = `notif_order_${orderId}_verified`;
    await setServerDoc('notifications', notifId, {
      id: notifId,
      title: "Payment Approved! 🎉",
      body: `Your payment for ${order.plan || 'Membership'} has been verified. Your account has been upgraded!`,
      recipient: order.uid || 'ALL',
      recipientUserId: order.uid || '',
      recipientEmail: order.userEmail || '',
      priority: 'HIGH',
      type: 'PAYMENT_VERIFIED',
      createdAt: Date.now(),
      timestamp: Date.now()
    }, true).catch(() => {});

    if (ioInstance) {
      ioInstance.emit("order-updated", { orderId, status: 'VERIFIED' });
      ioInstance.emit("admin-notification", {
        id: notifId,
        title: "Payment Approved! 🎉",
        body: `Order ${orderId} has been verified.`
      });
    }

    // Generate the real, immutable PAYMENT SUCCESSFUL receipt securely on the server
    await generateReceiptForOrder(order, 'PAYMENT_SUCCESSFUL').catch((err) => {
      console.error("[Receipt System] Error generating receipt during approval:", err);
    });

    return res.json({ success: true, message: `Order ${orderId} approved successfully.` });
  } else if (action === 'REJECT') {
    const rawReason = req.body.rejectionReason || req.body.reason;
    const finalReason = (rawReason && typeof rawReason === 'string' && rawReason.trim())
      ? rawReason.trim()
      : 'Wrong UTR / Unmatched: No matching transaction credit or funds were received in merchant account';
    order.status = 'REJECTED';
    (order as any).rejectionReason = finalReason;
    activeOrders.set(orderId, order);

    // Persist rejected status to Firestore 'orders'
    await setServerDoc('orders', orderId, {
      status: 'REJECTED',
      rejectionReason: finalReason,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, true);

    const notifId = `notif_order_${orderId}_rejected`;
    await setServerDoc('notifications', notifId, {
      id: notifId,
      title: "Payment Verification Notice",
      body: `Your payment for Order ${orderId} could not be verified: ${finalReason}`,
      recipient: order.uid || 'ALL',
      recipientUserId: order.uid || '',
      recipientEmail: order.userEmail || '',
      priority: 'HIGH',
      type: 'PAYMENT_REJECTED',
      createdAt: Date.now(),
      timestamp: Date.now()
    }, true).catch(() => {});

    if (ioInstance) ioInstance.emit("order-updated", { orderId, status: 'REJECTED', reason: finalReason });
    return res.json({ success: true, message: `Order ${orderId} marked as invalid/rejected.`, reason: finalReason });
  }

  return res.status(400).json({ error: "Invalid action." });
});

// Support Query Notification
router.post("/support/notify", async (req, res) => {
  try {
    const { userId, userName, userEmail, query, chatId, hasBotAnswer } = req.body;
    
    // 1. Dispatch background notify to Telegram bot
    await sendTelegramSupportNotification({ userId, userName, userEmail, query, chatId });
    
    // 2. Respond immediately to the client to avoid blocking the UI
    res.json({ success: true });

    // 3. Process accurate Gemini support response in the background
    if (chatId && query && !hasBotAnswer) {
      (async () => {
        try {
          const botReply = await generateSupportAnswer(query, userEmail, userName);
          const botNow = Date.now();
          const botMsg = {
            id: `msg_bot_${botNow}`,
            sender: 'bot',
            senderName: 'PaperX Assistant',
            text: botReply,
            timestamp: botNow
          };

          const existingDoc = await getServerDoc('support_chats', chatId);
          const messages = existingDoc ? (existingDoc.messages || []) : [];
          
          // Check if the message is already present to prevent duplicates (e.g. if saved during active topic)
          const isDuplicate = messages.some((m: any) => m.text === botReply && Math.abs(m.timestamp - botNow) < 5000);
          if (!isDuplicate) {
            messages.push(botMsg);
            await setServerDoc('support_chats', chatId, {
              messages,
              lastMessage: botReply,
              updatedAt: botNow,
              status: 'active'
            }, true);
          }
        } catch (bgErr) {
          console.error("[AdminRoutes] Background support response failed:", bgErr);
        }
      })();
    }
  } catch (err) {
    console.error("[AdminRoutes] Support notification failed:", err);
    res.status(500).json({ error: "Failed to notify admin" });
  }
});

// Admin Smart Answer Generation for User Queries
router.post("/support/suggest", async (req, res) => {
  try {
    const { query, userEmail, userName, userPlan, tone } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    const resolution = await generateAdminSuggestedAnswer(query, userEmail, userName, userPlan, tone);
    res.json({ success: true, resolution });
  } catch (err: any) {
    console.error("[AdminRoutes] Failed to generate admin suggested answer:", err);
    res.status(500).json({ error: "Failed to generate suggested answer" });
  }
});

// Sync User from Authenticated Client-Side
router.post("/sync-user", async (req, res) => {
  try {
    const user = req.body;
    if (!user || (!user.uid && !user.id)) {
      return res.status(400).json({ error: "Missing user uid or id" });
    }
    const uid = user.uid || user.id;
    const cachedUser = await getServerDoc('users', uid);
    
    if (cachedUser) {
      // Overwrite mutable profile properties while preserving admin status settings
      const merged = {
        ...user,
        status: cachedUser.status || user.status || 'ACTIVE',
        plan: cachedUser.plan || user.plan || 'Basic Plan',
        forceLogout: cachedUser.forceLogout === true,
        forceReLogin: cachedUser.forceReLogin === true,
        isBlocked: cachedUser.isBlocked === true || cachedUser.status === 'DISABLED',
        id: uid,
        uid: uid
      };
      await setServerDoc('users', uid, merged, true);
      return res.json(merged);
    } else {
      const newUser = {
        ...user,
        status: user.status || 'ACTIVE',
        plan: user.plan || 'Basic Plan',
        forceLogout: false,
        forceReLogin: false,
        isBlocked: user.status === 'DISABLED',
        id: uid,
        uid: uid
      };
      await setServerDoc('users', uid, newUser, true);
      return res.json(newUser);
    }
  } catch (err) {
    console.error("[AdminRoutes] User sync failed:", err);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

// Raise Payment Dispute / Membership Issue Ticket and Alert Telegram Admin
router.post("/tickets/raise", async (req, res) => {
  try {
    const { orderId, uid, userEmail, userName, plan, amount, utr, orderStatus, reason, notes, upiId, payoutPhone, payoutName, qrCodeBase64 } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "Missing required user identification" });
    }

    const now = Date.now();
    const isRefundRequest = reason && reason.toLowerCase().includes('refund');

    // Strict Refund Validation: Must be < 10 feature/document usages and within 2 days (48 hours)
    if (isRefundRequest) {
      let orderTime = now;
      if (orderId) {
        const orderData: any = await getServerDoc('orders', orderId).catch(() => null);
        if (orderData) {
          orderTime = new Date(orderData.createdAt || orderData.submittedAt || now).getTime();
        }
      }
      // 2-Day Refund Guarantee: Supports 2 calendar days or up to 72 hours to accommodate timezones and day boundaries
      const isWithin2Days = (now - orderTime) <= 3 * 24 * 60 * 60 * 1000 || Math.floor((now - orderTime) / (24 * 60 * 60 * 1000)) <= 2;
      const userData: any = await getServerDoc('users', uid).catch(() => null);
      const featureUsage = Math.max(Number(userData?.featureUsageCount || 0), Number(userData?.projectsUsed || 0));
      const isEligibleUsage = featureUsage < 10;

      if (!isWithin2Days || !isEligibleUsage) {
        let errReason = '';
        if (!isWithin2Days && !isEligibleUsage) {
          errReason = 'Exceeded 2 days limit & 10 feature usages';
        } else if (!isWithin2Days) {
          errReason = 'Exceeded 2 days limit since purchase';
        } else {
          errReason = `Exceeded 10 feature/document usages (${featureUsage}/10 used)`;
        }
        return res.status(400).json({
          error: `Refund not valid: ${errReason}. You must have used less than 10 features or documents, and requested within 2 days.`
        });
      }

      // Smoothly and automatically downgrade to Basic 5-day Plan
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const fiveDaysExpiresAt = new Date(now + fiveDaysMs).toISOString();
      await setServerDoc('users', uid, {
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
      }, true).catch(() => {});

      if (ioInstance) {
        ioInstance.emit("user-updated", {
          userId: uid,
          plan: 'Basic Plan',
          purchasedPlan: 'Basic Plan',
          activePlanMode: 'Basic Plan',
          isPro: false,
          isRefunded: true,
          membershipTier: 'free',
          billingCycle: 'month',
          planExpiresAt: fiveDaysExpiresAt,
          maxProjects: 5
        });
      }
    }

    const ticketId = `TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const ticketRecord = {
      id: ticketId,
      ticketId,
      orderId: orderId || '',
      uid,
      userEmail: userEmail || '',
      userName: userName || 'User',
      plan: plan || 'Plus Plan',
      amount: amount || 0,
      utr: utr || '',
      orderStatus: orderStatus || 'PENDING',
      reason: reason || 'Membership not activated after payment',
      notes: notes || '',
      upiId: upiId || '',
      payoutPhone: payoutPhone || '',
      payoutName: payoutName || '',
      qrCodeBase64: qrCodeBase64 || '',
      status: 'OPEN',
      createdAt: now,
      createdAtIso: new Date(now).toISOString(),
      updatedAt: now
    };

    // 1. Save ticket to Firestore
    await setServerDoc('support_tickets', ticketId, ticketRecord, true);

    // 2. If an orderId was supplied, link the ticket to the order
    if (orderId) {
      await setServerDoc('orders', orderId, {
        ticketId,
        ticketStatus: 'OPEN',
        ticketCreatedAt: now,
        ticketReason: reason || 'Membership not activated after payment'
      }, true);
    }

    // 3. Dispatch real-time Telegram Bot Notification with 1-click admin action buttons
    sendTelegramPaymentTicketNotification({
      ticketId,
      orderId: orderId || 'N/A',
      uid,
      userEmail: userEmail || '',
      userName: userName || 'User',
      plan: plan || 'Plus Plan',
      amount: amount || 0,
      utr: utr || '',
      orderStatus: orderStatus || 'PENDING',
      reason: reason || 'Membership not activated',
      notes: notes || ''
    }).catch(err => console.warn('[AdminRoutes] Telegram ticket alert error:', err));

    // 4. Emit to connected Admin Web Sockets if online
    if (ioInstance) {
      ioInstance.emit("ticket-raised", ticketRecord);
    }

    return res.json({
      success: true,
      ticketId,
      ticket: ticketRecord
    });
  } catch (error: any) {
    console.error("[AdminRoutes] Error raising payment ticket:", error);
    return res.status(500).json({ error: "Failed to submit ticket." });
  }
});

export default router;
