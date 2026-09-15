import { LucideIcon } from 'lucide-react';

export enum ToolCategory {
  CONVERT = 'Convert',
  CREATE = 'Create',
  ORGANIZE = 'Organize',
  OPTIMIZE = 'Optimize',
  EDIT = 'Edit & Annotate',
  SECURITY = 'Security'
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  isPopular?: boolean;
  isNew?: boolean;
  requiredPlan?: 'Free' | 'Plus' | 'Max';
  action?: (file: File) => Promise<any>;
}

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'Basic Plan' | 'Plus Plan' | 'Max Plan';
  purchasedPlan?: 'Basic Plan' | 'Plus Plan' | 'Max Plan';
  activePlanMode?: 'Basic Plan' | 'Plus Plan' | 'Max Plan';
  planExpiresAt?: string;
  basicPlanStartedAt?: string;
  basicPlanExpiresAt?: string;
  billingCycle?: 'month' | 'half-year' | 'year';
  previousPlan?: 'Plus Plan' | 'Max Plan' | 'Basic Plan';
  isPro?: boolean;
  isRefunded?: boolean;
  membershipTier?: 'free' | 'basic' | 'plus' | 'max';
  featureUsageCount?: number;
  subscriptionStatus?: 'active' | 'expired' | 'pending' | 'free';
  subscriptionEndDate?: string;
  memberSince: string;
  projectsUsed: number;
  maxProjects: number; // -1 for unlimited
  currency?: string; // e.g., 'INR', 'USD'
  country?: string;   // e.g., 'India', 'USA'
  language?: string; // e.g., 'English (US)'
  jobTitle?: string;
  company?: string;
  phone?: string;
  location?: string;
  bio?: string;
  forceLogout?: boolean;
  forceReLogin?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  isRestricted?: boolean;
  restrictedPermanently?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'totp';
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  fontSize?: 'system' | 'small' | 'medium' | 'large';
  notificationSoundEnabled?: boolean;
  analyticsEnabled?: boolean;
  largerTextEnabled?: boolean;
  autoRestoreSession?: boolean;
  pdfQuality?: 'high' | 'standard' | 'compact';
  pageSize?: 'a4' | 'letter' | 'legal';
  namingPattern?: 'paperx_date' | 'original_processed' | 'timestamp';
  autoCrop?: boolean;
  scannerFilter?: 'enhance' | 'bw' | 'grayscale' | 'whiteboard' | 'original';
  autoSaveScan?: boolean;
  ocrLanguage?: string;
  autoCopyText?: boolean;
  pdfAutoCompress?: boolean;
  theme?: 'light' | 'dark';
  lastLogoutAllAt?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress?: string;
  location?: string;
  lastActive: string;
  loginTime?: string;
  isCurrentSession?: boolean;
  revoked?: boolean;
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'uploading' | 'processing' | 'ready' | 'error' | 'cancelled';
  progress: number; // 0-100
  result?: string; // URL or text content
}

export interface ToastNotificationItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  toolName?: string;
  fileName?: string;
  fileSize?: string;
  downloadBlob?: Blob;
  downloadFileName?: string;
  duration?: number;
}

export interface BatchItemResult {
  id: string;
  originalName: string;
  filename: string;
  blob: Blob;
  size: number;
  originalSize: number;
  type: string;
  savingsPercentage?: number;
}

export interface BatchProcessResult {
  toolId: string;
  toolName: string;
  timestamp: number;
  items: BatchItemResult[];
  bundleBlob: Blob;
  bundleFilename: string;
  isBundleZip: boolean;
  totalOriginalSize: number;
  totalProcessedSize: number;
  totalSavingsPercentage?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  recipient: 'ALL' | 'PRO_USERS' | 'FREE_USERS' | 'CUSTOM' | string;
  recipientEmail?: string;
  recipientUserId?: string;
  priority: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  type?: 'CUSTOM_MESSAGE' | 'ANNOUNCEMENT' | 'OFFER' | 'SYSTEM_ALERT' | 'ORDER_UPDATE';
  sender?: string;
  senderName?: string;
  createdAt: number;
  timestamp?: number;
  readBy?: string[];
  actionUrl?: string;
  actionLabel?: string;
  isUrgentPopup?: boolean;
}

export type BillingCycleType = 'month' | 'half-year' | 'year';

export const BILLING_CYCLE_RANKS: Record<BillingCycleType, number> = {
  'month': 1,
  'half-year': 2,
  'year': 3
};

export const BILLING_CYCLE_LABELS: Record<BillingCycleType, string> = {
  'month': '1 Month',
  'half-year': '6 Months (Half-Year)',
  'year': '1 Year'
};

export const PLAN_CYCLE_VALUES: Record<string, Record<BillingCycleType, number>> = {
  'Plus Plan': {
    'month': 50,
    'half-year': 250,
    'year': 500,
  },
  'Max Plan': {
    'month': 100,
    'half-year': 500,
    'year': 1000,
  }
};

export const getPlanCreditValue = (planName?: string | null, cycle?: BillingCycleType | string | null): number => {
  if (!planName) return 0;
  const p = planName.toLowerCase().includes('max') ? 'Max Plan' : planName.toLowerCase().includes('plus') || planName.toLowerCase().includes('pro') ? 'Plus Plan' : null;
  if (!p) return 0;
  const c = (cycle as BillingCycleType) || 'month';
  return PLAN_CYCLE_VALUES[p]?.[c] || (p === 'Max Plan' ? 100 : 50);
};

/**
 * Checks whether the user's purchased subscription cycle covers the target billing cycle.
 * Each membership duration strictly covers only its own season (e.g. Month only covers Month).
 * Higher durations (Half-Year, Year) are separate and require upgrading.
 */
export const isBillingCycleCovered = (
  userCycle: BillingCycleType | string | undefined, 
  targetCycle: BillingCycleType | string
): boolean => {
  if (!userCycle || !targetCycle) return false;
  return userCycle === targetCycle;
};

export const getUserPurchasedTier = (user: User | null | undefined): 'Free' | 'Plus' | 'Max' => {
  if (!user) return 'Free';

  if (user.isRefunded) {
    return 'Free';
  }

  // Check if expired
  if (user.planExpiresAt) {
    const expiry = new Date(user.planExpiresAt).getTime();
    if (Date.now() > expiry) return 'Free';
  }

  // Check explicit purchasedPlan first
  if (user.purchasedPlan) {
    const purchased = user.purchasedPlan.toLowerCase();
    if (purchased.includes('max')) return 'Max';
    if (purchased.includes('plus') || purchased.includes('pro')) return 'Plus';
    if (purchased.includes('basic') || purchased.includes('free')) return 'Free';
  }

  const p = (user.plan || '').toLowerCase();
  const tier = ((user as any).membershipTier || '').toLowerCase();

  if (p.includes('max') || tier.includes('max')) return 'Max';
  if (p.includes('plus') || p.includes('pro') || tier.includes('plus')) return 'Plus';
  return 'Free';
};

export interface ReadyMadeTicketReason {
  id: string;
  title: string;
  desc: string;
}

export const READYMADE_TICKET_REASONS = {
  REJECTED: [
    {
      id: 'debited_but_rejected',
      title: 'Amount debited from Bank / UPI, but order is marked Rejected',
      desc: 'Money was deducted from my bank/UPI account, but the order was rejected in error.'
    },
    {
      id: 'valid_utr_rejected',
      title: 'Submitted valid 12-digit UTR from UPI app (GPay / PhonePe / Paytm)',
      desc: 'Entered genuine 12-digit reference number from payment receipt, please re-verify bank statement.'
    },
    {
      id: 'wrong_utr_entered',
      title: 'Incorrect UTR entered by mistake — have correct transaction reference',
      desc: 'I typed wrong UTR digits during submission and want to submit the correct reference.'
    },
    {
      id: 'successful_on_app',
      title: 'Transaction shows Successful on UPI app, please re-check bank statement',
      desc: 'Payment succeeded on bank end with confirmed UTR, membership should be activated.'
    },
    {
      id: 'screenshot_ready',
      title: 'Payment screenshot & bank transaction proof ready for manual review',
      desc: 'I have the official debit confirmation SMS / screenshot for PaperX Team review.'
    },
    {
      id: 'debited_multiple',
      title: 'Debited multiple times or charged twice for this plan',
      desc: 'My account was debited more than once for this subscription.'
    }
  ] as ReadyMadeTicketReason[],
  AWAITING_LONG: [
    {
      id: 'waiting_over_10m',
      title: 'Payment sent > 10 mins ago, still stuck under verification',
      desc: 'Payment was completed and UTR submitted, but order is still pending after prolonged wait.'
    },
    {
      id: 'money_debited_not_activated',
      title: 'Money debited from bank account, but membership not activated yet',
      desc: 'Funds were deducted immediately, urgent activation required for document operations.'
    },
    {
      id: 'urgent_work',
      title: 'Submitted correct 12-digit UTR, need urgent activation for work',
      desc: 'Genuine payment submitted, need PaperX Team priority manual approval immediately.'
    },
    {
      id: 'stuck_in_queue',
      title: 'Payment status stuck in verification queue without progress',
      desc: 'Order verification is delayed beyond normal processing turnaround.'
    },
    {
      id: 'qr_paid_awaiting',
      title: 'Paid via Official QR / VPA, waiting for manual confirmation',
      desc: 'Transaction completed to 7585813675@omni, awaiting verification team clearance.'
    }
  ] as ReadyMadeTicketReason[],
  REFUND_UPGRADE: [
    {
      id: 'refund_upgrade_annual',
      title: 'Refund Month/Half-Month membership to upgrade to 1-Year Membership',
      desc: 'I want a full refund on my short-term plan to immediately buy the annual Max/Plus plan for better savings.'
    },
    {
      id: 'refund_upgrade_6month',
      title: 'Refund Month/Half-Month membership to upgrade to 6-Month Membership',
      desc: 'I want to switch to the half-year plan for priority support and unlimited document processing.'
    },
    {
      id: 'changed_mind_upgrade',
      title: 'Changed mind within 5-day guarantee — upgrade to higher membership',
      desc: 'I recently subscribed but realized a long-term premium membership fits my document workflows better.'
    }
  ] as ReadyMadeTicketReason[]
};

export const getOrderTimestamp = (order: any): number => {
  if (!order) return 0;
  const val = order.createdAt || order.submittedAt || order.timestamp;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (val && typeof val.toMillis === 'function') return val.toMillis();
  if (val && typeof val.seconds === 'number') return val.seconds * 1000;
  return 0;
};

export const getOrderWaitMinutes = (order: any): number => {
  const ts = getOrderTimestamp(order);
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / (60 * 1000)));
};

export const isOrderAwaitingLongTime = (order: any, thresholdMinutes: number = 10): boolean => {
  const isPending = order.status === 'PENDING';
  if (!isPending) return false;
  const ts = getOrderTimestamp(order);
  if (!ts) return true;
  const diffMinutes = (Date.now() - ts) / (60 * 1000);
  return diffMinutes >= thresholdMinutes;
};


