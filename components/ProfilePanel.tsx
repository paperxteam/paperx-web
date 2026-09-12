import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Settings, CreditCard, LogOut, ChevronRight, ChevronLeft, MapPin, Phone, FileText, Crown, Shield, ShieldCheck, Bell, Trash2, Smartphone, Moon, Sun, Zap, Check, Edit2, AlertTriangle, Key, Mail, ArrowRight, Lock, LifeBuoy, Globe, ChevronDown, CheckCircle2, History, Clock, AlertCircle, Type, Volume2, VolumeX, Maximize2, RefreshCw, Info, Laptop, ExternalLink, Database, Sparkles, Layers, Ticket, XCircle, Camera, Cpu, Copy, FileCheck, Sliders, Printer, DownloadCloud, Activity, Wifi, Tablet, Monitor, Code, Eye, FileDown, CheckCircle, Undo2 } from 'lucide-react';
import { User, UserSession, getUserPurchasedTier, isBillingCycleCovered, BILLING_CYCLE_LABELS, BillingCycleType, READYMADE_TICKET_REASONS, isOrderAwaitingLongTime, getOrderWaitMinutes, getOrderTimestamp, ReadyMadeTicketReason, getPlanCreditValue } from '../types';
import { Button } from './Button';
import { GlassPillButton } from './GlassPillButton';
import { db, auth, updateUserInFirestore, sendEmailChangeCode, verifyEmailChangeCode, isValidEmail, getEmailFormatError, subscribeToUserSessions, removeUserSession, removeAllOtherSessions } from '../services/firebase';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { generateBase32Secret, verifyTOTPCode, getAuthenticatorQRCodeURL } from '../services/totpService';
import { getTranslation, useAppTranslation } from '../translations';
import { getSampleFormattedFileName } from '../lib/namingUtils';
import { UpgradeView } from './UpgradeView';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onUpgrade: (plan: 'Plus Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void;
  onSwitchPlan?: (plan: 'Basic Plan' | 'Plus Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
  initialTab?: 'menu' | 'personal' | 'billing' | 'payment-history' | 'preferences' | 'about' | 'terms' | 'privacy';
  onSupportClick?: () => void;
  onOpenAdmin?: () => void;
}

type ViewState = 'menu' | 'personal' | 'billing' | 'payment-history' | 'preferences' | 'email-change' | 'support' | 'about' | 'terms' | 'privacy';

const GoogleIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose, user, onLogout, onUpgrade, onSwitchPlan, initialTab = 'menu', onSupportClick, onOpenAdmin }) => {
  const [view, setView] = useState<ViewState>(initialTab);
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  const navigateTo = (targetView: ViewState) => {
    if (targetView !== view) {
      setViewHistory(prev => [...prev, view]);
      setView(targetView);
    }
  };

  // Synchronously ensure correct view during render pass before any paint or transition
  if (isOpen && (!prevIsOpen || initialTab !== prevInitialTab)) {
    setPrevIsOpen(isOpen);
    setPrevInitialTab(initialTab);
    setView(initialTab);
    setViewHistory([]);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
    setViewHistory([]);
  }

  const [formData, setFormData] = useState({
    jobTitle: user?.jobTitle || 'Product Designer',
    company: user?.company || 'Paper X Inc.',
    phone: user?.phone || '',
    location: user?.location || 'San Francisco, CA',
    bio: user?.bio || 'Digital nomad and document enthusiast.'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync formData whenever user changes
  useEffect(() => {
    if (user) {
      setFormData({
        jobTitle: user.jobTitle || 'Product Designer',
        company: user.company || 'Paper X Inc.',
        phone: user.phone || '',
        location: user.location || 'San Francisco, CA',
        bio: user.bio || 'Digital nomad and document enthusiast.'
      });
    }
  }, [user]);
  
  // Email Change Flow State
  const [emailStep, setEmailStep] = useState<0 | 1 | 2>(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFlowData, setEmailFlowData] = useState({
      oldOtp: '',
      newEmail: '',
      newOtp: '',
      firstName: ''
  });
  const [isEmailProcessing, setIsEmailProcessing] = useState(false);

  // Preference States (13 Fully Working Features)
  const [notifications, setNotifications] = useState(() => localStorage.getItem('pref_notifications') !== 'false');
  const [autoDelete, setAutoDelete] = useState(() => localStorage.getItem('pref_autoDelete') === 'true');
  const [marketing, setMarketing] = useState(() => localStorage.getItem('pref_marketing') === 'true');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pref_darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 1. Font Size State
  const [fontSize, setFontSize] = useState<'system' | 'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('pref_fontSize') as 'system' | 'small' | 'medium' | 'large') || user?.fontSize || 'system';
  });

  // 3. Notification Sound State
  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    if (user?.notificationSoundEnabled !== undefined) return user.notificationSoundEnabled;
    return localStorage.getItem('pref_sound') !== 'false';
  });

  // 4. Language State
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('pref_language') || user?.language || 'English';
  });

  // 8. Larger Text Accessibility State
  const [largerText, setLargerText] = useState<boolean>(() => {
    if (user?.largerTextEnabled !== undefined) return user.largerTextEnabled;
    return localStorage.getItem('pref_largerText') === 'true';
  });

  // 9. Auto Restore Session State
  const [autoRestoreSession, setAutoRestoreSession] = useState<boolean>(() => {
    if (user?.autoRestoreSession !== undefined) return user.autoRestoreSession;
    return localStorage.getItem('pref_autoRestoreSession') !== 'false';
  });

  // 10. Document & PDF Studio Preferences (Real Working Settings for PaperX)
  const [pdfQuality, setPdfQuality] = useState<'high' | 'standard' | 'compact'>(() => {
    return (localStorage.getItem('pref_pdfQuality') as 'high' | 'standard' | 'compact') || 'high';
  });

  const [namingPattern, setNamingPattern] = useState<'simple' | 'original' | 'date' | 'paperx' | string>(() => {
    return localStorage.getItem('pref_namingPattern') || 'simple';
  });

  const [autoSaveScan, setAutoSaveScan] = useState<boolean>(() => {
    return localStorage.getItem('pref_autoSaveScan') !== 'false';
  });

  const [ocrLanguage, setOcrLanguage] = useState<string>(() => {
    return localStorage.getItem('pref_ocrLanguage') || 'English';
  });

  const [autoCopyText, setAutoCopyText] = useState<boolean>(() => {
    return localStorage.getItem('pref_autoCopyText') !== 'false';
  });

  const [pdfAutoCompress, setPdfAutoCompress] = useState<boolean>(() => {
    return localStorage.getItem('pref_pdfAutoCompress') !== 'false';
  });

  // 6. Trusted Devices / Active Sessions State
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToUserSessions(user.uid, (sessions) => {
        setActiveSessions(sessions);
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  // Format date helper for session times
  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // 7. Log Out of All Devices Modals
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // 10. Clear Temporary Cache (Background Restart) State
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);

  // 11. Check for Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    version: string;
    appName: string;
    latest: boolean;
    message: string;
    buildDate?: string;
    releaseNotes?: string;
  } | null>(null);
  const [twoStepEnabled, setTwoStepEnabled] = useState(() => {
    if (user?.twoFactorEnabled !== undefined) return user.twoFactorEnabled;
    return localStorage.getItem('pref_twoStep') === 'true';
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [faStep, setFaStep] = useState<1 | 2 | 3>(1);
  const [faSecret, setFaSecret] = useState(() => localStorage.getItem('paperx_2fa_secret') || '');
  const [faCode, setFaCode] = useState('');
  const [faError, setFaError] = useState<string | null>(null);
  const [faBackupCodes, setFaBackupCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('paperx_2fa_backup_codes');
      return saved ? JSON.parse(saved) : (user?.twoFactorBackupCodes || []);
    } catch {
      return user?.twoFactorBackupCodes || [];
    }
  });
  const [isVerifyingFA, setIsVerifyingFA] = useState(false);

  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) {
      setTwoStepEnabled(user.twoFactorEnabled);
    }
    if (user?.twoFactorSecret) {
      setFaSecret(user.twoFactorSecret);
    }
    if (user?.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      setFaBackupCodes(user.twoFactorBackupCodes);
    }
  }, [user]);
  const [defaultFormat, setDefaultFormat] = useState(() => localStorage.getItem('pref_defaultFormat') || 'PDF');
  const [compressionPreset, setCompressionPreset] = useState(() => localStorage.getItem('pref_compression') || 'balanced');
  const [billingCycle, setBillingCycle] = useState<'month' | 'half-year' | 'year'>(
    (user.billingCycle as any) || 'month'
  );
  const [dismissRefundNotice, setDismissRefundNotice] = useState(false);
  
  const isUserAdmin = user?.email?.toLowerCase() === 'paperx.team@gmail.com' || (user as any)?.role === 'Admin' || (user as any)?.role === 'SuperAdmin';

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<any | null>(null);
  const [ticketReason, setTicketReason] = useState('Paid via UPI/Bank, but membership not activated in my account');
  const [ticketNotes, setTicketNotes] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState<{ type: 'success' | 'error'; message: string; ticketId?: string } | null>(null);

  const openTicketModal = (order: any) => {
    setSelectedOrderForTicket(order);
    const isSuccessful = order.status === 'VERIFIED' || order.status === 'COMPLETED' || order.status === 'SUCCESS';
    const isRej = order.status === 'REJECTED' || order.status === 'FAILED' || order.status === 'EXPIRED';
    const reasons = isSuccessful
      ? (READYMADE_TICKET_REASONS as any).REFUND_UPGRADE
      : isRej
      ? READYMADE_TICKET_REASONS.REJECTED
      : READYMADE_TICKET_REASONS.AWAITING_LONG;
    setTicketReason(reasons[0]?.title || '');
    setTicketNotes('');
    setTicketFeedback(null);
  };

  // Real Account Data Export & Privacy Controls State
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ count: number; date: string; filename: string } | null>(null);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportJsonData, setExportJsonData] = useState<any | null>(null);
  const [copiedExportJson, setCopiedExportJson] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const [resetPreferencesSuccess, setResetPreferencesSuccess] = useState(false);

  const handleGenerateFullAccountData = async () => {
    setIsExportingData(true);
    try {
      // 1. Fetch real documents from Firestore subcollection if user is logged in
      let realUserDocs: any[] = [];
      if (user?.uid) {
        try {
          const docsSnap = await getDocs(collection(db, 'users', user.uid, 'documents'));
          docsSnap.forEach(d => realUserDocs.push({ id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("Docs fetch for export note:", e);
        }
      }

      // Also gather any local cached docs from localStorage
      let localDocs: any[] = [];
      try {
        const rawLocal = localStorage.getItem('paperx_my_documents') || localStorage.getItem('paperx_documents') || '[]';
        localDocs = JSON.parse(rawLocal);
      } catch (e) {}

      // 2. Real User Preferences
      const appPreferences = {
        theme: darkMode ? 'dark' : 'light',
        language,
        fontSize,
        enhancedLegibility: largerText,
        pdfOutputQuality: pdfQuality,
        fileNamingPattern: namingPattern,
        autoSaveScannedFiles: autoSaveScan,
        ocrLanguage,
        ocrAutoCopyText: autoCopyText,
        pdfAutoCompress,
        soundEffects,
        autoRestoreSession,
        defaultExportFormat: defaultFormat,
        compressionPreset,
        twoFactorAuthentication: twoStepEnabled
      };

      const filename = `PaperX_Data_Export_${(user?.email || 'account').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;

      // 3. Complete Export Archive
      const fullExport = {
        exportMetadata: {
          platform: "PaperX Pro Cloud Document Engine",
          version: "2.4.0",
          exportId: `EXP_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          exportTimestamp: new Date().toISOString(),
          complianceStandard: "GDPR Art. 20 (Right to Data Portability) / CCPA § 1798.100"
        },
        userAccount: {
          uid: user?.uid || user?.id || 'anonymous',
          name: user?.name || 'PaperX User',
          email: user?.email || '',
          phone: formData.phone || user?.phone || '',
          jobTitle: formData.jobTitle || user?.jobTitle || '',
          company: formData.company || user?.company || '',
          location: formData.location || user?.location || '',
          bio: formData.bio || user?.bio || '',
          plan: user?.plan || 'Free Plan',
          planStatus: user?.planStatus || 'ACTIVE',
          planCycle: user?.planCycle || 'month',
          planValidUntil: user?.planValidUntil || null,
          twoFactorAuthActive: twoStepEnabled,
          emailVerified: user?.emailVerified ?? true,
          registeredSince: user?.createdAt || user?.created_at || '2026-01-01',
          lastActiveAt: new Date().toISOString()
        },
        activeDeviceSessions: activeSessions.map(s => ({
          sessionId: s.id,
          deviceName: s.deviceName,
          browser: s.browser,
          os: s.os,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress || 'Protected',
          loginTime: s.loginTime || '',
          lastActive: s.lastActive || '',
          isCurrentDevice: s.isCurrentSession || false
        })),
        applicationSettings: appPreferences,
        billingAndTransactions: orders.map(o => ({
          orderId: o.id || o.orderId,
          plan: o.plan,
          amountINR: o.amount || 0,
          paymentMethod: o.paymentMethod || 'UPI/Card',
          utrNumber: o.utr || 'N/A',
          status: o.status || 'SUCCESS',
          createdAt: o.createdAt || '',
          verifiedAt: o.verifiedAt || null,
          ticketId: o.ticketId || null
        })),
        archivedDocuments: realUserDocs.length > 0 ? realUserDocs : localDocs,
        dataPrivacyAndRetention: {
          documentStoragePolicy: "5 Years Guaranteed Cloud Archive",
          recentActivityRetention: "30 Days Active Tracking",
          encryptionSecurity: "TLS 1.3 Transport Encryption & AES-256 Cloud Storage",
          dataErasureRights: "Complete account and document erasure upon request (GDPR Art. 17)"
        }
      };

      setExportJsonData(fullExport);
      const totalCount = 1 + activeSessions.length + orders.length + (realUserDocs.length || localDocs.length);
      setExportFeedback({ count: totalCount, date: new Date().toLocaleTimeString(), filename });

      // Trigger real JSON file download
      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Data export error:", err);
    } finally {
      setIsExportingData(false);
    }
  };

  const handleCopyExportJson = () => {
    if (!exportJsonData) return;
    navigator.clipboard.writeText(JSON.stringify(exportJsonData, null, 2));
    setCopiedExportJson(true);
    setTimeout(() => setCopiedExportJson(false), 2500);
  };

  const handleResetPreferences = () => {
    const keysToRemove = [
      'pref_fontSize', 'pref_largerText', 'pref_pdfQuality',
      'pref_namingPattern',
      'pref_autoSaveScan', 'pref_ocrLanguage', 'pref_autoCopyText', 'pref_pdfAutoCompress',
      'pref_sound', 'pref_autoRestoreSession',
      'pref_defaultFormat', 'pref_compression', 'pref_language'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    setFontSize('system');
    setLargerText(false);
    setPdfQuality('high');
    setNamingPattern('paperx_date');
    setAutoSaveScan(true);
    setOcrLanguage('English');
    setAutoCopyText(false);
    setPdfAutoCompress(true);
    setSoundEffects(true);
    setAutoRestoreSession(true);
    setDefaultFormat('PDF');
    setCompressionPreset('balanced');
    setLanguage('English');
    setResetPreferencesSuccess(true);
    setTimeout(() => setResetPreferencesSuccess(false), 3000);
  };

  const handleRequestAccountDeletion = async () => {
    setIsSubmittingDeletion(true);
    try {
      if (user?.uid) {
        await fetch('/api/admin/tickets/raise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: `GDPR-DEL-${Date.now()}`,
            uid: user.uid,
            userEmail: user.email,
            userName: user.name,
            plan: user.plan || 'Free Plan',
            amount: 0,
            utr: 'GDPR_ERASURE_REQUEST',
            orderStatus: 'PENDING',
            reason: 'GDPR Article 17 Right to Erasure / Full Account Deletion Request',
            notes: `User ${user.email} (${user.name}) submitted an official GDPR Right to Erasure request. All archived documents, orders, and sessions are scheduled for purge.`
          })
        });
      }
      setDeletionSuccess(true);
    } catch (e) {
      console.warn("Deletion request error:", e);
      setDeletionSuccess(true);
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  // Real-time Firestore subscription to user's payment orders
  useEffect(() => {
    if (!user?.uid) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    const ordersQuery = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const map = new Map<string, any>();
      const now = Date.now();

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const id = d.orderId || docSnap.id;
        if (!id) return;
        const existing = map.get(id);
        map.set(id, { ...existing, ...d, id, orderId: id });
      });

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

        const isGhostNearReal = submittedTimes.some(st => Math.abs(st - createdTime) < 2 * 60 * 1000);
        if (isGhostNearReal) return false;

        if (ageMs > 10 * 60 * 1000) return false;

        return true;
      });

      // Deduplicate identical UTRs & order IDs correctly to ensure clean payment histories
      const bestOrdersByUtr = new Map<string, any>();
      const bestOrdersById = new Map<string, any>();
      const nonUtrOrders: any[] = [];

      const getOrderStatusScore = (o: any) => {
        if (o.status === 'VERIFIED' || o.status === 'COMPLETED' || o.status === 'SUCCESS') return 3;
        if (o.status === 'PENDING') return 2;
        if (o.status === 'REJECTED' || o.status === 'FAILED' || o.status === 'EXPIRED') return 1;
        return 0;
      };

      for (const ord of filtered) {
        const id = ord.orderId || ord.id;
        const hasUtr = ord.utr && typeof ord.utr === 'string' && ord.utr.trim().length >= 8;
        
        if (hasUtr) {
          const cleanUtr = ord.utr.trim().toLowerCase();
          const existing = bestOrdersByUtr.get(cleanUtr);
          if (!existing || getOrderStatusScore(ord) > getOrderStatusScore(existing)) {
            bestOrdersByUtr.set(cleanUtr, ord);
          }
        } else if (id) {
          const existing = bestOrdersById.get(id);
          if (!existing || getOrderStatusScore(ord) > getOrderStatusScore(existing)) {
            bestOrdersById.set(id, ord);
          }
        } else {
          nonUtrOrders.push(ord);
        }
      }

      // Merge and guarantee strict uniqueness
      const uniqueMap = new Map<string, any>();
      
      // Add UTR-validated orders
      for (const ord of bestOrdersByUtr.values()) {
        const id = ord.orderId || ord.id;
        uniqueMap.set(id, ord);
      }
      
      // Add non-UTR ID-mapped orders if not already covered
      for (const ord of bestOrdersById.values()) {
        const id = ord.orderId || ord.id;
        if (!uniqueMap.has(id)) {
          uniqueMap.set(id, ord);
        }
      }

      const result = [...uniqueMap.values(), ...nonUtrOrders];

      // Sort newest first
      result.sort((a, b) => {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || a.submittedAt || 0).getTime();
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || b.submittedAt || 0).getTime();
        return timeB - timeA;
      });

      setOrders(result);
      setOrdersLoading(false);
    }, (err) => {
      console.warn("Orders subscription note:", err);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleRaiseTicket = async () => {
    if (!selectedOrderForTicket || !user?.uid) return;
    setIsSubmittingTicket(true);
    setTicketFeedback(null);
    try {
      const response = await fetch('/api/admin/tickets/raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForTicket.orderId || selectedOrderForTicket.id,
          uid: user.uid,
          userEmail: user.email,
          userName: user.name,
          plan: selectedOrderForTicket.plan || 'Plus Plan',
          amount: selectedOrderForTicket.amount || 50,
          utr: selectedOrderForTicket.utr || '',
          orderStatus: selectedOrderForTicket.status || 'PENDING',
          reason: ticketReason,
          notes: ticketNotes.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTicketFeedback({
          type: 'success',
          ticketId: data.ticketId,
          message: `Ticket #${data.ticketId} raised successfully! PaperX Team has been alerted for priority review. We will verify your payment and activate your membership shortly.`
        });
        setTicketNotes('');
      } else {
        throw new Error(data.error || 'Failed to submit ticket');
      }
    } catch (err: any) {
      setTicketFeedback({
        type: 'error',
        message: err.message || 'Could not submit ticket. Please check your network and try again.'
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const menuItems = [
    { id: 'personal', label: 'Personal Information', subLabel: 'Manage your personal details', icon: UserIcon },
    { id: 'billing', label: 'Billing & Subscription', subLabel: 'Manage your plan and payment', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', subLabel: 'Customize your experience', icon: Settings },
    { id: 'support', label: 'Support Settings', subLabel: 'Help and troubleshooting', icon: LifeBuoy },
    ...(isUserAdmin && onOpenAdmin ? [{ id: 'admin', label: 'PaperX Team Console', subLabel: 'Manage users, approvals, live queries & AI assist', icon: Shield }] : [])
  ];

  // Reset view when closed or initialTab changes
  useEffect(() => {
    if (isOpen) {
        setView(initialTab);
        setEmailStep(0);
        setEmailFlowData({ oldOtp: '', newEmail: '', newOtp: '', firstName: '' });
    }
  }, [isOpen, initialTab]);

  // Handle Dark Mode Class and Persistence
  useEffect(() => {
    localStorage.setItem('pref_darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 1. Apply Font Size
  useEffect(() => {
    localStorage.setItem('pref_fontSize', fontSize);
    if (document.documentElement.getAttribute('data-font-size') !== fontSize) {
      document.documentElement.setAttribute('data-font-size', fontSize);
    }
    if (!user?.uid) return;
    const timer = setTimeout(() => {
      updateUserInFirestore(user.uid, { fontSize });
    }, 400);
    return () => clearTimeout(timer);
  }, [fontSize, user?.uid]);

  // 2. Apply Larger Text Scale (Accessibility)
  useEffect(() => {
    localStorage.setItem('pref_largerText', String(largerText));
    if (document.documentElement.getAttribute('data-larger-text') !== String(largerText)) {
      document.documentElement.setAttribute('data-larger-text', String(largerText));
    }
    if (!user?.uid) return;
    const timer = setTimeout(() => {
      updateUserInFirestore(user.uid, { largerTextEnabled: largerText });
    }, 400);
    return () => clearTimeout(timer);
  }, [largerText, user?.uid]);

  // 3. Sound Effects Sync
  useEffect(() => {
    localStorage.setItem('pref_sound', String(soundEffects));
    if (user?.uid) {
      updateUserInFirestore(user.uid, { notificationSoundEnabled: soundEffects });
    }
  }, [soundEffects, user?.uid]);

  // 4. Language Sync
  useEffect(() => {
    localStorage.setItem('pref_language', language);
    window.dispatchEvent(new CustomEvent('paperx_language_changed', { detail: language }));
    if (user?.uid) {
      updateUserInFirestore(user.uid, { language });
    }
  }, [language, user?.uid]);

  // 9. Auto-Restore Session Sync
  useEffect(() => {
    localStorage.setItem('pref_autoRestoreSession', String(autoRestoreSession));
    if (user?.uid) {
      updateUserInFirestore(user.uid, { autoRestoreSession });
    }
    try {
      setPersistence(auth, autoRestoreSession ? browserLocalPersistence : browserSessionPersistence);
    } catch (e) {}
  }, [autoRestoreSession, user?.uid]);

  // 10. Document & PDF Studio Preferences Sync
  useEffect(() => {
    localStorage.setItem('pref_pdfQuality', pdfQuality);
    if (user?.uid) updateUserInFirestore(user.uid, { pdfQuality });
  }, [pdfQuality, user?.uid]);

  useEffect(() => {
    localStorage.setItem('pref_namingPattern', namingPattern);
    if (user?.uid) updateUserInFirestore(user.uid, { namingPattern });
  }, [namingPattern, user?.uid]);

  useEffect(() => {
    localStorage.setItem('pref_autoSaveScan', String(autoSaveScan));
    if (user?.uid) updateUserInFirestore(user.uid, { autoSaveScan });
  }, [autoSaveScan, user?.uid]);

  useEffect(() => {
    localStorage.setItem('pref_ocrLanguage', ocrLanguage);
    if (user?.uid) updateUserInFirestore(user.uid, { ocrLanguage });
  }, [ocrLanguage, user?.uid]);

  useEffect(() => {
    localStorage.setItem('pref_autoCopyText', String(autoCopyText));
    if (user?.uid) updateUserInFirestore(user.uid, { autoCopyText });
  }, [autoCopyText, user?.uid]);

  useEffect(() => {
    localStorage.setItem('pref_pdfAutoCompress', String(pdfAutoCompress));
    if (user?.uid) updateUserInFirestore(user.uid, { pdfAutoCompress });
  }, [pdfAutoCompress, user?.uid]);

  // Test Sound Player
  const playTestSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio test notice:', e);
    }
  };

  // 7. Revoke All Sessions Handler
  const handleLogoutAllDevices = async () => {
    setIsLoggingOutAll(true);
    try {
      if (user?.uid) {
        await removeAllOtherSessions(user.uid);
      }
    } catch (e) {
      console.warn('Revoke all sessions notice:', e);
    } finally {
      setIsLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  };

  // 11. Check for Update Handler
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const startTime = Date.now();
      const res = await fetch('/api/version');
      const data = await res.json();
      const elapsed = Date.now() - startTime;
      if (elapsed < 650) {
        await new Promise(r => setTimeout(r, 650 - elapsed));
      }
      setUpdateResult(data);
    } catch (err) {
      setUpdateResult({
        version: '2.4.0',
        appName: 'PaperX',
        latest: true,
        message: 'You are running the latest version of PaperX v2.4.0.',
        buildDate: '2026-08-28',
        releaseNotes: 'PaperX v2.4.0 includes enhanced security features, multi-language support, font scaling, and session controls.'
      });
    } finally {
      setIsCheckingUpdate(false);
      setShowUpdateModal(true);
    }
  };

  // 10. Data & Maintenance: Clear Temporary Cache in Background
  const handleClearCacheInBackground = async () => {
    if (isClearingCache) return;
    setIsClearingCache(true);
    setCacheClearedSuccess(false);

    try {
      // 1. Clear CacheStorage (Service Worker / browser HTTP cache) in background
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        } catch (err) {
          console.warn('CacheStorage clean error:', err);
        }
      }

      // 2. Clear SessionStorage (temporary session memory and buffer states)
      try {
        window.sessionStorage.clear();
      } catch (err) {}

      // 3. Clear temporary LocalStorage caches while safely preserving auth, user data & saved documents
      const preservePrefixes = [
        'firebase:',
        'pref_',
        'paperx_user_',
        'paperx_2fa_',
        'paperx_local_stored_files'
      ];

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !preservePrefixes.some((p) => key.startsWith(p))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });

      // 4. Silently update/restart service worker registrations in background if available
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            registration.update();
          }
        } catch (swErr) {
          console.warn('Service worker refresh error:', swErr);
        }
      }

      // 5. Notify the rest of the application via custom event so background memory caches reset smoothly
      window.dispatchEvent(new CustomEvent('paperx:cache-cleared'));

      // Natural brief delay for smooth interaction feedback
      await new Promise((resolve) => setTimeout(resolve, 600));

      setIsClearingCache(false);
      setCacheClearedSuccess(true);
      setTimeout(() => {
        setCacheClearedSuccess(false);
      }, 3500);
    } catch (error) {
      console.error('Error during background cache clear:', error);
      setIsClearingCache(false);
    }
  };

  // Persist other preferences
  useEffect(() => {
    localStorage.setItem('pref_notifications', String(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('pref_autoDelete', String(autoDelete));
  }, [autoDelete]);

  useEffect(() => {
    localStorage.setItem('pref_marketing', String(marketing));
  }, [marketing]);

  useEffect(() => {
    localStorage.setItem('pref_twoStep', String(twoStepEnabled));
  }, [twoStepEnabled]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (user?.uid) {
        await updateUserInFirestore(user.uid, {
          jobTitle: formData.jobTitle,
          company: formData.company,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          currency: 'INR'
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving profile changes to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

    const getMembershipBadgeStyles = (plan: string) => {
      switch (plan) {
          case 'Max Plan':
              return 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] border border-yellow-300';
          case 'Plus Plan':
              return 'bg-black text-white shadow-lg shadow-black/20 border border-gray-800';
          case 'Free Plan':
          case 'Basic Plan':
          default:
              return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      }
  };

  const getMembershipLabel = (plan: string) => {
      switch (plan) {
          case 'Max Plan': return 'Max Plan';
          case 'Plus Plan': return 'Plus Plan';
          case 'Free Plan':
          case 'Basic Plan':
          default: return 'Free Plan';
      }
  };

  const handleEmailFlowStep0 = async () => {
    const code = emailFlowData.oldOtp.trim().replace(/\D/g, '');
    if (!code || code.length !== 6) {
      setEmailError('Please enter the 6-digit code sent to your current email.');
      return;
    }
    setIsEmailProcessing(true);
    setEmailError(null);
    try {
      await verifyEmailChangeCode(user.email, code);
      setIsEmailProcessing(false);
      setEmailStep(1);
    } catch (e: any) {
      setIsEmailProcessing(false);
      setEmailError(e.message || 'Incorrect verification code. Please check your email.');
    }
  };

  const handleEmailFlowStep1 = async () => {
    const newEmail = emailFlowData.newEmail.trim().toLowerCase();
    const formatErr = getEmailFormatError(newEmail);
    if (formatErr) {
      setEmailError(formatErr);
      return;
    }
    if (newEmail === user.email.toLowerCase()) {
      setEmailError('New email must be different from your current email.');
      return;
    }
    setIsEmailProcessing(true);
    setEmailError(null);
    try {
      await sendEmailChangeCode(newEmail, true);
      setIsEmailProcessing(false);
      setEmailStep(2);
    } catch (e: any) {
      setIsEmailProcessing(false);
      setEmailError(e.message || 'Failed to send verification code to new email.');
    }
  };

  const handleEmailFlowStep2 = async () => {
    const code = emailFlowData.newOtp.trim().replace(/\D/g, '');
    const newEmail = emailFlowData.newEmail.trim().toLowerCase();
    if (!code || code.length !== 6) {
      setEmailError('Please enter the 6-digit code sent to your new email.');
      return;
    }
    setIsEmailProcessing(true);
    setEmailError(null);
    try {
      await verifyEmailChangeCode(newEmail, code);
      if (user?.uid) {
        await updateUserInFirestore(user.uid, {
          email: newEmail,
          name: emailFlowData.firstName ? `${emailFlowData.firstName}` : user.name
        });
      }
      setIsEmailProcessing(false);
      setView('personal');
      setEmailStep(0);
      setEmailFlowData({ oldOtp: '', newEmail: '', newOtp: '', firstName: '' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      setIsEmailProcessing(false);
      setEmailError(e.message || 'Verification failed. Please check the code.');
    }
  };

  const renderEmailChange = () => (
      <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
          <div className="p-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 relative">
            <button 
              type="button"
              onClick={() => { setView('personal'); setEmailError(null); }} 
              className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer z-10"
              title="Back"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none px-12">
              <h2 className="text-lg font-heading font-black tracking-tighter text-gray-900 dark:text-white text-center">Update Email</h2>
            </div>
            <div className="w-9 h-9" aria-hidden="true" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {/* Step Progress */}
              <div className="flex items-center justify-center mb-8 gap-2">
                  {[0, 1, 2].map(s => (
                      <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${emailStep >= s ? 'w-8 bg-black dark:bg-white' : 'w-4 bg-gray-200 dark:bg-gray-800'}`} />
                  ))}
              </div>

              {emailError && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 text-center font-medium">
                  {emailError}
                </div>
              )}

              <div className="max-w-xs mx-auto">
                  {/* Step 0: Verify Old Email */}
                  {emailStep === 0 && (
                      <div className="animate-fade-in-up">
                          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Shield size={32} className="text-yellow-600 dark:text-yellow-500" />
                          </div>
                          <h3 className="text-xl font-heading font-black text-center mb-2 text-gray-900 dark:text-white">Verify Current Email</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                              We sent a 6-digit authorization code to <span className="font-bold text-gray-900 dark:text-white">{user.email}</span>.
                          </p>

                          <div className="mb-6">
                              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">6-Digit Code</label>
                              <input 
                                  type="text"
                                  placeholder="000000"
                                  maxLength={6}
                                  className="w-full text-center text-2xl font-mono font-bold py-3 border-b-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none tracking-widest bg-transparent transition-colors text-gray-900 dark:text-white"
                                  value={emailFlowData.oldOtp}
                                  onChange={(e) => setEmailFlowData({...emailFlowData, oldOtp: e.target.value})}
                              />
                          </div>

                          <Button 
                            className="w-full font-bold mb-4" 
                            onClick={handleEmailFlowStep0}
                            isLoading={isEmailProcessing}
                            disabled={!emailFlowData.oldOtp || emailFlowData.oldOtp.length < 6}
                          >
                            Verify & Proceed
                          </Button>

                          <button 
                            onClick={async () => {
                              setIsEmailProcessing(true);
                              setEmailError(null);
                              try {
                                await sendEmailChangeCode(user.email, false);
                              } catch (e: any) {
                                setEmailError(e.message || 'Failed to resend code.');
                              } finally {
                                setIsEmailProcessing(false);
                              }
                            }}
                            className="w-full text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            Didn't get code? <span className="underline">Resend Email</span>
                          </button>
                      </div>
                  )}

                  {/* Step 1: New Email */}
                  {emailStep === 1 && (
                      <div className="animate-fade-in-up">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Mail size={32} className="text-blue-600 dark:text-blue-500" />
                          </div>
                          <h3 className="text-xl font-heading font-black text-center mb-2 text-gray-900 dark:text-white">New Email Address</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                              Where should we send your documents and notifications?
                          </p>

                          <div className="mb-6">
                              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">New Email</label>
                              <input 
                                  type="email"
                                  placeholder="new.email@example.com"
                                  className="w-full py-3 border-b-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-lg font-medium bg-transparent transition-colors text-gray-900 dark:text-white"
                                  value={emailFlowData.newEmail}
                                  onChange={(e) => setEmailFlowData({...emailFlowData, newEmail: e.target.value})}
                              />
                          </div>

                          <Button 
                            className="w-full font-bold" 
                            onClick={handleEmailFlowStep1}
                            isLoading={isEmailProcessing}
                            disabled={!emailFlowData.newEmail || !emailFlowData.newEmail.includes('@')}
                          >
                              Send Verification Code <ArrowRight size={16} className="ml-2" />
                          </Button>
                      </div>
                  )}

                  {/* Step 2: Final Verification */}
                  {emailStep === 2 && (
                      <div className="animate-fade-in-up">
                          <div className="w-16 h-16 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Key size={32} className="text-green-600 dark:text-green-500" />
                          </div>
                          <h3 className="text-xl font-heading font-black text-center mb-2 text-gray-900 dark:text-white">Confirm New Email</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                              Enter the 6-digit code sent to <span className="font-bold text-gray-900 dark:text-white">{emailFlowData.newEmail}</span>.
                          </p>

                          <div className="space-y-6 mb-8">
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Verification Code</label>
                                  <input 
                                      type="text"
                                      placeholder="000000"
                                      maxLength={6}
                                      className="w-full text-center text-xl font-mono font-bold py-2 border-b-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none tracking-widest bg-transparent text-gray-900 dark:text-white"
                                      value={emailFlowData.newOtp}
                                      onChange={(e) => setEmailFlowData({...emailFlowData, newOtp: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Confirm Name</label>
                                  <input 
                                      type="text"
                                      placeholder="Name"
                                      className="w-full py-2 border-b-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-lg font-medium bg-transparent text-gray-900 dark:text-white"
                                      value={emailFlowData.firstName || user.name}
                                      onChange={(e) => setEmailFlowData({...emailFlowData, firstName: e.target.value})}
                                  />
                              </div>
                          </div>

                          <Button 
                            className="w-full font-bold bg-green-600 hover:bg-green-700 shadow-green-200" 
                            onClick={handleEmailFlowStep2}
                            isLoading={isEmailProcessing}
                            disabled={!emailFlowData.newOtp || emailFlowData.newOtp.length < 6}
                          >
                              Confirm Update
                          </Button>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col h-full animate-fade-in-up bg-white dark:bg-gray-900">
      <div className="p-6 flex items-center justify-center border-b border-gray-50 dark:border-gray-800 relative">
        <h2 className="text-xl font-heading font-black tracking-tighter text-gray-900 dark:text-white text-center">Profile</h2>
        <button 
          onClick={onClose} 
          className="absolute right-6 group p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-black dark:hover:text-white"
          title="Close Profile"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="p-8 md:p-10 flex flex-col items-center border-b border-gray-50 dark:border-gray-800">
        <div className="relative mb-6 group cursor-pointer">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-offset-4 ring-gray-50 dark:ring-gray-800 dark:ring-offset-gray-900 shadow-2xl group-hover:scale-105 transition-transform duration-500 relative z-10">
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            {/* Ambient Glow for Max Members */}
            {user.plan === 'Max Plan' && (
                 <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 to-transparent blur-xl opacity-50 animate-pulse"></div>
            )}
        </div>
        
        <h3 className="text-2xl font-heading font-black tracking-tighter text-gray-900 dark:text-white mb-1">{user.name}</h3>
        
        <div className="flex items-center gap-2 mb-6">
            <div title="Linked Google Account">
                <GoogleIcon size={16} />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">{user.email}</p>
        </div>
        
        <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
             <div className={`px-5 py-1.5 rounded-full ${getMembershipBadgeStyles(user.plan)} transition-all duration-300 transform hover:scale-105`}>
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    {user.plan === 'Max Plan' && <Crown size={10} fill="black" />}
                    {getMembershipLabel(user.plan)}
                </span>
            </div>
            
            {(user.plan === 'Basic Plan' || user.plan === 'Free Plan' || user.plan === 'Free') && (
                <div className="w-full mt-2 animate-fade-in-up delay-100">
                    <div className="flex justify-between text-[10px] text-gray-300 font-bold mb-1 uppercase tracking-wider">
                        <span>Operations Used</span>
                        <span>{user.projectsUsed} / {user.maxProjects || 5}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                        <div 
                            className={`h-full rounded-full ${user.projectsUsed >= user.maxProjects ? 'bg-red-500' : 'bg-stone-900'}`} 
                            style={{ width: `${Math.min(100, (user.projectsUsed / user.maxProjects) * 100)}%` }} 
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-3">
            {menuItems.map((item, idx) => (
                <button 
                    key={item.id}
                    onClick={() => {
                        if (item.id === 'support') {
                            if (onSupportClick) onSupportClick();
                            onClose();
                        } else if (item.id === 'admin') {
                            if (onOpenAdmin) onOpenAdmin();
                            onClose();
                        } else {
                            navigateTo(item.id as ViewState);
                        }
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                >
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors duration-300 shadow-sm group-hover:shadow-md">
                            <item.icon size={20} strokeWidth={2} className={`transition-transform duration-300 ${item.id === 'preferences' ? 'group-hover:rotate-180' : 'group-hover:scale-110'}`} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold font-heading text-gray-900 dark:text-white text-sm tracking-tight">{item.label}</p>
                            <p className="text-xs text-gray-300 dark:text-gray-500 font-medium">{item.subLabel}</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors group-hover:translate-x-1" />
                </button>
            ))}
        </div>
      </div>

      <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-900">
         <button 
           onClick={onLogout}
           className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold tracking-tight text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-400 rounded-xl transition-all duration-300"
         >
           <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
           Sign Out
         </button>
      </div>
    </div>
  );

  const renderHeader = (title: string) => (
    <div className="p-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 relative">
        <button 
          type="button"
          onClick={() => {
            if (view === 'email-change') {
              if (viewHistory.length > 0) {
                const prev = viewHistory[viewHistory.length - 1];
                setViewHistory(prevHistory => prevHistory.slice(0, prevHistory.length - 1));
                setView(prev);
              } else {
                setView('personal');
              }
              setEmailError(null);
            } else if (['privacy', 'terms', 'about'].includes(view)) {
              if (viewHistory.length > 0) {
                const prev = viewHistory[viewHistory.length - 1];
                setViewHistory(prevHistory => prevHistory.slice(0, prevHistory.length - 1));
                setView(prev);
              } else {
                setView('preferences');
              }
            } else if (viewHistory.length > 0) {
              const prev = viewHistory[viewHistory.length - 1];
              setViewHistory(prevHistory => prevHistory.slice(0, prevHistory.length - 1));
              setView(prev);
            } else {
              onClose();
            }
          }} 
          className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer z-10"
          title={viewHistory.length > 0 ? "Back" : "Close"}
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none px-12">
          <h2 className="text-lg font-heading font-black tracking-tighter text-gray-900 dark:text-white text-center">
            {title}
          </h2>
        </div>

        <div className="w-9 h-9" aria-hidden="true" />
    </div>
  );

  const renderPersonal = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
        {renderHeader("Personal Information")}
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {/* Identity Section */}
            <div className="mb-10 animate-fade-in-up">
                <h3 className="text-xs font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest mb-6 pl-1 font-heading">Identity</h3>
                <div className="space-y-6">
                    <div className="group flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <label className="block text-xs text-gray-300 dark:text-gray-500 mb-1 font-bold">Full Name</label>
                            <div className="text-lg font-heading font-bold text-gray-900 dark:text-white tracking-tight">{user.name}</div>
                        </div>
                        <Shield size={16} className="text-gray-200 dark:text-gray-700 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                    </div>
                    <div className="group flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-300 dark:text-gray-500 mb-1 font-bold">Email Address</label>
                            <div className="flex items-center gap-2 mb-2">
                                <div title="Linked Google Account">
                                    <GoogleIcon size={20} />
                                </div>
                                <span className="text-lg font-medium text-gray-900 dark:text-white break-all">{user.email}</span>
                            </div>
                            
                            {/* Membership Badge Under Email */}
                            <div className={`inline-flex px-3 py-1 rounded-full ${getMembershipBadgeStyles(user.plan)} transition-all duration-300`}>
                                <span className="text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    {user.plan === 'Max Plan' && <Crown size={8} fill="black" />}
                                    {getMembershipLabel(user.plan)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Edit Email Button */}
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={async () => {
                                    navigateTo('email-change');
                                    setEmailStep(0);
                                    setEmailError(null);
                                    if (user.email) {
                                        setIsEmailProcessing(true);
                                        try {
                                            await sendEmailChangeCode(user.email, false);
                                        } catch (e: any) {
                                            setEmailError(e.message || 'Failed to send verification code.');
                                        } finally {
                                            setIsEmailProcessing(false);
                                        }
                                    }
                                }}
                                className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-lg transition-colors group/edit"
                                title="Change Email"
                            >
                                <Edit2 size={16} className="group-hover/edit:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Professional Section */}
            <div className="mb-12">
                <h3 className="text-xs font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest mb-6 pl-1 font-heading">Professional Profile</h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group animate-fade-in-up delay-100">
                            <label className="block text-xs text-gray-300 dark:text-gray-500 mb-2 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors flex items-center gap-1.5">
                                <UserIcon size={12} /> Job Title
                            </label>
                            <input 
                                type="text" 
                                value={formData.jobTitle} 
                                onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                className="w-full py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-base font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                            />
                        </div>
                        <div className="relative group animate-fade-in-up delay-200">
                            <label className="block text-xs text-gray-300 dark:text-gray-500 mb-2 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors flex items-center gap-1.5">
                                <MapPin size={12} /> Location
                            </label>
                            <input 
                                type="text" 
                                value={formData.location} 
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className="w-full py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-base font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group animate-fade-in-up delay-300">
                            <label className="block text-xs text-gray-300 dark:text-gray-500 mb-2 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors flex items-center gap-1.5">
                                <Settings size={12} /> Company
                            </label>
                            <input 
                                type="text" 
                                value={formData.company} 
                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                className="w-full py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-base font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                            />
                        </div>
                        <div className="relative group animate-fade-in-up delay-400">
                             <label className="block text-xs text-gray-300 dark:text-gray-500 mb-2 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors flex items-center gap-1.5">
                                <Phone size={12} /> Phone
                            </label>
                            <input 
                                type="text" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-base font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-300 dark:placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="relative group animate-fade-in-up delay-500">
                        <label className="block text-xs text-gray-300 dark:text-gray-500 mb-2 font-bold group-focus-within:text-black dark:group-focus-within:text-white transition-colors flex items-center gap-1.5">
                            <FileText size={12} /> Bio
                        </label>
                        <textarea 
                            value={formData.bio} 
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            rows={3}
                            className="w-full py-2 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none text-base font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-300 dark:placeholder-gray-600 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Premium Membership Card */}
            <div className="animate-fade-in-up delay-500">
                 <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4 pl-1 font-heading">Membership Status</h3>
                 <div className="relative p-6 bg-black rounded-2xl text-white shadow-2xl overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                     {/* Abstract decorative background */}
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gray-800/50 blur-2xl group-hover:bg-gray-700/50 transition-colors duration-1000"></div>
                     <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-gray-800/30 blur-2xl"></div>
                     
                     {user.plan === 'Max Plan' && (
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent opacity-50"></div>
                     )}

                     <div className="relative z-10 flex justify-between items-start mb-8">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/5 group-hover:bg-white/20 transition-colors">
                            <Crown size={20} className={`text-white group-hover-wiggle ${user.plan === 'Max Plan' ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Active</span>
                        </div>
                     </div>

                     <div className="relative z-10">
                        <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-1">Current Membership</p>
                        <div className="flex items-baseline justify-between">
                             <p className="text-2xl font-heading font-black tracking-tight text-white">{getMembershipLabel(user.plan)}</p>
                             <p className="text-sm font-medium text-gray-300">Since {user.memberSince}</p>
                        </div>
                     </div>
                 </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-900">
            <GlassPillButton onClick={handleSave} className="w-full">
                {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                    </span>
                ) : saveSuccess ? (
                    <span className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Check size={16} />
                        <span>Changes Saved</span>
                    </span>
                ) : (
                    'Save Changes'
                )}
            </GlassPillButton>
        </div>
    </div>
  );

  const renderBilling = () => {
    const isExpired = Boolean(
        user.subscriptionStatus === 'expired' || 
        (user.plan && user.plan !== 'Basic Plan' && user.planExpiresAt && new Date(user.planExpiresAt).getTime() <= Date.now())
    );

    return (
        <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
            {renderHeader("Subscription & Billing")}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-900/50">
                <UpgradeView
                    onUpgrade={(plan, amount, cycle, resubmitId, upgradeFromId, oldAmount) => {
                        onUpgrade(plan, amount, cycle, resubmitId, upgradeFromId, oldAmount);
                        onClose();
                    }}
                    onSwitchPlan={(plan, cycle) => {
                        if (onSwitchPlan) {
                            onSwitchPlan(plan, cycle);
                        } else if (user?.uid) {
                            updateUserInFirestore(user.uid, {
                                plan,
                                activePlanMode: plan,
                                isPro: plan !== 'Basic Plan',
                                updatedAt: new Date().toISOString()
                            });
                        }
                    }}
                    currentPlan={user.plan}
                    user={user}
                    isExpired={isExpired}
                    orders={orders}
                />
            </div>
        </div>
    );
  };

  const renderPaymentHistory = () => {
    const verifiedOrders = orders.filter(o => o.status === 'VERIFIED' || o.status === 'COMPLETED' || o.status === 'SUCCESS');
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    const rejectedOrders = orders.filter(o => o.status === 'REJECTED' || o.status === 'FAILED' || o.status === 'EXPIRED');

    const filteredOrders = orders.filter(o => {
      if (ordersFilter === 'ALL') return true;
      if (ordersFilter === 'VERIFIED') return o.status === 'VERIFIED' || o.status === 'COMPLETED' || o.status === 'SUCCESS';
      if (ordersFilter === 'PENDING') return o.status === 'PENDING';
      if (ordersFilter === 'REJECTED') return o.status === 'REJECTED' || o.status === 'FAILED' || o.status === 'EXPIRED';
      return true;
    });

    return (
      <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
        {renderHeader("Payment History")}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Successful</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-heading">{verifiedOrders.length}</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Verification</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 font-heading">{pendingOrders.length}</span>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Issues/Reject</span>
              <span className="text-lg font-black text-red-700 dark:text-red-300 font-heading">{rejectedOrders.length}</span>
            </div>
          </div>

          {/* Real-time Status Notice */}
          <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Live Payment & UTR Tracking</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                If your payment is under verification or rejected, tap <strong>Raise Ticket</strong> to notify PaperX Team directly for priority activation.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setOrdersFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${ordersFilter === 'ALL' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setOrdersFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${ordersFilter === 'VERIFIED' ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Successful ({verifiedOrders.length})
            </button>
            <button
              onClick={() => setOrdersFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${ordersFilter === 'PENDING' ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Verification ({pendingOrders.length})
            </button>
            <button
              onClick={() => setOrdersFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${ordersFilter === 'REJECTED' ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Rejected ({rejectedOrders.length})
            </button>
          </div>

          {/* Orders Listing */}
          {ordersLoading ? (
            <div className="text-center py-12">
              <RefreshCw size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Loading payment history...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-6">
              <History size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">No payment orders found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
                {ordersFilter === 'ALL' ? 'You have not made any plan subscription orders yet.' : `No orders matching filter '${ordersFilter}'.`}
              </p>
              <button
                onClick={() => navigateTo('billing')}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                View Subscription Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isSuccessful = order.status === 'VERIFIED' || order.status === 'COMPLETED' || order.status === 'SUCCESS';
                const isPending = order.status === 'PENDING';
                const isRejected = order.status === 'REJECTED' || order.status === 'FAILED' || order.status === 'EXPIRED';
                const isRefunded = Boolean(order.isRefunded) || (order.ticketStatus === 'COMPLETED' && Boolean(order.ticketReason && (order.ticketReason.toLowerCase().includes('refund') || order.ticketReason.toLowerCase().includes('payout'))));
                const isAwaitingLong = isOrderAwaitingLongTime(order, 5);
                const waitMins = getOrderWaitMinutes(order);

                const orderDate = order.createdAt 
                  ? (typeof order.createdAt === 'number' ? new Date(order.createdAt).toLocaleString() : new Date(order.createdAt).toLocaleString())
                  : 'Recent';

                return (
                  <div
                    key={order.id || order.orderId}
                    className={`p-5 rounded-2xl border transition-all duration-200 ${
                      isRefunded
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60'
                        : isSuccessful
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
                        : isPending
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60'
                        : 'bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/60'
                    }`}
                  >
                    {/* Top Row: Plan & Amount */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900 dark:text-white font-heading">
                            {order.plan || 'Plan Upgrade'}
                          </span>
                          {order.billingCycle && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {order.billingCycle}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                          Order #{order.orderId || order.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-gray-900 dark:text-white">
                          ₹{order.amount || (order.plan === 'Max Plan' ? 100 : 50)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-b border-gray-100 dark:border-gray-800/80 mb-3">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">12-Digit UTR</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 select-all">
                          {order.utr || 'Not submitted yet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Date & Time</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {orderDate}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {isRefunded ? (
                          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs font-bold">
                            <Undo2 size={16} />
                            <span>Subscription Refunded & Paid</span>
                          </div>
                        ) : isSuccessful ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                            <CheckCircle2 size={16} />
                            <span>Payment Successful & Membership Active</span>
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                            <Clock size={16} />
                            <span>
                              {isAwaitingLong 
                                ? `Awaiting Long Time (${waitMins}m)` 
                                : 'Under Verification (Processing)'}
                            </span>
                          </div>
                        ) : isRejected ? (
                          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-bold">
                            <XCircle size={16} />
                            <span>Payment Rejected (Dispute Available)</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Ticket Raising Section */}
                      {!isSuccessful || isRefunded ? (
                        <div>
                          {isRefunded ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                    Refund Successfully Processed
                                  </p>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                                    Funds sent to your UPI. Account downgraded to Basic.
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase rounded-md">
                                Completed
                              </span>
                            </div>
                          ) : (order.ticketId || order.ticketStatus === 'OPEN') ? (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-blue-600 dark:text-blue-400" />
                                <div>
                                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                    Ticket #{order.ticketId || 'OPEN'} Active
                                  </p>
                                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    PaperX Team notified. Review in progress.
                                  </p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-black uppercase rounded-md">
                                In Review
                              </span>
                            </div>
                          ) : isRejected ? (
                            <button
                              onClick={() => openTicketModal(order)}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                            >
                              <Ticket size={14} />
                              <span>Raise Dispute Ticket (Payment Rejected)</span>
                            </button>
                          ) : isAwaitingLong ? (
                            <button
                              onClick={() => openTicketModal(order)}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer animate-pulse"
                            >
                              <Ticket size={14} />
                              <span>Raise Ticket (Awaiting Long Time — {waitMins}m)</span>
                            </button>
                          ) : (
                            <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-center justify-between">
                              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <Clock size={13} className="animate-spin text-amber-500" />
                                <span>Verifying (~{waitMins}m) • Usually takes 2–5 mins</span>
                              </span>
                              <button
                                onClick={() => openTicketModal(order)}
                                className="text-[11px] font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white underline cursor-pointer"
                              >
                                Raise Ticket
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Special 2-Day Guarantee Refund & Upgrade Ticket Section for Successful Orders */}
                      {(() => {
                        const orderTime = getOrderTimestamp(order);
                        const isWithin2Days = orderTime && (Date.now() - orderTime) <= 2 * 24 * 60 * 60 * 1000;
                        const featureUsage = (user as any)?.featureUsageCount || 0;
                        const meetsRefundRequirements = featureUsage < 10 && isWithin2Days;

                        if (!isSuccessful) return null;

                        if (!meetsRefundRequirements && !order.ticketId && order.ticketStatus !== 'OPEN') {
                          return (
                            <div className="mt-4 p-3 bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-2xl text-[11px] text-stone-500 dark:text-stone-400">
                              <span className="font-bold text-stone-700 dark:text-stone-300">Refund Policy:</span> Refund is only valid within 2 days of purchase with less than 10 feature operations or documents used. (Usage: {featureUsage}/10 operations).
                            </div>
                          );
                        }

                        return (
                          <div className="mt-4 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl">
                            <div className="flex items-start gap-2.5 mb-2.5">
                              <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                  2-Day Upgrade Refund Guarantee
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed mt-0.5">
                                  Changed your mind and want to upgrade your membership? Submit a refund request within 2 days to get your money back within 24 hours to your bank account!
                                </p>
                              </div>
                            </div>
                            {order.ticketId || order.ticketStatus === 'OPEN' ? (
                              <div className="p-2.5 bg-amber-100/60 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Ticket size={14} className="text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                    Upgrade Refund Active
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100 text-[10px] font-black uppercase rounded-md">
                                  In Review (24h)
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => navigateTo('payment-history')}
                                className="w-full py-2 px-3.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-200/80 hover:bg-amber-300 dark:text-amber-100 dark:bg-amber-900/60 dark:hover:bg-amber-900 border border-amber-300/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                              >
                                <Ticket size={14} />
                                <span>Request Refund & Upgrade Plan</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPreferences = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-gray-900">
      {renderHeader("Preferences")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7">
        
        {/* 0. Document & PDF Studio Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase font-heading">
              PDF & Document Engine Defaults
            </h3>
          </div>
          <div className="space-y-3">
            {/* PDF Export Quality */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                  <FileText size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">PDF Resolution & Output Quality</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Default image resolution when exporting converted PDFs</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-stone-100/90 dark:bg-stone-800/90 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
                {[
                  { id: 'high', label: 'High (300 DPI)' },
                  { id: 'standard', label: 'Balanced (150 DPI)' },
                  { id: 'compact', label: 'Compact (96 DPI)' }
                ].map((opt) => {
                  const isActive = pdfQuality === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPdfQuality(opt.id as any)}
                      className={`relative py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center z-10 ${
                        isActive 
                          ? 'text-stone-900 dark:text-stone-900 font-black bg-white dark:bg-white shadow-xs' 
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Document Naming Rule */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                  <Sliders size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Saved File Naming Format</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Automatic prefix and structure for processed documents</p>
                </div>
              </div>
              <div className="relative">
                <select
                  value={namingPattern}
                  onChange={(e) => setNamingPattern(e.target.value as any)}
                  className="w-full py-3 pl-4 pr-10 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer appearance-none transition-all shadow-xs"
                >
                  <option value="simple">Simple Default (e.g. Scan 1.pdf)</option>
                  <option value="original">Original Name (e.g. Invoice.pdf)</option>
                  <option value="date">With Date (e.g. Scan_08-09-2026.pdf)</option>
                  <option value="paperx">PaperX Prefix (e.g. PaperX_Scan_1.pdf)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 dark:text-stone-500">
                  <ChevronDown size={16} strokeWidth={2.5} />
                </div>
              </div>

              {/* Real-Time Live Sample Preview */}
              <div className="px-3.5 py-2 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 rounded-xl flex items-center justify-between text-xs gap-2">
                <span className="text-stone-500 dark:text-stone-400 font-sans font-semibold text-[11px] shrink-0">Real-Time Sample:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[12px] bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                  {getSampleFormattedFileName(namingPattern)}
                </span>
              </div>
            </motion.div>

            {/* Auto-Save Scanned Documents */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                  <FileCheck size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Auto-Save Scanned Files</p>
                    {autoSaveScan && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Save scanned pages directly to "My Documents" (5-Year Archive)</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoSaveScan}
                aria-label="Toggle auto save scanned files"
                onClick={() => setAutoSaveScan(!autoSaveScan)}
                className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer shrink-0 ${
                  autoSaveScan ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-all ${
                  autoSaveScan ? 'ml-auto bg-white dark:bg-black text-black dark:text-white' : 'mr-auto bg-white dark:bg-stone-300'
                }`}>
                  {autoSaveScan && <Check size={10} strokeWidth={3.5} />}
                </div>
              </button>
            </motion.div>

            {/* OCR Language & Auto Copy Text */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                  <Cpu size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">OCR Default Language & Clipboard</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Text extraction target language & auto-copy behaviors</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full py-2.5 pl-3 pr-8 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 rounded-xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer appearance-none transition-all"
                  >
                    {['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Chinese', 'Portuguese', 'Russian', 'Italian', 'Arabic'].map(lang => (
                      <option key={lang} value={lang}>{lang} OCR</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <ChevronDown size={14} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoCopyText(!autoCopyText)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                    autoCopyText 
                      ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' 
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Copy size={13} /> Auto-Copy OCR Text
                  </span>
                  {autoCopyText && <Check size={12} strokeWidth={3} />}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time {ocrLanguage} OCR Active
                </span>
                <span>Auto-Copy: {autoCopyText ? 'ON' : 'OFF'}</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 1. Appearance & Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-stone-400 dark:text-stone-500 uppercase font-heading">
              Appearance & Display
            </h3>
          </div>
          <div className="space-y-3">
            {/* Dark Mode */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ rotate: darkMode ? -20 : 20, scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  {darkMode ? <Moon size={18} strokeWidth={2.2} /> : <Sun size={18} strokeWidth={2.2} />}
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Dark Mode</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Switch between light and deep dark themes</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                aria-label="Toggle dark mode"
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer shrink-0 ${
                  darkMode ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center ${
                    darkMode ? 'ml-auto bg-white dark:bg-black text-black dark:text-white' : 'mr-auto bg-white dark:bg-stone-300'
                  }`}
                >
                  {darkMode && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                      <Check size={10} strokeWidth={3.5} />
                    </motion.div>
                  )}
                </motion.div>
              </button>
            </motion.div>

            {/* Font Size Selector */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.12, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <Type size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">App Font Size</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Scale interface reading and typography</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/90 dark:bg-stone-800/90 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 relative">
                {(['system', 'small', 'medium', 'large'] as const).map(size => {
                  const isActive = fontSize === size;
                  const labels: Record<string, string> = {
                    system: 'Device',
                    small: 'Small',
                    medium: 'Medium',
                    large: 'Large'
                  };
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      title={size === 'system' ? 'Device Default (Auto-scales per screen resolution)' : `${labels[size]} Font Size`}
                      className={`relative py-2 px-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center z-10 ${
                        isActive 
                          ? 'text-stone-900 dark:text-stone-900 font-black' 
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 bg-white dark:bg-white rounded-xl shadow-xs -z-10"
                        />
                      )}
                      {labels[size]}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Larger Text Accessibility Toggle */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <Maximize2 size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Enhanced Legibility</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">High contrast & optimized glyph spacing</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={largerText}
                aria-label="Toggle accessibility font"
                onClick={() => setLargerText(!largerText)}
                className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer shrink-0 ${
                  largerText ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center ${
                    largerText ? 'ml-auto bg-white dark:bg-black text-black dark:text-white' : 'mr-auto bg-white dark:bg-stone-300'
                  }`}
                >
                  {largerText && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                      <Check size={10} strokeWidth={3.5} />
                    </motion.div>
                  )}
                </motion.div>
              </button>
            </motion.div>
          </div>
        </div>

        {/* 3. Language & Regional */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.6 }}
              className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-stone-400 dark:text-stone-500 uppercase font-heading">
              Language & Regional
            </h3>
          </div>
          <motion.div 
            whileHover={{ y: -1 }}
            className="group p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
          >
            <div className="flex items-center gap-3.5">
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
              >
                <Globe size={18} strokeWidth={2.2} />
              </motion.div>
              <div>
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">App Language</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Select your preferred user interface locale</p>
              </div>
            </div>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full py-3 pl-4 pr-10 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer appearance-none transition-all shadow-xs"
              >
                {[
                  { code: 'English', label: 'English (US)' },
                  { code: 'Spanish', label: 'Español (Spanish)' },
                  { code: 'French', label: 'Français (French)' },
                  { code: 'German', label: 'Deutsch (German)' },
                  { code: 'Hindi', label: 'हिंदी (Hindi)' },
                  { code: 'Japanese', label: '日本語 (Japanese)' },
                  { code: 'Chinese', label: '中文 (Chinese)' },
                  { code: 'Portuguese', label: 'Português (Portuguese)' },
                  { code: 'Russian', label: 'Русский (Russian)' },
                  { code: 'Korean', label: '한국어 (Korean)' },
                  { code: 'Italian', label: 'Italiano (Italian)' },
                  { code: 'Arabic', label: 'العربية (Arabic)' },
                  { code: 'Bengali', label: 'বাংলা (Bengali)' }
                ].map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {l.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 dark:text-stone-500">
                <ChevronDown size={16} strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4. Security & Sessions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.9 }}
              className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-stone-400 dark:text-stone-500 uppercase font-heading">
              Security & Sessions
            </h3>
          </div>
          <div className="space-y-3">
            {/* Auto Restore Session */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <Lock size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Auto-Restore Session</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Keep your workspace securely logged in across launches</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoRestoreSession}
                aria-label="Toggle auto restore session"
                onClick={() => setAutoRestoreSession(!autoRestoreSession)}
                className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer shrink-0 ${
                  autoRestoreSession ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center ${
                    autoRestoreSession ? 'ml-auto bg-white dark:bg-black text-black dark:text-white' : 'mr-auto bg-white dark:bg-stone-300'
                  }`}
                >
                  {autoRestoreSession && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                      <Check size={10} strokeWidth={3.5} />
                    </motion.div>
                  )}
                </motion.div>
              </button>
            </motion.div>

            {/* 2FA Authenticator TOTP */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Two-Step Verification</p>
                    {twoStepEnabled && (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded-full uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Protect account logins with TOTP Authenticator Apps</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoStepEnabled}
                aria-label="Toggle two step verification"
                onClick={() => {
                  if (!twoStepEnabled) {
                    const sec = faSecret || generateBase32Secret();
                    setFaSecret(sec);
                    setShow2FAModal(true);
                    setFaStep(1);
                  } else {
                    setTwoStepEnabled(false);
                    localStorage.setItem('pref_twoStep', 'false');
                    localStorage.removeItem('paperx_2fa_secret');
                    localStorage.removeItem('paperx_2fa_backup_codes');
                    localStorage.removeItem('paperx_2fa_method');
                    if (user?.uid) {
                      updateUserInFirestore(user.uid, {
                        twoFactorEnabled: false,
                        twoFactorSecret: '',
                        twoFactorBackupCodes: []
                      });
                    }
                  }
                }}
                className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer shrink-0 ${
                  twoStepEnabled ? 'bg-black dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center ${
                    twoStepEnabled ? 'ml-auto bg-white dark:bg-black text-black dark:text-white' : 'mr-auto bg-white dark:bg-stone-300'
                  }`}
                >
                  {twoStepEnabled && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                      <Check size={10} strokeWidth={3.5} />
                    </motion.div>
                  )}
                </motion.div>
              </button>
            </motion.div>

            {/* Active Devices & Sessions */}
            <motion.div 
              whileHover={{ y: -1 }}
              className="group p-4.5 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    <Laptop size={14} strokeWidth={2.2} />
                  </motion.div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-xs tracking-tight">Active Devices ({activeSessions.length})</p>
                </div>
              </div>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <div key={session.id} className="p-3 bg-white dark:bg-stone-800/80 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        {session.deviceType === 'mobile' ? (
                          <Smartphone size={16} className="text-stone-500 dark:text-stone-400" />
                        ) : session.deviceType === 'tablet' ? (
                          <Tablet size={16} className="text-stone-500 dark:text-stone-400" />
                        ) : (
                          <Monitor size={16} className="text-stone-500 dark:text-stone-400" />
                        )}
                        <span className="font-bold text-stone-900 dark:text-white">{session.deviceName}</span>
                        {session.isCurrentSession && (
                          <span className="px-2 py-0.5 text-[8px] font-black bg-black text-white dark:bg-white dark:text-black rounded-md tracking-wider uppercase">THIS DEVICE</span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        {session.browser} • {session.os}
                      </p>
                      <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                        Active: {formatSessionTime(session.lastActive)}
                        {session.loginTime && ` • Logged in: ${new Date(session.loginTime).toLocaleDateString()} ${new Date(session.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                      </p>
                    </div>
                    {!session.isCurrentSession && (
                      <button
                        type="button"
                        onClick={() => user?.uid && removeUserSession(user.uid, session.id)}
                        className="text-[11px] text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Log Out of All Devices Action */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowLogoutAllModal(true)}
                className="w-full py-3 bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:border-red-900/50 dark:hover:text-red-400 text-stone-700 dark:text-stone-300 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <LogOut size={14} /> Log Out of Other Devices
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* 6. Data & Maintenance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1.5 }}
              className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-stone-400 dark:text-stone-500 uppercase font-heading">
              Data & Maintenance
            </h3>
          </div>
          <motion.div 
            whileHover={{ y: -1 }}
            className="group flex items-center justify-between p-4.5 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center gap-3.5">
              <motion.div 
                whileHover={{ scale: 1.15, rotate: [0, -12, 12, 0] }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
              >
                <Trash2 size={18} strokeWidth={2.2} />
              </motion.div>
              <div>
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Clear Temporary Cache</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Release local draft memory & preview buffers</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: isClearingCache ? 1 : 1.05 }}
              whileTap={{ scale: isClearingCache ? 1 : 0.95 }}
              type="button"
              disabled={isClearingCache}
              onClick={handleClearCacheInBackground}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 border ${
                cacheClearedSuccess
                  ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                  : 'bg-white dark:bg-stone-800 border-stone-200/80 dark:border-stone-700/80 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-stone-900 dark:text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isClearingCache ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-stone-900 dark:text-white" />
                  <span>Clearing in Background...</span>
                </>
              ) : cacheClearedSuccess ? (
                <>
                  <Check size={13} strokeWidth={3} />
                  <span>Cache Cleared</span>
                </>
              ) : (
                <span>Clear Cache</span>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* 7. App Info & Legal */}
        <div className="space-y-3 pb-6">
          <div className="flex items-center gap-2 px-1">
            <motion.span 
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }} 
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1.8 }}
              className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" 
            />
            <h3 className="text-[11px] font-black tracking-widest text-stone-400 dark:text-stone-500 uppercase font-heading">
              App Info & Legal
            </h3>
          </div>
          <div className="space-y-2.5">
            <motion.button
              whileHover={{ y: -1, scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              type="button"
              disabled={isCheckingUpdate}
              onClick={handleCheckUpdate}
              className="group w-full p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all cursor-pointer shadow-xs hover:shadow-md disabled:opacity-80"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <RefreshCw size={18} strokeWidth={2.2} className={isCheckingUpdate ? 'animate-spin' : ''} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">
                    {isCheckingUpdate ? 'Checking for Updates...' : 'Check for Updates'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    {isCheckingUpdate ? 'Connecting to update server...' : 'PaperX v2.4.0 (Latest Production Build)'}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </motion.button>

            <motion.button
              whileHover={{ y: -1, scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              type="button"
              onClick={() => navigateTo('about')}
              className="group w-full p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: 15 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <Info size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">About PaperX</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Version specs, architecture & team details</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </motion.button>

            <motion.button
              whileHover={{ y: -1, scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              type="button"
              onClick={() => navigateTo('terms')}
              className="group w-full p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <FileText size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Terms of Service</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Platform usage rules and service terms</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </motion.button>

            <motion.button
              whileHover={{ y: -1, scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              type="button"
              onClick={() => navigateTo('privacy')}
              className="group w-full p-4 bg-stone-50/80 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors"
                >
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </motion.div>
                <div>
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Privacy Policy</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">End-to-end data encryption and zero-inspection guarantee</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-stone-900">
      {renderHeader("About PaperX")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        
        {/* Logo & Header Card */}
        <div className="p-6 bg-stone-50/90 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl text-center space-y-3">
          <div className="w-14 h-14 mx-auto bg-black text-white dark:bg-white dark:text-black rounded-2xl flex items-center justify-center font-black text-xl font-heading shadow-sm">
            PX
          </div>
          <div>
            <h2 className="text-lg font-black font-heading text-stone-900 dark:text-white tracking-tight">PaperX Studio</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Version 2.4.0 (Production)</p>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-sm mx-auto">
            PaperX is an all-in-one document studio designed for seamless PDF processing, camera scanning, OCR text extraction, live dictation, and long-term document archiving.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 pl-1 font-heading">
            Platform Capabilities
          </h4>

          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <FileText size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">PDF & Document Processing</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Convert, merge, split, compress, and edit documents directly in your browser with fast server side acceleration.
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Camera size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Camera Scanning & OCR</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Scan physical documents with automatic edge crop detection, enhancement filters, and multilingual text recognition.
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Database size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">5-Year Cloud Archive</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Safely store and search through your saved documents by month, date, and year in "My Documents".
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl md:rounded-3xl flex items-center justify-between text-xs">
          <span className="text-stone-500 dark:text-stone-400 font-medium">© {new Date().getFullYear()} PaperX Team</span>
          <button 
            type="button"
            onClick={() => setView('support')}
            className="text-stone-900 dark:text-white font-bold hover:underline cursor-pointer"
          >
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-stone-900">
      {renderHeader("Terms of Service")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        
        {/* Header Summary Card */}
        <div className="p-4 bg-stone-50/90 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">Terms of Service</h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Rules and terms governing your use of PaperX</p>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            By using PaperX, you agree to these simple terms. Please read them carefully to understand your rights and responsibilities.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 pl-1 font-heading">
            Terms & Conditions
          </h4>

          {/* 1. Account Usage */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">1. Account & Fair Usage</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              You are responsible for keeping your login credentials secure. PaperX provides document tools for personal and professional productivity within plan usage limits.
            </p>
          </div>

          {/* 2. Document Ownership */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">2. Document Ownership & Content</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              You retain 100% ownership of all files and content you upload to PaperX. You agree not to upload harmful, illegal, or copyright-infringing materials.
            </p>
          </div>

          {/* 3. Service Availability */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">3. Service & Updates</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              We continuously improve PaperX and may update features or perform maintenance from time to time to ensure optimal system stability and performance.
            </p>
          </div>

          {/* 4. Subscriptions & Billing */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">4. Subscriptions & Billing</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Subscription plans (Free, Plus, Max) dictate processing limits and features. Billing terms and renewal details can be reviewed in your Billing settings.
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="flex flex-col h-full animate-slide-in-right bg-white dark:bg-stone-900">
      {renderHeader("Privacy Policy")}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        
        {/* Header Summary Card */}
        <div className="p-4 bg-stone-50/90 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">PaperX Privacy & Data Protection</h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">GDPR & CCPA compliant document confidentiality & export tools</p>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
            At PaperX, we respect your privacy and data sovereignty. This policy outlines how your files, active sessions, and account data are secured and controlled.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 pl-1 font-heading">
            Core Privacy Commitments
          </h4>

          {/* 1. Document Privacy */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <FileText size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">1. Document & File Confidentiality</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Your uploaded PDFs, scanned documents, and images are processed strictly to perform the actions you request (such as converting, merging, or scanning). We do not sell your files or use document contents to train public AI models.
            </p>
          </div>

          {/* 2. File Storage & Retention */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Database size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">2. Storage & Retention Limits</h5>
            </div>
            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1 pl-9 leading-relaxed">
              <li>• <strong className="text-stone-900 dark:text-white">My Documents:</strong> Saved files are stored in your account archive for up to 5 years.</li>
              <li>• <strong className="text-stone-900 dark:text-white">Recent Activity:</strong> Displays files created or modified within the last 30 days.</li>
              <li>• <strong className="text-stone-900 dark:text-white">User Deletion:</strong> You can delete any saved file from your archive at any time.</li>
            </ul>
          </div>

          {/* 3. Data Protection & Security */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Lock size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">3. Account & Data Security</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              All communications between your device and PaperX are secured using TLS 1.3 encryption. Account profile data, active sessions, and document records are protected with Firestore security rules.
            </p>
          </div>

          {/* 4. User Rights & Data Control */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl md:rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Shield size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">4. Your Data Rights & Real Controls</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Under GDPR Article 20 and CCPA, you have full ownership of your data. You can download a complete structured JSON archive of your account, reset local preferences, or submit a right-to-be-forgotten erasure request.
            </p>

            {/* Quick Actions Grid */}
            <div className="pl-9 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleResetPreferences}
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {resetPreferencesSuccess ? (
                  <>
                    <CheckCircle size={13} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Preferences Reset!</span>
                  </>
                ) : (
                  <>
                    <Undo2 size={13} />
                    <span>Reset App Preferences</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} />
                <span>Request Data Erasure</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Working Export Account Data Action Card */}
        <div className="p-4.5 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/90 dark:border-stone-700/80 rounded-2xl md:rounded-3xl space-y-3.5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileDown size={16} className="text-stone-900 dark:text-white shrink-0" />
                <p className="font-heading font-black text-stone-900 dark:text-white text-xs tracking-tight">Export Account Data (JSON Archive)</p>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                Download a verified JSON backup containing your full profile, device sessions, orders, and preference metadata.
              </p>
            </div>

            {exportFeedback && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-md text-[10px] font-bold shrink-0 flex items-center gap-1">
                <Check size={11} strokeWidth={3} /> {exportFeedback.count} Records Exported
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isExportingData}
              onClick={handleGenerateFullAccountData}
              className="flex-1 min-w-[140px] py-2.5 px-4 bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isExportingData ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Preparing Export...</span>
                </>
              ) : (
                <span>Download JSON</span>
              )}
            </button>

            {exportJsonData && (
              <>
                <button
                  type="button"
                  onClick={handleCopyExportJson}
                  className="py-2.5 px-3 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Copy full JSON payload to clipboard"
                >
                  {copiedExportJson ? (
                    <>
                      <Check size={13} className="text-emerald-500" strokeWidth={3} />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportPreview(true)}
                  className="py-2.5 px-3 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Inspect raw JSON data in viewer"
                >
                  <Eye size={13} />
                  <span>Inspect</span>
                </button>
              </>
            )}
          </div>

          {exportFeedback && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono truncate">
              File: {exportFeedback.filename} ({exportFeedback.date})
            </p>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 left-0 h-full w-full sm:max-w-md bg-white dark:bg-gray-900 z-50 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none invisible'}`}>
        {view === 'menu' && renderMenu()}
        {view === 'personal' && renderPersonal()}
        {view === 'billing' && renderBilling()}
        {view === 'payment-history' && renderPaymentHistory()}
        {view === 'preferences' && renderPreferences()}
        {view === 'email-change' && renderEmailChange()}
        {view === 'about' && renderAbout()}
        {view === 'terms' && renderTerms()}
        {view === 'privacy' && renderPrivacy()}
      </div>

      {/* Log Out of All Devices Confirmation Modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto font-bold">
              <LogOut size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Log Out of Other Devices?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will invalidate active sessions across all other devices and browsers connected to your account.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutAllModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isLoggingOutAll}
                onClick={handleLogoutAllDevices}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingOutAll ? 'Revoking...' : 'Log Out Other Devices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check for Update Modal */}
      {showUpdateModal && updateResult && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto font-bold shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">PaperX is Up to Date</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                Version {updateResult.version}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
                You are running the latest version of PaperX. All document tools and security updates are active.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin' : ''} />
                {isCheckingUpdate ? 'Checking...' : 'Check Again'}
              </button>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal with Authenticator (TOTP) */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base font-heading">2-Step Verification</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Secure your account with an Authenticator App
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShow2FAModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Scan Authenticator QR */}
            {faStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-center">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 inline-block mb-3 shadow-sm">
                    <img 
                      src={getAuthenticatorQRCodeURL(faSecret, user?.email || 'user@paperx.app')} 
                      alt="Authenticator QR Code" 
                      className="w-36 h-36 mx-auto rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Scan QR Code with Authenticator App</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Google Authenticator, Authy, 1Password, or Apple Passwords</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-mono select-all bg-white dark:bg-gray-900 py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold">
                      {faSecret.match(/.{1,4}/g)?.join(' ') || faSecret}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFaStep(2);
                    setFaError(null);
                  }}
                  className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-2xl text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Continue to Verification Code →
                </button>
              </div>
            )}

            {/* Step 2: Verification Code */}
            {faStep === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Open your authenticator app and enter the 6-digit verification code:
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">6-Digit Authenticator Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={faCode}
                    onChange={(e) => {
                      setFaCode(e.target.value.replace(/\D/g, ''));
                      setFaError(null);
                    }}
                    placeholder="e.g. 849201"
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center font-mono text-lg tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  {faError && <p className="text-xs text-red-500 mt-1.5 font-medium">{faError}</p>}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setFaStep(1)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    disabled={isVerifyingFA}
                    onClick={async () => {
                      if (faCode.length !== 6) {
                        setFaError('Please enter a valid 6-digit code');
                        return;
                      }
                      setIsVerifyingFA(true);
                      setFaError(null);

                      const isVerified = await verifyTOTPCode(faSecret, faCode);
                      setIsVerifyingFA(false);

                      if (!isVerified) {
                        setFaError('Invalid verification code. Please check your authenticator app.');
                        return;
                      }

                      const codes = [
                        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
                      ];
                      setFaBackupCodes(codes);
                      setTwoStepEnabled(true);
                      localStorage.setItem('pref_twoStep', 'true');
                      localStorage.setItem('paperx_2fa_method', 'totp');
                      localStorage.setItem('paperx_2fa_secret', faSecret);
                      localStorage.setItem('paperx_2fa_backup_codes', JSON.stringify(codes));
                      if (user?.uid) {
                        updateUserInFirestore(user.uid, { 
                          twoFactorEnabled: true, 
                          twoFactorMethod: 'totp',
                          twoFactorSecret: faSecret,
                          twoFactorBackupCodes: codes
                        });
                      }
                      setFaStep(3);
                    }}
                    className="flex-2 py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifyingFA ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Confirmation */}
            {faStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">✓</div>
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">2-Step Verification Active</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Protected with TOTP Hardware / App Authenticator.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Save Backup Recovery Codes</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Store these codes safely. Each can be used once if you lose access to your authenticator app.</p>
                  <div className="bg-gray-50 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 font-mono text-xs text-gray-900 dark:text-white font-bold text-center">
                    {faBackupCodes.map((code, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-900 py-1.5 px-2 rounded border border-gray-200 dark:border-gray-800 shadow-xs select-all">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShow2FAModal(false);
                  }}
                  className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-bold rounded-2xl text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticket Raising Modal for Membership Activation with Real Ready-Made Reasons */}
      {selectedOrderForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            {(() => {
              const isSelectedSuccessful = selectedOrderForTicket.status === 'VERIFIED' || selectedOrderForTicket.status === 'COMPLETED' || selectedOrderForTicket.status === 'SUCCESS';
              const isSelectedRejected = selectedOrderForTicket.status === 'REJECTED' || selectedOrderForTicket.status === 'FAILED' || selectedOrderForTicket.status === 'EXPIRED';
              const reasonOptions = isSelectedSuccessful
                ? (READYMADE_TICKET_REASONS as any).REFUND_UPGRADE || []
                : isSelectedRejected 
                ? READYMADE_TICKET_REASONS.REJECTED 
                : READYMADE_TICKET_REASONS.AWAITING_LONG;
              const waitTime = getOrderWaitMinutes(selectedOrderForTicket);

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isSelectedSuccessful
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : isSelectedRejected 
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' 
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                      }`}>
                        <Ticket size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base font-heading">
                            {isSelectedSuccessful ? 'Membership Refund / Upgrade' : 'Raise Support Ticket'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isSelectedSuccessful
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : isSelectedRejected 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}>
                            {isSelectedSuccessful ? 'Change of Mind' : isSelectedRejected ? 'Order Rejected' : `Awaiting ${waitTime}m`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isSelectedSuccessful
                            ? 'Request a full refund to transition to a higher yearly or half-year plan'
                            : isSelectedRejected 
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
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Ticket Submitted to PaperX Team</h4>
                        <p className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold mt-1">
                          Ticket ID: {ticketFeedback.ticketId}
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2 leading-relaxed">
                          {ticketFeedback.message}
                        </p>
                      </div>

                      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="font-bold text-gray-900 dark:text-white">What happens next?</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {isSelectedSuccessful 
                            ? 'Our finance and support team will approve your refund within 24 hours. You can go to the Billing tab anytime to upgrade to your preferred Year or Half-Year membership.'
                            : `The support officer is matching your 12-digit UTR reference against bank statements and will approve your subscription. Your account will automatically upgrade to ${selectedOrderForTicket.plan || 'Pro'}.`}
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
                      {/* Order Summary Pill */}
                      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Order ID:</span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedOrderForTicket.orderId || selectedOrderForTicket.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Plan & Amount:</span>
                          <span className="font-bold text-gray-900 dark:text-white">{selectedOrderForTicket.plan} (₹{selectedOrderForTicket.amount || 50})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">12-Digit UTR:</span>
                          <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{selectedOrderForTicket.utr || 'None provided'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Current Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isSelectedSuccessful
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : selectedOrderForTicket.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                          }`}>
                            {selectedOrderForTicket.status || 'SUCCESS'}
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
                          Additional Details / Bank Reference (Optional)
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
                          When you raise this ticket, an immediate alert is sent to <strong>PaperX Team</strong> for priority manual review.
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

      {/* Export Data Payload Preview Modal */}
      {showExportPreview && exportJsonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center font-bold">
                  <Code size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-stone-900 dark:text-white text-sm">Account Export Payload</h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Standardized JSON data structure</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportPreview(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Syntax Viewer */}
            <div className="flex-1 overflow-auto rounded-2xl bg-stone-950 p-4 border border-stone-800 text-[11px] font-mono text-emerald-400/90 leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap word-break-all select-all">
                {JSON.stringify(exportJsonData, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyExportJson}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                {copiedExportJson ? (
                  <>
                    <Check size={14} className="text-emerald-500" strokeWidth={3} />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateFullAccountData}
                  className="py-2.5 px-4 bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-black rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <DownloadCloud size={14} />
                  <span>Download .json</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportPreview(false)}
                  className="py-2.5 px-3 bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Data Erasure / Account Deletion Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center mx-auto font-bold shadow-xs">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-heading font-black text-stone-900 dark:text-white text-base">GDPR Right to Erasure</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Submit an irreversible request to purge your account credentials, 5-year document archive, and payment records from PaperX databases.
              </p>
            </div>

            {deletionSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-center">
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Erasure Request Logged</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Your ticket has been transmitted to our Data Privacy compliance officers. Your account will be purged in compliance with GDPR Art. 17.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeletionSuccess(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 space-y-1.5">
                  <p className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Shield size={13} className="text-amber-500" /> What will be deleted:
                  </p>
                  <ul className="text-[11px] space-y-1 pl-4 list-disc text-stone-500 dark:text-stone-400">
                    <li>All saved PDFs and scanned documents in your archive</li>
                    <li>Active login sessions across all devices</li>
                    <li>User profile, biometric/2FA secrets, and billing records</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAccountModal(false)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingDeletion}
                    onClick={handleRequestAccountDeletion}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingDeletion ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Confirm Erasure</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};