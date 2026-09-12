import TelegramBot from 'node-telegram-bot-api';
import fs from 'node:fs';
import path from 'node:path';
import {
  getServerDoc,
  getServerDocs,
  setServerDoc,
  updateServerDoc,
  deleteServerDoc,
  pushChatMessage,
  getAllSupportChatDocs
} from './serverDb';
import { activeOrders } from './paymentRoutes';
import { generateAdminSuggestedAnswer } from './supportAgent';
import { emitAdminAction } from './adminRoutes';

const getBotToken = (): string | undefined => {
  return process.env.TELEGRAM_BOT_TOKEN;
};

let bot: TelegramBot | null = null;

// Track all active Telegram admin chat IDs dynamically
const activeAdminChatIds = new Set<string | number>();
if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
  activeAdminChatIds.add(process.env.TELEGRAM_ADMIN_CHAT_ID);
}
activeAdminChatIds.add("8714130508");
activeAdminChatIds.add(8714130508);

// In-memory cache for recent AI suggested resolutions per chat
const cachedAiResolutions = new Map<string, string>();

/**
 * Safe HTML string escaper for Telegram HTML parse mode.
 * Guarantees that user queries, names, emails, and symbols NEVER cause 400 Bad Request entity errors.
 */
export const escapeHtml = (text: string | number | undefined | null): string => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Universal broadcast function to send Telegram alerts to all configured and active admin chats.
 * Uses Promise.allSettled and has a direct Telegram REST API fallback if polling or bot instance is busy.
 */
export const broadcastToAdmins = async (htmlText: string, replyMarkup?: any) => {
  const token = getBotToken();
  if (!token) {
    console.warn("[Telegram Bot] No TELEGRAM_BOT_TOKEN configured. Notification skipped.");
    return;
  }

  // Ensure default admin IDs are always present
  if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
    activeAdminChatIds.add(process.env.TELEGRAM_ADMIN_CHAT_ID);
  }
  activeAdminChatIds.add("8714130508");

  const recipients = Array.from(activeAdminChatIds);
  if (recipients.length === 0) return;

  const tasks = recipients.map(async (adminChatId) => {
    try {
      if (bot) {
        await bot.sendMessage(adminChatId, htmlText, {
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        });
        return;
      }
    } catch (err: any) {
      console.warn(`[Telegram Bot] bot.sendMessage failed for ${adminChatId} (${err.message}). Trying REST API fallback...`);
    }

    // Direct REST API Fallback (Guarantees delivery even if bot polling is reconnecting)
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: htmlText,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Telegram REST Fallback] Failed to send to ${adminChatId}:`, errorText);
      }
    } catch (restErr: any) {
      console.error(`[Telegram REST Fallback] Network error sending to ${adminChatId}:`, restErr.message || restErr);
    }
  });

  await Promise.allSettled(tasks);
};

// Short token registry to ensure Telegram inline button callback_data never exceeds the 64-byte limit
const TOKEN_CACHE_PATH = path.join(process.cwd(), 'server', 'token_registry.json');
let shortTokenMap = new Map<string, string>();
let fullTokenMap = new Map<string, string>();
let shortIdCounter = 1000;

// Load tokens from disk on startup
const loadTokens = () => {
  try {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
      const raw = fs.readFileSync(TOKEN_CACHE_PATH, 'utf8');
      const data = JSON.parse(raw);
      shortTokenMap = new Map(Object.entries(data.shortToFull || {}));
      fullTokenMap = new Map(Object.entries(data.fullToShort || {}));
      shortIdCounter = data.counter || 1000;
      console.log(`[Telegram Bot] Loaded ${shortTokenMap.size} tokens from registry.`);
    }
  } catch (err) {
    console.warn("[Telegram Bot] Failed to load token registry:", err);
  }
};

const saveTokens = () => {
  try {
    const data = {
      shortToFull: Object.fromEntries(shortTokenMap),
      fullToShort: Object.fromEntries(fullTokenMap),
      counter: shortIdCounter
    };
    const dirPath = path.dirname(TOKEN_CACHE_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn("[Telegram Bot] Failed to save token registry:", err);
  }
};

loadTokens();

export const toShortToken = (fullId: string): string => {
  if (!fullId) return '';
  // Optimization: If it's already short enough for Telegram's 64-byte limit, don't map it.
  // We use 40 as a safe limit to allow for prefixes like 'rj|' or 'tickstat|' and suffixes.
  if (fullId.length <= 40 && !fullId.includes('|')) return fullId;
  
  if (fullTokenMap.has(fullId)) {
    return fullTokenMap.get(fullId)!;
  }
  const shortKey = `k${(++shortIdCounter).toString(36)}`;
  shortTokenMap.set(shortKey, fullId);
  fullTokenMap.set(fullId, shortKey);
  saveTokens();
  return shortKey;
};

export const fromShortToken = (shortKeyOrFull: string): string => {
  if (!shortKeyOrFull) return '';
  return shortTokenMap.get(shortKeyOrFull) || shortKeyOrFull;
};

// Helper to recover ID from message text if short token lookup fails (e.g. after restart)
const recoverIdFromMessage = (text: string | undefined): string => {
  if (!text) return '';
  // Try Order ID match: `• *Order ID:* \`PX-404...\`` or `💳 *Pending Order: \`PX-...\`*`
  const orderMatch = text.match(/(?:Order ID|Pending Order):?\s*[`]([^`]+)[`]/i);
  if (orderMatch) return orderMatch[1];
  // Try Ticket ID match: `• *Ticket ID:* \`TICK-...\`` or `*Ticket:* \`TICK-...\``
  const ticketMatch = text.match(/Ticket(?: ID)?:?\s*[`]([^`]+)[`]/i);
  if (ticketMatch) return ticketMatch[1];
  // Try User ID match: `• *User ID:* \`user_...\``
  const userMatch = text.match(/User ID:?\s*[`]([^`]+)[`]/i);
  if (userMatch) return userMatch[1];
  // Try Chat Thread match: `• *Chat Thread:* \`user_...\``
  const chatMatch = text.match(/Chat Thread:?\s*[`]([^`]+)[`]/i);
  if (chatMatch) return chatMatch[1];
  return '';
};

export const registerAdminChatId = (chatId: string | number) => {
  if (chatId) {
    activeAdminChatIds.add(chatId);
  }
};

/**
 * Real-time notification when a user initiates checkout / clicks Buy Membership.
 */
export const sendTelegramCheckoutNotification = async (data: {
  orderId: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  plan: string;
  billingCycle?: string;
  amount: number;
}) => {
  const sOrderId = toShortToken(data.orderId);
  const sUid = toShortToken(data.uid);

  const html = `🛒 <b>NEW MEMBERSHIP CHECKOUT STARTED</b>\n\n` +
    `• <b>User:</b> <code>${escapeHtml(data.userName || 'User')}</code> (${escapeHtml(data.userEmail || 'No email')})\n` +
    `• <b>User ID:</b> <code>${escapeHtml(data.uid)}</code>\n` +
    `• <b>Plan:</b> <b>${escapeHtml(data.plan.toUpperCase())}</b> (${escapeHtml(data.billingCycle || 'month')})\n` +
    `• <b>Amount:</b> <b>₹${data.amount}</b>\n` +
    `• <b>Order ID:</b> <code>${escapeHtml(data.orderId)}</code>\n` +
    `• <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
    `⚡ <i>User opened payment QR and is preparing UPI payment.</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ Pre-Approve Pro", callback_data: `ap|${sOrderId}` },
        { text: "💬 Send Message", callback_data: `msg|${sUid}` }
      ]
    ]
  };

  await broadcastToAdmins(html, inlineKeyboard);
};

export const sendTelegramAdminNotification = async (
  orderId: string,
  uid: string,
  plan: string,
  amount: number,
  utr: string,
  extra?: { userEmail?: string; userName?: string; billingCycle?: string; isResubmission?: boolean }
) => {
  const sOrderId = toShortToken(orderId);
  const sUid = toShortToken(uid);

  const isResub = extra?.isResubmission === true;

  const header = isResub 
    ? `🔄 <b>CORRECTED UTR SUBMITTED FOR ORDER</b>\n⚠️ <i>(Previous UTR was Rejected - User provided new 12-digit UTR)</i>`
    : `🚨 <b>NEW PAPERX PAYMENT SUBMISSION</b>`;

  const html = `${header}\n\n` +
    `• <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>\n` +
    `• <b>User:</b> <code>${escapeHtml(extra?.userName || 'User')}</code> (${escapeHtml(extra?.userEmail || uid)})\n` +
    `• <b>User ID:</b> <code>${escapeHtml(uid)}</code>\n` +
    `• <b>Plan:</b> <b>${escapeHtml(plan.toUpperCase())}</b> (${escapeHtml(extra?.billingCycle || 'month')})\n` +
    `• <b>Amount:</b> <b>₹${amount}</b>\n` +
    `• <b>12-Digit UTR:</b> <code>${escapeHtml(utr || 'Not provided yet')}</code>\n` +
    `• <b>Status:</b> <b>UNDER VERIFICATION</b>\n` +
    `• <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
    `⚡ <b>Choose an instant membership action below:</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ Approve Membership", callback_data: `ap|${sOrderId}` }
      ],
      [
        { text: "❌ Reject: Invalid UTR", callback_data: `rj|${sOrderId}|utr` },
        { text: "❌ Reject: Payment Failed", callback_data: `rj|${sOrderId}|fail` }
      ],
      [
        { text: "💬 Send Stuck Money Message", callback_data: `msg|${sUid}` }
      ]
    ]
  };

  await broadcastToAdmins(html, inlineKeyboard);
};

export const sendTelegramPaymentTicketNotification = async (data: {
  ticketId: string;
  orderId: string;
  uid: string;
  userEmail: string;
  userName?: string;
  plan: string;
  amount: number;
  utr?: string;
  orderStatus: string;
  reason?: string;
  notes?: string;
  upiId?: string;
  payoutPhone?: string;
  payoutName?: string;
}) => {
  const sTicketId = toShortToken(data.ticketId);
  const sOrderId = toShortToken(data.orderId || data.ticketId);
  const sUid = toShortToken(data.uid);

  const isRefundTicket = (data.reason || '').toLowerCase().includes('refund') || (data.reason || '').toLowerCase().includes('upgrade');

  let html = isRefundTicket 
    ? `💸 <b>2-DAY MEMBERSHIP REFUND REQUEST</b>\n\n` 
    : `🎫 <b>PAYMENT DISPUTE / ACTIVATION TICKET RAISED</b>\n\n`;

  html += `• <b>Ticket ID:</b> <code>${escapeHtml(data.ticketId)}</code>\n` +
    `• <b>Order ID:</b> <code>${escapeHtml(data.orderId || 'N/A')}</code>\n` +
    `• <b>User:</b> <code>${escapeHtml(data.userName || 'User')}</code> (${escapeHtml(data.userEmail)})\n` +
    `• <b>User ID:</b> <code>${escapeHtml(data.uid)}</code>\n` +
    `• <b>Plan:</b> <b>${escapeHtml(data.plan)}</b>\n` +
    `• <b>Amount:</b> <b>₹${data.amount}</b>\n` +
    `• <b>UTR / Ref:</b> <code>${escapeHtml(data.utr || 'Not provided')}</code>\n` +
    `• <b>Current Payment Status:</b> <b>${escapeHtml((data.orderStatus || 'PENDING').toUpperCase())}</b>\n` +
    `• <b>Reason:</b> ${escapeHtml(data.reason || 'Membership issue')}\n`;

  if (data.payoutName || data.payoutPhone || data.upiId) {
    html += `\n💳 <b>Payout Details:</b>\n` +
      (data.payoutName ? `• <b>Name:</b> <code>${escapeHtml(data.payoutName)}</code>\n` : '') +
      (data.payoutPhone ? `• <b>Phone:</b> <code>${escapeHtml(data.payoutPhone)}</code>\n` : '') +
      (data.upiId ? `• <b>UPI ID:</b> <code>${escapeHtml(data.upiId)}</code>\n` : '');
  }

  if (data.notes) {
    html += `\n📝 <b>Notes:</b> <i>"${escapeHtml(data.notes)}"</i>\n`;
  }

  html += `\n• <b>Timestamp:</b> ${new Date().toLocaleString()}\n\n` +
    `⚡ <b>Admin Action:</b>`;

  const inlineKeyboard = {
    inline_keyboard: isRefundTicket ? [
      [
        { text: "✅ Approved", callback_data: `tickstat|${sTicketId}|COMPLETED` },
        { text: "⏳ Mark Processing", callback_data: `tickstat|${sTicketId}|PROCESSING` }
      ],
      [
        { text: "❌ Rejected for wrong info", callback_data: `tickstat|${sTicketId}|REJECTED_WRONG_INFO` },
        { text: "⚠️ Invalid", callback_data: `tickstat|${sTicketId}|REJECTED_NOT_VALID` }
      ],
      [
        { text: "💬 Send Support Message", callback_data: `msg|${sUid}` }
      ]
    ] : [
      [
        { text: "✅ Verify & Activate Plan", callback_data: `ap|${sOrderId}` }
      ],
      [
        { text: "❌ Reject: Invalid UTR", callback_data: `rj|${sOrderId}|utr` },
        { text: "💬 Send Support Message", callback_data: `msg|${sUid}` }
      ],
      [
        { text: "👑 Set Plus Plan", callback_data: `setplan|${sUid}|plus` },
        { text: "👑 Set Max Plan", callback_data: `setplan|${sUid}|max` }
      ]
    ]
  };

  await broadcastToAdmins(html, inlineKeyboard);
};

export const sendTelegramSupportNotification = async (data: {
  userId: string;
  userName: string;
  userEmail: string;
  query: string;
  chatId: string;
}) => {
  const cidKey = data.chatId || (data.userId.startsWith('user_') || data.userId.startsWith('guest_') ? data.userId : `user_${data.userId}`);
  const sCid = toShortToken(cidKey);

  // Fallback AI Answer
  const fallbackAi = "To use PaperX OCR and translation tools:\n1. Open OCR & Text Extract to convert scanned documents or images into editable Word (.docx) or searchable PDF.\n2. Open Translate PDF to translate documents into 40+ languages while preserving layout.";
  cachedAiResolutions.set(cidKey, fallbackAi);
  cachedAiResolutions.set(sCid, fallbackAi);

  // Detect if query is payment/UTR related
  const lowerQuery = (data.query || '').toLowerCase();
  const isPaymentRelated = lowerQuery.includes('utr') || lowerQuery.includes('payment') || lowerQuery.includes('money') || lowerQuery.includes('debited') || lowerQuery.includes('refund') || lowerQuery.includes('billing') || lowerQuery.includes('paid');

  const html = `💬 <b>NEW SUPPORT INQUIRY (INSTANT)</b>\n\n` +
    `• <b>User:</b> <code>${escapeHtml(data.userName || 'User')}</code> (${escapeHtml(data.userEmail || 'No email')})\n` +
    `• <b>User ID:</b> <code>${escapeHtml(data.userId)}</code>\n` +
    `• <b>Chat Thread:</b> <code>${escapeHtml(cidKey)}</code>\n\n` +
    `❓ <b>User Question:</b>\n<i>"${escapeHtml(data.query)}"</i>\n\n` +
    `⚡ <b>Choose an action below to respond or set user membership:</b>`;

  const inlineKeyboardRows: any[][] = [
    [
      { text: "✍️ Custom Reply", callback_data: `custommsg_${sCid}` },
      { text: "💡 Send AI Guide", callback_data: `sendai|${sCid}` }
    ]
  ];

  if (isPaymentRelated) {
    inlineKeyboardRows.push([
      { text: "✅ Approve Membership (Pro)", callback_data: `as|${sCid}` },
      { text: "❌ Disapprove: No Payment", callback_data: `rs|${sCid}|nopay` }
    ]);
  }

  inlineKeyboardRows.push([
    { text: "👑 Set Plus Plan", callback_data: `setplan|${sCid}|plus` },
    { text: "👑 Set Max Plan", callback_data: `setplan|${sCid}|max` }
  ]);

  inlineKeyboardRows.push([
    { text: "🆓 Set Free Plan", callback_data: `setplan|${sCid}|free` },
    { text: "🔒 Resolve & Close", callback_data: `resolve_${sCid}` }
  ]);

  // 1. Send the Telegram alert IMMEDIATELY with 0ms delay!
  await broadcastToAdmins(html, { inline_keyboard: inlineKeyboardRows });

  // 2. Generate customized Gemini AI answer in the background without blocking the notification
  generateAdminSuggestedAnswer(data.query, data.userEmail, data.userName)
    .then((resolution) => {
      if (resolution?.suggestedAnswer) {
        cachedAiResolutions.set(cidKey, resolution.suggestedAnswer);
        cachedAiResolutions.set(sCid, resolution.suggestedAnswer);
      }
    })
    .catch((err) => {
      console.warn("[TelegramBot] Background AI resolution note:", err?.message || err);
    });
};

export const initTelegramBot = async () => {
  const token = getBotToken();
  if (!token) {
    console.warn("[Telegram Bot] TELEGRAM_BOT_TOKEN not found in .env. Bot is running in standby mode.");
    return;
  }

  try {
    if (bot) {
      try {
        await bot.stopPolling();
      } catch (e) {
        // ignore
      }
    }

    bot = new TelegramBot(token, { polling: { autoStart: false } });

    bot.on('polling_error', (error: any) => {
      if (error.message && error.message.includes('409 Conflict')) {
        console.warn("[Telegram Bot] Polling conflict detected (409). Another bot instance is active with this token.");
      } else {
        console.error("[Telegram Bot] Polling error:", error.message || error);
      }
    });

    bot.on('error', (error: any) => {
      console.error("[Telegram Bot] General error:", error.message || error);
    });

    try {
      await bot.deleteWebHook();
    } catch (err) {
      // ignore
    }

    await bot.startPolling();
    console.log("[Telegram Bot] Connected and polling actively.");

    bot.on('message', (msg) => {
      if (msg.chat?.id) {
        registerAdminChatId(msg.chat.id);
      }
    });

    const sendMainMenu = (chatId: number | string) => {
      registerAdminChatId(chatId);
      const opts = {
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Pending Orders', callback_data: 'menu_orders' }, { text: '📜 All Payment History', callback_data: 'menu_history' }],
            [{ text: '👥 All Users A-Z', callback_data: 'menu_users' }, { text: '🎫 Refund Users A-Z', callback_data: 'menu_refusers' }],
            [{ text: '🎫 All Refund Tickets', callback_data: 'menu_refunds' }, { text: '💬 Support Queries', callback_data: 'menu_queries' }],
            [{ text: '💰 Revenue Metrics', callback_data: 'menu_revenue' }, { text: '📊 System Status', callback_data: 'menu_status' }],
            [{ text: '🚨 Maintenance Toggle', callback_data: 'menu_maintenance' }],
          ]
        }
      };
      bot!.sendMessage(chatId, '🚀 *PaperX Production Control Bot*\n\nReal-time administrator controls for instant approvals, orders, history, revenue, live chat, and app maintenance:', opts);
    };

    // Commands
    bot.onText(/\/start/, (msg) => {
      sendMainMenu(msg.chat.id);
    });

    bot.onText(/\/users/, async (msg) => {
      await handleUsersList(msg.chat.id);
    });

    bot.onText(/\/orders/, async (msg) => {
      await handlePendingOrders(msg.chat.id);
    });

    bot.onText(/\/revenue/, async (msg) => {
      await handleRevenue(msg.chat.id);
    });

    bot.onText(/\/history/, async (msg) => {
      await handlePaymentHistory(msg.chat.id);
    });

    bot.onText(/\/maintenance/, async (msg) => {
      await handleMaintenanceToggle(msg.chat.id);
    });

    bot.onText(/\/status/, async (msg) => {
      await handleSystemStatus(msg.chat.id);
    });

    bot.onText(/\/refunds/, async (msg) => {
      await handleRefunds(msg.chat.id);
    });

    bot.onText(/\/help/, (msg) => {
      const help = `📖 *PaperX Bot Command Directory:*\n\n` +
        `• \`/start\` - Open master action menu\n` +
        `• \`/orders\` - View pending UPI verification orders\n` +
        `• \`/history\` - Full payment & transaction ledger\n` +
        `• \`/refunds\` - Active refund request master panel\n` +
        `• \`/users\` - List users in sequence with quick actions\n` +
        `• \`/revenue\` - Real-time income & sales metrics\n` +
        `• \`/maintenance\` - Toggle app maintenance on/off\n` +
        `• \`/status\` - System health, RAM & database status\n` +
        `• \`/msg <chatId or uid> <text>\` - Send custom support reply in-app\n` +
        `• \`/reply <chatId or uid> <text>\` - Alias for instant support reply`;
      bot!.sendMessage(msg.chat.id, help, { parse_mode: 'Markdown' });
    });

    const handleMsgCommand = async (msg: any, match: any) => {
      const chatId = msg.chat.id;
      if (!match || !match[1]) {
        bot!.sendMessage(chatId, '⚠️ Usage: `/msg <chatId, userId or email> <Your Message>`', { parse_mode: 'Markdown' });
        return;
      }
      const full = (match[1] || '').trim();
      if (!full) {
        bot!.sendMessage(chatId, '⚠️ Usage: `/msg <chatId, userId or email> <Your Message>`', { parse_mode: 'Markdown' });
        return;
      }
      const firstSpace = full.indexOf(' ');
      if (firstSpace === -1) {
        bot!.sendMessage(chatId, '⚠️ Usage: `/msg <chatId, userId or email> <Your Message>`', { parse_mode: 'Markdown' });
        return;
      }
      const target = full.substring(0, firstSpace).trim();
      const customMessage = full.substring(firstSpace + 1).trim();
      await sendDirectUserMessage(chatId, target, customMessage);
    };

    bot.onText(/\/msg (.+)/, handleMsgCommand);
    bot.onText(/\/reply (.+)/, handleMsgCommand);

    // Handlers for commands and callbacks
    const handleUsersList = async (chatId: number | string, filterLetter?: string) => {
      try {
        const users = await getServerDocs('users');
        const allTickets = await getServerDocs('support_tickets');
        const activeRefundUids = new Set(allTickets
          .filter(t => t.ticketReason?.toLowerCase().includes('refund') && (t.status !== 'COMPLETED' && t.status !== 'RESOLVED'))
          .map(t => t.uid)
        );
        const urgentRefundUids = new Set(allTickets
          .filter(t => t.ticketReason?.toLowerCase().includes('refund') && (t.status === 'OPEN' || t.status === 'PENDING'))
          .map(t => t.uid)
        );

        if (users.length === 0) {
          bot!.sendMessage(chatId, '👥 *No registered users found in database.*', { parse_mode: 'Markdown' });
          return;
        }

        // Sort users alphabetically by email (case-insensitive)
        users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

        // Build A-Z alphabet buttons
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const letterRowSize = 6;
        const letterButtons: any[][] = [];
        for (let i = 0; i < alphabet.length; i += letterRowSize) {
          const chunk = alphabet.slice(i, i + letterRowSize);
          letterButtons.push(chunk.map(char => ({
            text: char === filterLetter ? `📍 [${char}]` : char,
            callback_data: `filterusers_${char}`
          })));
        }
        // Add "All" button
        letterButtons.push([{ text: filterLetter === 'ALL' || !filterLetter ? '📋 [ All Users ]' : '📋 All Users', callback_data: 'filterusers_ALL' }]);

        // Filter users
        let filteredUsers = users;
        if (filterLetter && filterLetter !== 'ALL') {
          const lowerLetter = filterLetter.toLowerCase();
          filteredUsers = users.filter(u => {
            const email = (u.email || '').toLowerCase().trim();
            return email.startsWith(lowerLetter);
          });
        }

        const buttons = [...letterButtons];
        let index = 1;
        // Map users up to 50 for selection
        for (const u of filteredUsers.slice(0, 50)) {
          const uid = u.id;
          const sUid = toShortToken(uid);
          const name = u.name || 'User';
          const email = u.email || 'No email';
          
          let prefix = '👥';
          if (urgentRefundUids.has(uid)) prefix = '🔴';
          else if (activeRefundUids.has(uid)) prefix = '🟡';

          buttons.push([
            { text: `${prefix} #${index}. ${name} (${email})`, callback_data: `viewuser_${sUid}` }
          ]);
          index++;
        }

        if (filteredUsers.length > 50) {
          buttons.push([{ text: `⚠️ ... and ${filteredUsers.length - 50} more users (use A-Z filter to narrow down)`, callback_data: `noop` }]);
        }

        let listText = `👥 *PAPERX USER DIRECTORY (${users.length} Total Users)*\n\n`;
        if (filterLetter && filterLetter !== 'ALL') {
          listText += `🔍 *Filtered by Letter:* "${filterLetter}"\n` +
            `• Found *${filteredUsers.length}* user(s) matching your selection.\n\n`;
        } else {
          listText += `📋 Showing all registered users sorted alphabetically:\n\n`;
        }
        listText += `🚨 *NOTICE:* 🔴 = Urgent Refund Requested, 🟡 = Refund in Processing.\n\n`;
        listText += `Use the A–Z index below to filter, or select a user:`;

        await bot!.sendMessage(chatId, listText, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error fetching users: ${err.message}`);
      }
    };

    const handleRefundUsersList = async (chatId: number | string, filterLetter?: string) => {
      try {
        const users = await getServerDocs('users');
        const allTickets = await getServerDocs('support_tickets');
        
        // Find users with active refunds
        const refundTickets = allTickets.filter(t => 
          t.ticketReason?.toLowerCase().includes('refund') && 
          (t.status !== 'COMPLETED' && t.status !== 'RESOLVED')
        );
        
        const refundUidMap: Record<string, string> = {}; // uid -> highest urgency status
        refundTickets.forEach(t => {
          const current = refundUidMap[t.uid];
          if (t.status === 'OPEN' || t.status === 'PENDING') {
            refundUidMap[t.uid] = 'URGENT';
          } else if (current !== 'URGENT') {
            refundUidMap[t.uid] = 'PROCESSING';
          }
        });

        const refundUsers = users.filter(u => refundUidMap[u.id]);

        if (refundUsers.length === 0) {
          bot!.sendMessage(chatId, '🎫 *No active refund-seeking users found.*', { parse_mode: 'Markdown' });
          return;
        }

        refundUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));

        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const letterRowSize = 6;
        const letterButtons: any[][] = [];
        for (let i = 0; i < alphabet.length; i += letterRowSize) {
          const chunk = alphabet.slice(i, i + letterRowSize);
          letterButtons.push(chunk.map(char => ({
            text: char === filterLetter ? `📍 [${char}]` : char,
            callback_data: `filterrefusers_${char}`
          })));
        }
        letterButtons.push([{ text: filterLetter === 'ALL' || !filterLetter ? '📋 [ All Refund Users ]' : '📋 All Refund Users', callback_data: 'filterrefusers_ALL' }]);

        let filteredUsers = refundUsers;
        if (filterLetter && filterLetter !== 'ALL') {
          const lowerLetter = filterLetter.toLowerCase();
          filteredUsers = refundUsers.filter(u => (u.email || '').toLowerCase().trim().startsWith(lowerLetter));
        }

        const buttons = [...letterButtons];
        let index = 1;
        for (const u of filteredUsers.slice(0, 50)) {
          const status = refundUidMap[u.id];
          const indicator = status === 'URGENT' ? '🔴' : '🟡';
          const sUid = toShortToken(u.id);
          buttons.push([
            { text: `${indicator} #${index}. ${u.name || 'User'} (${u.email})`, callback_data: `viewuser_${sUid}` }
          ]);
          index++;
        }

        let listText = `🎫 *REFUND USER MASTER PANEL (${refundUsers.length} Active)*\n\n`;
        listText += `🚨 *INDICATORS:* 🔴 = New/Unprocessed, 🟡 = Being Processed\n\n`;
        if (filterLetter && filterLetter !== 'ALL') {
          listText += `🔍 *Filtered by Letter:* "${filterLetter}" (${filteredUsers.length} matches)\n\n`;
        }
        listText += `Select a user to manage their specific refund tickets:`;

        await bot!.sendMessage(chatId, listText, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
        });
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error loading refund users: ${err.message}`);
      }
    };

    const handlePendingOrders = async (chatId: number | string, targetUid?: string) => {
      try {
        const allOrders = await getServerDocs('orders');
        const pendingOrders = allOrders
          .filter(o => o.status === 'PENDING' && o.utr && o.utr !== 'Not submitted yet' && (!targetUid || o.uid === targetUid))
          .sort((a, b) => {
            const ta = a.submittedAt || a.createdAt || 0;
            const tb = b.submittedAt || b.createdAt || 0;
            return new Date(tb).getTime() - new Date(ta).getTime();
          })
          .slice(0, 20);

        if (pendingOrders.length === 0) {
          bot!.sendMessage(chatId, '✅ *No real pending orders requiring verification.* (Dozens of inactive draft sessions ignored)', { parse_mode: 'Markdown' });
          return;
        }

        bot!.sendMessage(chatId, `⏳ *Found ${pendingOrders.length} Real Pending Orders:*\n(Showing latest 20 requiring manual approval)`, { parse_mode: 'Markdown' });

        for (const o of pendingOrders) {
          const rawId = o.id || o.orderId;
          const orderId = (rawId && rawId !== 'undefined') ? rawId : `RECOVERED-${Math.random().toString(36).substring(7).toUpperCase()}`;
          const sOrderId = toShortToken(orderId);
          const uid = o.uid || 'Anonymous';
          const sUid = toShortToken(uid);
          const plan = o.plan || 'Plus Plan';
          const amount = o.amount || (plan.toLowerCase().includes('max') ? 100 : 50);
          const currency = o.currency || 'INR';
          const utr = o.utr || 'Not submitted yet';
          const time = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent';

          const orderText = `💳 *Pending Order: \`${orderId}\`*\n` +
            `• *User:* \`${uid}\`\n` +
            `• *Plan:* *${plan}*\n` +
            `• *Amount:* *${currency} ${amount}*\n` +
            `• *UTR / Reference:* \`${utr}\`\n` +
            `• *Date/Time:* ${time}`;

          const buttons = [
            [
              { text: '✅ Approved', callback_data: `ap|${sOrderId}` },
              { text: '❌ Rejected', callback_data: `rj|${sOrderId}|utr` }
            ],
            [
              { text: '⚠️ Invalid', callback_data: `rj|${sOrderId}|fake` },
              { text: '📝 Wrong Information', callback_data: `rj|${sOrderId}|wrong_info` }
            ],
            [
              { text: '👤 User Profile', callback_data: `viewuser_${sUid}` },
              { text: '💬 Chat', callback_data: `msg|${sUid}` }
            ]
          ];

          await bot!.sendMessage(chatId, orderText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        }
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error fetching orders: ${err.message}`);
      }
    };

    const handlePaymentHistory = async (chatId: number | string) => {
      try {
        const allOrders = await getServerDocs('orders');
        if (allOrders.length === 0) {
          bot!.sendMessage(chatId, '📜 *No payment history records found.*', { parse_mode: 'Markdown' });
          return;
        }

        const sortedOrders = [...allOrders].sort((a: any, b: any) => {
          const tA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const tB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return tB - tA;
        });

        bot!.sendMessage(chatId, `📜 *PAPERX MEMBERSHIP & PAYMENT TRANSACTION HISTORY*\nTotal Records: *${sortedOrders.length}*\nDisplaying latest transactions:`, { parse_mode: 'Markdown' });

        for (const o of sortedOrders.slice(0, 15)) {
          const statusEmoji = (o.status === 'VERIFIED' || o.status === 'COMPLETED') ? '🟢 APPROVED' : o.status === 'REJECTED' ? '🔴 REJECTED' : '🟡 PENDING';
          const planName = o.plan || 'Plus Plan';
          const amount = o.amount || (planName.toLowerCase().includes('max') ? 100 : 50);
          const currency = o.currency || 'INR';
          const utr = o.utr || 'None provided';
          const time = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A';

          const historyCard = `💳 *Order:* \`${o.id}\`\n` +
            `• *Status:* ${statusEmoji}\n` +
            `• *Membership Plan:* *${planName.toUpperCase()}*\n` +
            `• *Amount:* *${currency} ${amount}*\n` +
            `• *User:* \`${o.uid || 'Anonymous'}\`\n` +
            `• *UTR / Ref:* \`${utr}\`\n` +
            `• *Time:* ${time}`;

          const inlineButtons: any[] = [];
          if (o.status === 'PENDING') {
            inlineButtons.push([
              { text: '✅ Approve', callback_data: `approve_${o.id}` },
              { text: '❌ Reject', callback_data: `reject_${o.id}` }
            ]);
          }

          await bot!.sendMessage(chatId, historyCard, {
            parse_mode: 'Markdown',
            reply_markup: inlineButtons.length > 0 ? { inline_keyboard: inlineButtons } : undefined
          });
        }

        if (sortedOrders.length > 15) {
          bot!.sendMessage(chatId, `_...and ${sortedOrders.length - 15} more historical orders in database._`, { parse_mode: 'Markdown' });
        }
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error loading payment history: ${err.message}`);
      }
    };

    const handleRevenue = async (chatId: number | string) => {
      try {
        const allOrders = await getServerDocs('orders');
        let totalRevenueINR = 0;
        let approvedCount = 0;
        let pendingCount = 0;
        const planStats: Record<string, { count: number; total: number }> = {};

        allOrders.forEach((order) => {
          const amt = Number(order.amount) || 0;
          const plan = order.plan || 'Other';

          if (order.status === 'VERIFIED' || order.status === 'COMPLETED') {
            totalRevenueINR += amt;
            approvedCount++;
            if (!planStats[plan]) planStats[plan] = { count: 0, total: 0 };
            planStats[plan].count++;
            planStats[plan].total += amt;
          } else if (order.status === 'PENDING') {
            pendingCount++;
          }
        });

        let planBreakdown = '';
        for (const [pName, pData] of Object.entries(planStats)) {
          planBreakdown += `• *${pName}:* ${pData.count} sales (₹${pData.total.toLocaleString('en-IN')})\n`;
        }
        if (!planBreakdown) planBreakdown = '• No plan breakdown recorded yet.\n';

        const revMessage = `💰 *PAPERX FINANCIAL & REVENUE SUMMARY*\n\n` +
          `💵 *Total Realized Revenue:* *₹${totalRevenueINR.toLocaleString('en-IN')}*\n` +
          `✅ *Approved Transactions:* *${approvedCount}*\n` +
          `⏳ *Pending Approvals:* *${pendingCount}*\n\n` +
          `📊 *Revenue by Membership Plan:*\n${planBreakdown}\n` +
          `_Live synchronized from Firebase Firestore ledger._`;

        bot!.sendMessage(chatId, revMessage, { parse_mode: 'Markdown' });
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error calculating revenue: ${err.message}`);
      }
    };

    const handleSystemStatus = async (chatId: number | string) => {
      try {
        const startTime = Date.now();
        const users = await getServerDocs('users');
        const dbLatency = Date.now() - startTime;

        const allOrders = await getServerDocs('orders');
        const pendingCount = allOrders.filter(o => o.status === 'PENDING').length;

        const memUsageMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const uptimeMin = (process.uptime() / 60).toFixed(1);

        const statusMsg = `📊 *PAPERX SYSTEM HEALTH & STATUS REPORT*\n\n` +
          `🟢 *Web Application Server:* ONLINE (Port 3000)\n` +
          `🟢 *Firebase Firestore:* OPERATIONAL (${dbLatency}ms latency)\n` +
          `🟢 *Telegram Control Bot:* ACTIVE & POLLING\n` +
          `🟢 *Document Processing Engine:* READY (100MB Limit)\n\n` +
          `👥 *Registered Users:* ${users.length}\n` +
          `⏳ *Pending Payment Orders:* ${pendingCount}\n` +
          `💾 *Node.js Memory:* ${memUsageMB} MB\n` +
          `⏱ *System Uptime:* ${uptimeMin} minutes\n\n` +
          `_Status Checked at: ${new Date().toLocaleTimeString()}_`;

        bot!.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Status check error: ${err.message}`);
      }
    };

    const handleMaintenanceToggle = async (chatId: number | string) => {
      try {
        const snap = await getServerDoc('app_settings', 'global');
        const current = snap ? (snap.maintenanceMode || snap.maintenanceActive || false) : false;
        const nextState = !current;

        await setServerDoc('app_settings', 'global', {
          maintenanceMode: nextState,
          maintenanceActive: nextState,
          updatedAt: Date.now()
        }, true);

        const stateText = nextState ? '🚨 *MAINTENANCE MODE IS NOW: ACTIVE (ON)*' : '🟢 *MAINTENANCE MODE IS NOW: DISABLED (OFF)*';
        const detail = nextState
          ? 'Users visiting PaperX will see the maintenance screen until you disable it.'
          : 'PaperX is back online and accessible to all users.';

        bot!.sendMessage(chatId, `${stateText}\n\n${detail}`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Maintenance toggle error: ${err.message}`);
      }
    };

    const sendDirectUserMessage = async (adminChatId: number | string, userIdentifier: string, messageText: string) => {
      try {
        let targetUid = userIdentifier;
        let targetChatId = userIdentifier;

        // If email provided, find user
        if (userIdentifier.includes('@')) {
          const users = await getServerDocs('users');
          const found = users.find(u => (u.email || '').toLowerCase() === userIdentifier.toLowerCase());
          if (found) {
            targetUid = found.id;
            targetChatId = `user_${found.id}`;
          }
        }

        // Look up matching support chat document
        const allChats = await getAllSupportChatDocs();
        const matchingChat = allChats.find(c =>
          c.chatId === userIdentifier ||
          c.id === userIdentifier ||
          c.userId === userIdentifier ||
          (c.userEmail && c.userEmail.toLowerCase() === userIdentifier.toLowerCase())
        );

        if (matchingChat) {
          targetChatId = matchingChat.chatId || matchingChat.id;
          targetUid = matchingChat.userId || targetUid;
        } else if (!targetChatId.startsWith('user_') && !targetChatId.startsWith('guest_')) {
          targetChatId = `user_${targetChatId}`;
        }

        const newMsg = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sender: 'admin',
          senderName: 'PaperX Official Support',
          text: messageText,
          timestamp: Date.now()
        };

        await pushChatMessage(targetChatId, targetUid, newMsg);

        bot!.sendMessage(adminChatId, `✅ *Message delivered directly in-app to \`${targetChatId}\`!*\n\n• *User:* \`${targetUid}\`\n• *Message:* "${messageText}"`, { parse_mode: 'Markdown' });
      } catch (err: any) {
        bot!.sendMessage(adminChatId, `⚠️ Failed to deliver message: ${err.message}`);
      }
    };

    const handleRefunds = async (chatId: number | string, targetUid?: string) => {
      try {
        const allTickets = await getServerDocs('support_tickets');
        const activeRefunds = allTickets.filter(t => 
          t.ticketReason?.toLowerCase().includes('refund') && 
          t.status !== 'COMPLETED' && 
          t.status !== 'RESOLVED' &&
          (!targetUid || t.uid === targetUid)
        );

        if (activeRefunds.length === 0) {
          bot!.sendMessage(chatId, '🎫 *No active refund requests found.*', { parse_mode: 'Markdown' });
          return;
        }

        bot!.sendMessage(chatId, `🎫 *ACTIVE REFUND REQUESTS MASTER PANEL*\nTotal Active: *${activeRefunds.length}*\n\n🚨 *RED ALERT:* Unprocessed requests are marked with 🔴`, { parse_mode: 'Markdown' });

        for (const t of activeRefunds) {
          const status = t.status || 'OPEN';
          const isUnprocessed = status === 'OPEN' || status === 'PENDING';
          const indicator = isUnprocessed ? '🔴' : '🟡';
          const sTicketId = toShortToken(t.ticketId || t.id);

          const ticketText = `${indicator} *Ticket:* \`${t.ticketId || t.id}\`\n` +
            `• *User:* \`${t.uid}\`\n` +
            `• *Status:* \`${status}\`\n` +
            `• *Amount:* ₹${t.amount || 'N/A'}\n` +
            `• *Reason:* ${t.ticketReason || 'No reason provided'}`;

          const buttons = [
            [
              { text: '✅ Approved', callback_data: `tickstat|${sTicketId}|COMPLETED` },
              { text: '⏳ Mark Processing', callback_data: `tickstat|${sTicketId}|PROCESSING` }
            ],
            [
              { text: '❌ Rejected for wrong information', callback_data: `tickstat|${sTicketId}|REJECTED_WRONG_INFO` },
              { text: '⚠️ Invalid', callback_data: `tickstat|${sTicketId}|REJECTED_NOT_VALID` }
            ]
          ];

          await bot!.sendMessage(chatId, ticketText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        }
      } catch (err: any) {
        bot!.sendMessage(chatId, `⚠️ Error loading refund requests: ${err.message}`);
      }
    };

    // Callback query dispatcher
    bot.on('callback_query', async (callbackQuery) => {
      const message = callbackQuery.message;
      if (!message || !bot) return;
      const chatId = message.chat.id;
      const data = callbackQuery.data;
      let toastText = "Processed successfully!";

      try {
        console.log(`[Telegram Bot] Received callback query: ${data} from chatId: ${chatId}`);

        if (data === 'menu_users') {
          await handleUsersList(chatId);
        } else if (data === 'menu_refusers') {
          await handleRefundUsersList(chatId);
        } else if (data === 'menu_refunds') {
          await handleRefunds(chatId);
        } else if (data?.startsWith('filterusers_')) {
          const letter = data.replace('filterusers_', '');
          await handleUsersList(chatId, letter);
        } else if (data?.startsWith('filterrefusers_')) {
          const letter = data.replace('filterrefusers_', '');
          await handleRefundUsersList(chatId, letter);
        } else if (data === 'menu_orders') {
          await handlePendingOrders(chatId);
        } else if (data === 'menu_history') {
          await handlePaymentHistory(chatId);
        } else if (data === 'menu_revenue') {
          await handleRevenue(chatId);
        } else if (data === 'menu_status') {
          await handleSystemStatus(chatId);
        } else if (data === 'menu_maintenance') {
          await handleMaintenanceToggle(chatId);
        } else if (data === 'menu_queries') {
          const chats = await getAllSupportChatDocs();
          if (chats.length === 0) {
            bot.sendMessage(chatId, '💬 *No active support chats or queries found.*', { parse_mode: 'Markdown' });
          } else {
            bot.sendMessage(chatId, `💬 *Found ${chats.length} Support Chat Threads:*`, { parse_mode: 'Markdown' });
            for (const cdata of chats.slice(0, 20)) {
              const lastMsg = cdata.lastMessage || 'No messages';
              const unread = cdata.unreadByAdmin ? '🔴 UNREAD' : '🟢 READ';
              const isClosed = cdata.status === 'closed';
              const isInactive = cdata.closedReason === 'inactivity_timeout';
              const statusTag = isClosed ? (isInactive ? '⏱️ CLOSED (20m Inactive)' : '🔒 CLOSED') : '🟢 ACTIVE';
              const threadId = cdata.chatId || cdata.id;
              const userKey = threadId;
              const sKey = toShortToken(userKey);

              const text = `💬 *Thread:* \`${threadId}\`\n` +
                `• *User:* \`${cdata.userName || cdata.userEmail || cdata.userId || 'User'}\`\n` +
                `• *Email:* \`${cdata.userEmail || 'Guest'}\`\n` +
                `• *Status:* ${statusTag} | ${unread}\n` +
                `• *Last Query:* _"${lastMsg}"_\n` +
                `• *Time:* ${cdata.updatedAt ? new Date(cdata.updatedAt).toLocaleTimeString() : 'N/A'}\n\n` +
                `_To reply with your own custom message:_\n\`/msg ${threadId} Your message here\``;

              bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [
                      { text: '✅ Approve (Pro Upgrade)', callback_data: `as|${sKey}` }
                    ],
                    [
                      { text: '❌ Disapprove (No Payment)', callback_data: `rs|${sKey}|nopay` },
                      { text: '❌ Disapprove (Invalid UTR)', callback_data: `rs|${sKey}|utr` }
                    ],
                    [
                      { text: '💬 Stuck Money Notice', callback_data: `msg|${sKey}` },
                      { text: '📝 Quick Reply (Review)', callback_data: `qr|${sKey}` }
                    ],
                    [
                      { text: '✍️ Custom Reply Instructions', callback_data: `custommsg_${sKey}` }
                    ]
                  ]
                }
              });
            }
          }
        } else if (data?.startsWith('userorders_')) {
          const rawUid = data.replace('userorders_', '');
          const uid = fromShortToken(rawUid);
          await handlePendingOrders(chatId, uid);
        } else if (data?.startsWith('userrefunds_')) {
          const rawUid = data.replace('userrefunds_', '');
          const uid = fromShortToken(rawUid);
          await handleRefunds(chatId, uid);
        } else if (data?.startsWith('viewuser_')) {
          const rawUid = data.replace('viewuser_', '');
          const uid = fromShortToken(rawUid);
          const sUid = toShortToken(uid);
          toastText = `Viewing user ${uid}`;
          const u = await getServerDoc('users', uid);
          if (!u) {
            bot.sendMessage(chatId, `⚠️ User with UID \`${uid}\` not found in database.`, { parse_mode: 'Markdown' });
            return;
          }

          const name = u.name || 'User';
          const email = u.email || 'No email';
          const plan = u.plan || 'Basic Plan';
          const isRestricted = u.restrictedPermanently === true || u.isRestricted === true;
          const isBlocked = u.status === 'DISABLED' || u.isBlocked === true;
          
          let statusBadge = '🟢 ACTIVE';
          if (isRestricted) {
            statusBadge = '🛑 RESTRICTED PERMANENTLY';
          } else if (isBlocked) {
            statusBadge = '🚫 BLOCKED';
          }

          // Format Date of Joined (Past)
          const joinedDate = u.createdAt 
            ? new Date(u.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
            : (u.memberSince || 'N/A');

          // Format Last Active (Present)
          const lastActiveDate = u.updatedAt 
            ? new Date(u.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
            : 'N/A';

          // Format Activity Info
          const activity = typeof u.projectsUsed === 'number' 
            ? `${u.projectsUsed} projects created` 
            : '0 projects created';

          const userCard = `👤 *USER MANAGEMENT CARD: ${name}*\n\n` +
            `• *Email:* \`${email}\`\n` +
            `• *UID:* \`${uid}\`\n` +
            `• *Plan:* \`${plan}\`\n\n` +
            `📜 *HISTORICAL RECORDS (PAST & PRESENT):*\n` +
            `• *Status:* ${statusBadge}\n` +
            `• *Joined (Past):* \`${joinedDate}\`\n` +
            `• *Last Active (Present):* \`${lastActiveDate}\`\n` +
            `• *User Activity:* \`${activity}\`\n\n` +
            `⚙️ *CHOOSE AN ACTION CONTROL BELOW:*`;

          const buttons = [
            [
              { text: `🚫 Block User`, callback_data: `block_${sUid}` },
              { text: `✅ Unblock User`, callback_data: `unblock_${sUid}` }
            ],
            [
              { text: `🛑 Restrict Permanently`, callback_data: `restrict_${sUid}` },
              { text: `🔄 Force Re-login`, callback_data: `forcelogin_${sUid}` }
            ],
            [
              { text: `🗑️ Delete Permanently`, callback_data: `delete_${sUid}` },
              { text: `💬 Send In-App Msg`, callback_data: `custommsg_${sUid}` }
            ],
            [
              { text: `🛒 Pending Orders`, callback_data: `userorders_${sUid}` },
              { text: `🎫 Refund Requests`, callback_data: `userrefunds_${sUid}` }
            ],
            [
              { text: `🔙 Back to Users List`, callback_data: `menu_users` }
            ]
          ];

          await bot.sendMessage(chatId, userCard, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('block_')) {
          const rawUid = data.replace('block_', '');
          const uid = fromShortToken(rawUid);
          const sUid = toShortToken(uid);
          toastText = `Blocked user ${uid}`;
          await updateServerDoc('users', uid, {
            status: 'DISABLED',
            isBlocked: true,
            updatedAt: new Date().toISOString()
          });
          const buttons = [
            [
              { text: `👤 View User Profile`, callback_data: `viewuser_${sUid}` },
              { text: `🔙 Users List`, callback_data: `menu_users` }
            ]
          ];
          bot.sendMessage(chatId, `🚫 *User \`${uid}\` has been BLOCKED.* Access restricted in real-time.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('unblock_')) {
          const rawUid = data.replace('unblock_', '');
          const uid = fromShortToken(rawUid);
          const sUid = toShortToken(uid);
          toastText = `Unblocked user ${uid}`;
          await updateServerDoc('users', uid, {
            status: 'ACTIVE',
            isBlocked: false,
            isRestricted: false,
            restrictedPermanently: false,
            updatedAt: new Date().toISOString()
          });
          const buttons = [
            [
              { text: `👤 View User Profile`, callback_data: `viewuser_${sUid}` },
              { text: `🔙 Users List`, callback_data: `menu_users` }
            ]
          ];
          bot.sendMessage(chatId, `✅ *User \`${uid}\` has been UNBLOCKED & fully restored.* Access restored.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('restrict_')) {
          const rawUid = data.replace('restrict_', '');
          const uid = fromShortToken(rawUid);
          const sUid = toShortToken(uid);
          toastText = `Restricted user ${uid}`;
          await updateServerDoc('users', uid, {
            status: 'DISABLED',
            isBlocked: true,
            isRestricted: true,
            restrictedPermanently: true,
            updatedAt: new Date().toISOString()
          });
          const buttons = [
            [
              { text: `👤 View User Profile`, callback_data: `viewuser_${sUid}` },
              { text: `🔙 Users List`, callback_data: `menu_users` }
            ]
          ];
          bot.sendMessage(chatId, `🛑 *User \`${uid}\` has been PERMANENTLY RESTRICTED.* All access is suspended permanently.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('forcelogin_')) {
          const rawUid = data.replace('forcelogin_', '');
          const uid = fromShortToken(rawUid);
          const sUid = toShortToken(uid);
          toastText = `Forced logout for ${uid}`;
          await updateServerDoc('users', uid, {
            forceLogout: true,
            forceReLogin: true,
            updatedAt: new Date().toISOString()
          });
          const buttons = [
            [
              { text: `👤 View User Profile`, callback_data: `viewuser_${sUid}` },
              { text: `🔙 Users List`, callback_data: `menu_users` }
            ]
          ];
          bot.sendMessage(chatId, `🔄 *User \`${uid}\` forced to re-login.* All active sessions will be terminated instantly.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('delete_')) {
          const rawUid = data.replace('delete_', '');
          const uid = fromShortToken(rawUid);
          toastText = `Deleted user ${uid}`;
          await deleteServerDoc('users', uid);
          const buttons = [
            [{ text: `🔙 Users List`, callback_data: `menu_users` }]
          ];
          bot.sendMessage(chatId, `🗑️ *User \`${uid}\` has been permanently DELETED from database.*`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
          });
        } else if (data?.startsWith('sendai|')) {
          const rawCid = data.split('|')[1];
          let cid = fromShortToken(rawCid);
          
          // RECOVERY
          if (cid.startsWith('k') || !cid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) cid = recovered;
          }
          
          const uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
          let answerToSend = cachedAiResolutions.get(cid) || cachedAiResolutions.get(rawCid) ||
            "To use PaperX OCR and translation:\n1. Open 'OCR & Text Extract' from the tools menu to extract text from scanned images or PDFs into Word/searchable PDF.\n2. Open 'Translate PDF' to translate documents into 40+ languages while preserving exact formatting.\n\nLet us know if you need further help!";

          const aiMsg = {
            id: `msg_${Date.now()}`,
            sender: 'admin',
            senderName: 'PaperX Support (AI Assistant)',
            text: answerToSend,
            timestamp: Date.now()
          };

          await pushChatMessage(cid, uid, aiMsg);
          toastText = "AI Answer delivered to user";
          bot.sendMessage(chatId, `✅ *AI Resolution Answer sent to user in-app!*\n\n• *Thread:* \`${cid}\`\n• *Delivered Content:* \n"${answerToSend}"`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('setplan|')) {
          const parts = data.split('|');
          const rawCid = parts[1];
          let cid = fromShortToken(rawCid);
          
          // RECOVERY
          if (cid.startsWith('k') || !cid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) cid = recovered;
          }
          
          const planCode = parts[2] || 'plus';
          const targetPlan = planCode === 'plus' ? 'Plus Plan' : planCode === 'max' ? 'Max Plan' : planCode === 'free' ? 'Free Plan' : planCode;
          const uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
          const isPro = targetPlan !== 'Free Plan' && targetPlan !== 'Basic Plan';
          const tier = targetPlan.toLowerCase().includes('max') ? 'max' : (targetPlan.toLowerCase().includes('plus') ? 'plus' : 'free');
          
          // 30 days active subscription window when set by Admin
          const expiresAtIso = isPro ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

          await updateServerDoc('users', uid, {
            plan: isPro ? targetPlan : 'Basic Plan',
            purchasedPlan: isPro ? targetPlan : 'Basic Plan',
            activePlanMode: isPro ? targetPlan : 'Basic Plan',
            isPro: isPro,
            membershipTier: tier,
            planExpiresAt: expiresAtIso,
            subscriptionStatus: isPro ? 'active' : 'free',
            billingCycle: 'month',
            maxProjects: isPro ? 9999 : 5,
            updatedAt: new Date().toISOString()
          });

          const upgradeNotice = {
            id: `msg_${Date.now()}`,
            sender: 'admin',
            senderName: 'PaperX Official Support',
            text: isPro 
              ? `🎉 Great news! Your account membership has been updated to **${targetPlan}** by our Telegram Admin. All premium tools (Neural OCR, Document Translation, 500MB upload limits) are now unlocked!`
              : `ℹ️ Your account membership plan has been set to **${targetPlan}**.`,
            timestamp: Date.now()
          };
          await pushChatMessage(cid, uid, upgradeNotice);

          toastText = `User set to ${targetPlan}`;
          bot.sendMessage(chatId, `👑 *User \`${uid}\` membership set to ${targetPlan}!*\nAccount limits and premium features updated in real-time.`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('resolve_') || data?.startsWith('resolve|')) {
          const rawCid = data.includes('|') ? data.split('|')[1] : data.replace('resolve_', '');
          let cid = fromShortToken(rawCid);
          
          // RECOVERY
          if (cid.startsWith('k') || !cid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) cid = recovered;
          }
          
          const uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;

          const resolveNotice = {
            id: `msg_${Date.now()}`,
            sender: 'system',
            senderName: 'System Notice',
            text: '🔒 Support conversation resolved & closed by admin.',
            timestamp: Date.now(),
            isSystemNotice: true
          };
          await pushChatMessage(cid, uid, resolveNotice);

          await updateServerDoc('support_chats', cid, {
            status: 'closed',
            closedReason: 'admin_resolved',
            closedAt: Date.now(),
            updatedAt: Date.now()
          });

          toastText = "Chat marked as resolved";
          bot.sendMessage(chatId, `🔒 *Thread \`${cid}\` has been marked as RESOLVED & CLOSED.*`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('as|') || data?.startsWith('appsupp|') || data?.startsWith('approve_support_')) {
            let uid = '';
            let cid = '';
            if (data.startsWith('as|')) {
              const rawCid = data.split('|')[1];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
            } else if (data.startsWith('appsupp|')) {
              const parts = data.split('|');
              const rawCid = parts[2] || parts[1];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : parts[1];
            } else {
              const parts = data.split('_');
              const rawCid = parts[3] || parts[2];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : parts[2];
            }
            
            // RECOVERY
            if (cid.startsWith('k') || !cid) {
              const recovered = recoverIdFromMessage(message.text || message.caption);
              if (recovered) {
                cid = recovered;
                uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
              }
            }
            
            toastText = "Membership Approved via Support";

            // Instant upgrade for the user
            await updateServerDoc('users', uid, {
                plan: 'Pro Plan',
                maxProjects: 9999,
                isPro: true,
                updatedAt: new Date().toISOString()
            });

            const approvalMsg = {
                id: `msg_${Date.now()}`,
                sender: 'admin',
                senderName: 'PaperX Official Support',
                text: `🎉 Great news! Your membership payment has been VERIFIED & APPROVED by our Telegram Admin. Your account has been upgraded to Pro Plan with full access to all tools!`,
                timestamp: Date.now()
            };
            await pushChatMessage(cid || uid, uid, approvalMsg);
            
            bot.sendMessage(chatId, `✅ *User \`${uid}\` Approved via Support Telegram Bot.* Account upgraded to Pro Plan.`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('rs|') || data?.startsWith('rejsupp|') || data?.startsWith('reject_support_')) {
            let uid = '';
            let cid = '';
            let reasonCode = 'general';
            if (data.startsWith('rs|')) {
              const parts = data.split('|');
              const rawCid = parts[1];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
              reasonCode = parts[2] || 'general';
            } else if (data.startsWith('rejsupp|')) {
              const parts = data.split('|');
              const rawCid = parts[2] || parts[1];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : parts[1];
              reasonCode = parts[3] || 'general';
            } else {
              const parts = data.split('_');
              const rawCid = parts[3] || parts[2];
              cid = fromShortToken(rawCid);
              uid = cid.startsWith('user_') ? cid.replace('user_', '') : parts[2];
              reasonCode = parts[4] || 'general';
            }
            
            // RECOVERY
            if (cid.startsWith('k') || !cid) {
              const recovered = recoverIdFromMessage(message.text || message.caption);
              if (recovered) {
                cid = recovered;
                uid = cid.startsWith('user_') ? cid.replace('user_', '') : cid;
              }
            }
            
            toastText = "Membership Disapproved";

            let reasonText = "After reviewing your query, we could not verify your payment eligibility. Please ensure you have completed the payment on the billing page.";
            if (reasonCode === 'utr') reasonText = "The UTR or reference number provided could not be matched with bank records. Please submit a valid 12-digit transaction ID on the billing page.";
            if (reasonCode === 'fake') reasonText = "The payment proof provided appears to be invalid or unverified. Please upload a genuine transaction screenshot.";
            if (reasonCode === 'nopay' || reasonCode === 'nopayment') reasonText = "We could not find any active payment order for your account. Please visit Profile > Billing & Plans to upgrade.";

            const rejectMsg = {
                id: `msg_${Date.now()}`,
                sender: 'admin',
                senderName: 'PaperX Official Support',
                text: `❌ Membership Verification Update: ${reasonText}`,
                timestamp: Date.now()
            };
            await pushChatMessage(cid || uid, uid, rejectMsg);
            
            bot.sendMessage(chatId, `❌ *User \`${uid}\` Disapproved (${reasonCode.toUpperCase()}).* Notice delivered to user chat.`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('tickstat|')) {
          const parts = data.split('|');
          const rawId = parts[1];
          let ticketId = fromShortToken(rawId);
          const newStatus = parts[2];
          toastText = `Ticket updated to ${newStatus}`;

          let ticket = await getServerDoc('support_tickets', ticketId);
          
          // RECOVERY: If ticket not found and looks like a short token (or empty), try to parse from message
          if (!ticket && (ticketId.startsWith('k') || !ticketId)) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) {
              console.log(`[Telegram Bot] Recovered ticket ID from message text: ${recovered}`);
              ticketId = recovered;
              ticket = await getServerDoc('support_tickets', ticketId);
            }
          }

          // Fallback: If still not found by ID, try finding a ticket with this orderId (for old messages)
          if (!ticket) {
            const allTickets = await getServerDocs('support_tickets');
            ticket = allTickets.find(t => t.orderId === ticketId || t.ticketId === ticketId);
            if (ticket) {
              // Adjust ticketId to the real one found
              const realTicketId = ticket.id || ticket.ticketId;
              await updateServerDoc('support_tickets', realTicketId, {
                status: newStatus,
                adminDecision: newStatus, // Will be updated below with statusLabel
                updatedAt: Date.now()
              });
              // Continue with the found ticket
            }
          }

          if (ticket) {
            const realTicketId = ticket.id || ticket.ticketId;
            const uid = ticket.uid;
            const chatKey = uid.replace(/[^a-zA-Z0-9]/g, '_');
            
            let statusLabel = newStatus;
            let userMsg = `Update on your refund request (Ticket ${realTicketId}): Status is now **${newStatus}**.`;
            
            if (newStatus === 'COMPLETED') {
              statusLabel = 'Completed (Refund Paid)';
              userMsg = `✅ Your refund for ticket ${realTicketId} has been **COMPLETED & PAID** to your provided UPI ID. Please check your bank account.`;
              
              // Automatically downgrade user to Basic Plan after successful refund
              try {
                await updateServerDoc('users', uid, {
                  plan: 'Basic Plan',
                  purchasedPlan: 'Basic Plan',
                  activePlanMode: 'Basic Plan',
                  isPro: false,
                  membershipTier: 'free',
                  planExpiresAt: null,
                  subscriptionStatus: 'free',
                  updatedAt: new Date().toISOString()
                });
                console.log(`User ${uid} downgraded to Basic Plan after refund completion.`);
              } catch (downgradeErr) {
                console.error(`Error downgrading user ${uid} after refund:`, downgradeErr);
              }
            } else if (newStatus === 'REJECTED_WRONG_INFO') {
              statusLabel = 'Rejected (Wrong Info)';
              userMsg = `❌ Your refund request (Ticket ${realTicketId}) was **REJECTED** due to wrong information (invalid UPI or Phone). Please contact support.`;
            } else if (newStatus === 'REJECTED_NOT_VALID') {
              statusLabel = 'Rejected (Not Valid)';
              userMsg = `❌ Your refund request (Ticket ${realTicketId}) was **REJECTED** as it does not meet our refund eligibility criteria (>10 items created or >48h passed).`;
            } else if (newStatus === 'PROCESSING') {
              statusLabel = 'Processing';
              userMsg = `⏳ Your refund request (Ticket ${realTicketId}) is now being **PROCESSED** by our finance team.`;
            }

            await updateServerDoc('support_tickets', realTicketId, {
              status: newStatus,
              adminDecision: statusLabel,
              updatedAt: Date.now()
            });

            // ⚡ Emit socket event for instant app reaction
            emitAdminAction("ticket-updated", { ticketId: realTicketId, status: newStatus, orderId: ticket.orderId });

            if (ticket.orderId) {
              const orderUpdates: any = {
                ticketStatus: newStatus,
                updatedAt: Date.now()
              };
              if (newStatus === 'COMPLETED') {
                orderUpdates.status = 'REFUNDED';
                orderUpdates.refundedAt = Date.now();
                orderUpdates.refundReason = ticket.ticketReason || 'Approved via Admin Panel';
              }
              await updateServerDoc('orders', ticket.orderId, orderUpdates);
            }

            // INSTANT DOWNGRADE: If refund is approved (COMPLETED), revert automatically to Basic 5-day Plan
            if (newStatus === 'COMPLETED' && uid) {
              const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
              const fiveDaysExpiresAt = new Date(Date.now() + fiveDaysMs).toISOString();
              await updateServerDoc('users', uid, {
                plan: 'Basic Plan',
                purchasedPlan: 'Basic Plan',
                activePlanMode: 'Basic Plan',
                billingCycle: 'month',
                isPro: false,
                isRefunded: true,
                membershipTier: 'free',
                planExpiresAt: fiveDaysExpiresAt,
                maxProjects: 5,
                updatedAt: new Date().toISOString()
              });
              // Emit socket event for instant app reaction
              emitAdminAction("user-downgraded", { 
                uid: uid, 
                status: 'REFUNDED', 
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

            const notice = {
              id: `msg_${Date.now()}`,
              sender: 'admin',
              senderName: 'PaperX Official Support',
              text: userMsg,
              timestamp: Date.now()
            };
            await pushChatMessage(chatKey, uid, notice);

            bot.sendMessage(chatId, `🎫 *Ticket \`${realTicketId}\` updated to ${statusLabel}.* User has been notified.`, { parse_mode: 'Markdown' });
          } else {
            bot.sendMessage(chatId, `⚠️ Ticket \`${ticketId}\` not found. (If you recently restarted the server, old buttons may not work if they used short tokens).`);
          }
        } else if (data?.startsWith('ap|') || data?.startsWith('approve_')) {
          const rawOid = data.startsWith('ap|') ? data.split('|')[1] : data.replace('approve_', '');
          let oid = fromShortToken(rawOid);
          toastText = `Approved order ${oid}`;
          
          // 1. Update In-Memory Order if active
          const memOrder = activeOrders.get(oid);
          if (memOrder) {
            memOrder.status = 'VERIFIED';
            memOrder.verifiedAt = Date.now();
            activeOrders.set(oid, memOrder);
          }

          // 2. Fetch order data from database
          let oData = await getServerDoc('orders', oid) || (memOrder ? { plan: memOrder.plan, uid: memOrder.uid } : null);

          // RECOVERY: If order not found and looks like a short token (or empty/undefined), try to parse from message
          if (!oData && (oid.startsWith('k') || !oid || oid === 'undefined')) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered && recovered !== 'undefined') {
              console.log(`[Telegram Bot] Recovered order ID from message text for Approval: ${recovered}`);
              oid = recovered;
              oData = await getServerDoc('orders', oid);
            }
          }

          if (!oData) {
            bot.sendMessage(chatId, `⚠️ Order \`${oid}\` not found. Action aborted. (If you recently restarted the server, old buttons may not work if they used short tokens).`);
            bot.answerCallbackQuery(callbackQuery.id, { text: "Error: Order not found" });
            return;
          }

          if (oData) {
            const targetPlan = oData.plan || 'Plus Plan';
            const userUid = oData.uid || 'guest_user';
            const billingCycle = oData.billingCycle || 'month';
            const durationDays = oData.durationDays || (
              billingCycle === '1-min' ? (1 / 1440) :
              billingCycle === 'half-year' ? 180 : 
              billingCycle === 'year' ? 365 : 30
            );
            const planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

            // Mark order as verified in Firestore
            const orderUpdate: any = {
              status: 'VERIFIED',
              billingCycle,
              durationDays,
              planExpiresAt,
              verifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // If there's an associated ticket, resolve it
            if (oData && oData.ticketId) {
              orderUpdate.ticketStatus = 'RESOLVED';
              await updateServerDoc('support_tickets', oData.ticketId, {
                status: 'RESOLVED',
                adminDecision: 'Payment Verified via Telegram & Membership Activated',
                updatedAt: Date.now()
              }).catch(() => {});
            }

            await updateServerDoc('orders', oid, orderUpdate);

            // ⚡ Emit socket event for instant app reaction
            emitAdminAction("order-updated", { orderId: oid, status: 'VERIFIED', plan: targetPlan });

            // Upgrade User Account in Firestore with real plan expiration
            if (userUid && userUid !== 'guest_user') {
              await updateServerDoc('users', userUid, {
                plan: targetPlan,
                purchasedPlan: targetPlan,
                activePlanMode: targetPlan,
                billingCycle,
                planExpiresAt,
                subscriptionStatus: 'active',
                maxProjects: 9999,
                isPro: true,
                updatedAt: new Date().toISOString()
              });
            }

            // Send instant success notice in user's in-app chat thread
            const chatKey = userUid.replace(/[^a-zA-Z0-9]/g, '_');

            // Handle Simultaneous Refund for Upgrades
            if (oData.isUpgradePath && oData.upgradeFromOrderId) {
              console.log(`[Telegram Bot] Processing automatic refund for original order ${oData.upgradeFromOrderId} due to upgrade.`);
              await updateServerDoc('orders', oData.upgradeFromOrderId, {
                status: 'REFUNDED',
                refundedAt: Date.now(),
                refundReason: `Automatic refund due to upgrade to ${targetPlan} (Order ${oid})`,
                adminDecision: 'Refunded automatically on upgrade approval'
              });
              
              // Emit socket for the old order too
              emitAdminAction("order-updated", { orderId: oData.upgradeFromOrderId, status: 'REFUNDED' });

              // Send notice to user
              const refundNoticeMsg = {
                id: `msg_refund_${Date.now()}`,
                sender: 'admin',
                senderName: 'PaperX Official Support',
                text: `🔄 Simultaneous Upgrade Success! Your previous order (${oData.upgradeFromOrderId}) has been automatically marked for REFUND as you've upgraded to ${targetPlan}. The refund will be processed back to your original source within 3-5 business days.`,
                timestamp: Date.now()
              };
              await pushChatMessage(chatKey, userUid, refundNoticeMsg);
            }

            const approvalMsg = {
              id: `msg_${Date.now()}`,
              sender: 'admin',
              senderName: 'PaperX Official Support',
              text: `🎉 Great news! Your payment for ${targetPlan} (Order ${oid}) has been VERIFIED & APPROVED. Your account has been upgraded with all premium perks immediately!`,
              timestamp: Date.now()
            };
            await pushChatMessage(chatKey, userUid, approvalMsg);

            // Remove buttons to prevent multiple clicks
            try {
              await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: message.message_id });
            } catch (e) {
              console.warn(`[Telegram Bot] Could not edit message markup:`, e);
            }

            bot.sendMessage(chatId, `✅ *Order \`${oid}\` APPROVED!*\n• Plan: *${targetPlan}*\n• User \`${userUid}\` upgraded with all perks.`, { parse_mode: 'Markdown' });
          } else {
            bot.sendMessage(chatId, `⚠️ Order \`${oid}\` not found in database.`);
          }
        } else if (data?.startsWith('rj|') || data?.startsWith('reject_')) {
          let oid = '';
          let reasonCode = 'general';
          if (data.startsWith('rj|')) {
            const parts = data.split('|');
            const rawOid = parts[1];
            oid = fromShortToken(rawOid);
            reasonCode = parts[2] || 'general';
          } else {
            const parts = data.split('_');
            const rawOid = parts[1];
            oid = fromShortToken(rawOid);
            reasonCode = parts[2] || 'general';
          }
          toastText = `Rejected order ${oid}`;

          let reasonText = "Wrong UTR: The submitted 12-digit UTR could not be matched with bank records. Please check your UPI app receipt and re-enter the correct 12-digit reference number.";
          if (reasonCode === 'failed' || reasonCode === 'fail') reasonText = "Your payment transaction appears to have failed or was reversed by your bank. Please check your banking app and try again.";
          if (reasonCode === 'fake') reasonText = "The transaction screenshot provided appears to be invalid or already used. Please provide a valid transaction reference.";

          // 1. Update In-Memory Order
          const memOrder = activeOrders.get(oid);
          if (memOrder) {
            memOrder.status = 'REJECTED';
            (memOrder as any).rejectionReason = reasonText;
            activeOrders.set(oid, memOrder);
          }

          // 2. Update Database Record
          let oData = await getServerDoc('orders', oid) || (memOrder ? { uid: memOrder.uid } : null);

          // RECOVERY: If order not found and looks like a short token (or empty/undefined), try to parse from message
          if (!oData && (oid.startsWith('k') || !oid || oid === 'undefined')) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered && recovered !== 'undefined') {
              console.log(`[Telegram Bot] Recovered order ID from message text for Rejection: ${recovered}`);
              oid = recovered;
              oData = await getServerDoc('orders', oid);
            }
          }

          if (!oData) {
            bot.sendMessage(chatId, `⚠️ Order \`${oid}\` not found. Action aborted. (If you recently restarted the server, old buttons may not work if they used short tokens).`);
            bot.answerCallbackQuery(callbackQuery.id, { text: "Error: Order not found" });
            return;
          }

          await updateServerDoc('orders', oid, {
            status: 'REJECTED',
            rejectedAt: new Date().toISOString(),
            rejectionReason: reasonText,
            rejectionCode: reasonCode,
            updatedAt: new Date().toISOString()
          });

          // ⚡ Emit socket event for instant app reaction
          emitAdminAction("order-updated", { orderId: oid, status: 'REJECTED', reason: reasonText, reasonCode });

          if (oData && oData.uid) {
            const chatKey = oData.uid.replace(/[^a-zA-Z0-9]/g, '_');
            const rejectMsg = {
              id: `msg_${Date.now()}`,
              sender: 'admin',
              senderName: 'PaperX Official Support',
              text: `⚠️ Payment Verification Notice for Order ${oid}: ${reasonText}`,
              timestamp: Date.now()
            };
            await pushChatMessage(chatKey, oData.uid, rejectMsg);
          }

          // Remove buttons to prevent multiple clicks
          try {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: message.message_id });
          } catch (e) {
            console.warn(`[Telegram Bot] Could not edit message markup:`, e);
          }

          bot.sendMessage(chatId, `❌ *Order \`${oid}\` REJECTED (${reasonCode.toUpperCase()}).* User has been notified.`, { parse_mode: 'Markdown' });
        } else if (data?.startsWith('msg|') || data?.startsWith('msg_')) {
          let uid = '';
          let oid = 'payment';
          if (data.startsWith('msg|')) {
            const rawUid = data.split('|')[1];
            uid = fromShortToken(rawUid);
          } else {
            const parts = data.split('_');
            const rawUid = parts[1];
            uid = fromShortToken(rawUid);
            oid = parts[2] || 'payment';
          }
          
          // RECOVERY
          if (uid.startsWith('k') || !uid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) uid = recovered;
          }
          
          toastText = "Sent stuck money notice";

          const stuckMoneyNotice = `⚠️ Notice regarding your payment (Order ${oid}): We noticed your transaction might be stuck in banking verification or pending UTR matching. Our support team is actively checking it. Please share your transaction reference or screenshot here if money was debited.`;
          await sendDirectUserMessage(chatId, uid, stuckMoneyNotice);
        } else if (data?.startsWith('qr|') || data?.startsWith('quickreply_')) {
          const rawUid = data.startsWith('qr|') ? data.split('|')[1] : data.split('_')[1];
          let uid = fromShortToken(rawUid);
          
          // RECOVERY
          if (uid.startsWith('k') || !uid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) uid = recovered;
          }
          
          toastText = "Sent status update";
          const quickMsg = `👋 Hello! An administrator is currently reviewing your account and documents. Everything is in progress. Please feel free to ask any other questions!`;
          await sendDirectUserMessage(chatId, uid, quickMsg);
        } else if (data?.startsWith('custommsg_')) {
          const rawUid = data.replace('custommsg_', '');
          let uid = fromShortToken(rawUid);
          
          // RECOVERY
          if (uid.startsWith('k') || !uid) {
            const recovered = recoverIdFromMessage(message.text || message.caption);
            if (recovered) uid = recovered;
          }
          
          toastText = "Instructions sent";
          bot.sendMessage(chatId, `💬 To send a custom message to user \`${uid}\`, type:\n\n\`/msg ${uid} Your message text here\``, { parse_mode: 'Markdown' });
        }

        bot.answerCallbackQuery(callbackQuery.id, { text: toastText });
      } catch (err: any) {
        console.error("[Telegram Bot] Callback dispatcher error:", err);
        bot.sendMessage(chatId, `⚠️ Error: ${err.message}`);
        bot.answerCallbackQuery(callbackQuery.id, { text: `Error: ${err.message}` });
      }
    });
  } catch (err) {
    console.error("[Telegram Bot] Initialization error:", err);
  }
};
