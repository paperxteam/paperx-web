import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, Settings, CreditCard, LogOut, ChevronRight, ChevronLeft, MapPin, Phone, FileText, Crown, Shield, ShieldCheck, Bell, Trash2, Smartphone, Moon, Sun, Zap, Check, Edit2, AlertTriangle, Key, Mail, ArrowRight, Lock, LifeBuoy, Globe, ChevronDown, CheckCircle2, History, Clock, Calendar, AlertCircle, Type, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, RefreshCw, Info, Laptop, ExternalLink, Database, Sparkles, Layers, Ticket, XCircle, Camera, Cpu, Copy, FileCheck, Sliders, Printer, DownloadCloud, Activity, Wifi, Tablet, Monitor, Code, Eye, FileDown, CheckCircle, Undo2, Mic, Layout, Cookie, ShieldAlert, Fingerprint, UserCheck } from 'lucide-react';
import { User, UserSession, getUserPurchasedTier, isBillingCycleCovered, BILLING_CYCLE_LABELS, BillingCycleType, READYMADE_TICKET_REASONS, isOrderAwaitingLongTime, getOrderWaitMinutes, getOrderTimestamp, ReadyMadeTicketReason, getPlanCreditValue } from '../types';
import { Button } from './Button';
import { GlassPillButton } from './GlassPillButton';
import { db, auth, updateUserInFirestore, sendEmailChangeCode, verifyEmailChangeCode, isValidEmail, getEmailFormatError, subscribeToUserSessions, removeUserSession, removeAllOtherSessions, generateTotpSecretForEnrollment, enrollTotpFactor, unenrollTotpFactor, getDeviceInfoSync, getDeviceId, recordUserSession } from '../services/firebase';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { generateBase32Secret, verifyTOTPCode, getAuthenticatorQRCodeURL } from '../services/totpService';
import { getTranslation, useAppTranslation, normalizeLanguage } from '../translations';
import { LanguageSelector } from './LanguageSelector';
import { getSampleFormattedFileName } from '../lib/namingUtils';
import { UpgradeView } from './UpgradeView';
import { PreferencesView } from './PreferencesView';
import { AnimatedDeviceIcon } from './AnimatedDeviceIcon';
import { safeStorage } from '../src/utils/safeStorage';
import { PAPERX_LOGO_BASE64 } from '../src/assets/logo-data';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: (destination?: string) => void;
  onUpgrade: (plan: 'Pro Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void;
  onSwitchPlan?: (plan: 'Basic Plan' | 'Pro Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
  initialTab?: 'menu' | 'personal' | 'billing' | 'payment-history' | 'preferences' | 'about' | 'terms' | 'privacy';
  onSupportClick?: () => void;
  onOpenAdmin?: () => void;
  inline?: boolean;
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

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose, user: propUser, onLogout, onUpgrade, onSwitchPlan, initialTab = 'menu', onSupportClick, onOpenAdmin, inline }) => {
  const user: User = propUser || {
    uid: 'guest',
    id: 'guest',
    name: 'PaperX User',
    email: 'guest@paperx.app',
    avatarUrl: '',
    plan: 'Basic Plan',
    projectsUsed: 0,
    maxProjects: 5,
    memberSince: 'Today',
    subscriptionStatus: 'free',
    isPro: false,
    darkMode: false,
    theme: 'system'
  } as unknown as User;
  const [view, setView] = useState<ViewState>(initialTab);
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);

  const navigateTo = (targetView: ViewState) => {
    if (targetView !== view) {
      setViewHistory(prev => [...prev, view]);
      setView(targetView);
    }
  };

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

  // Sync state with props during render phase to avoid a 1-frame visual flash or sudden mid-transition view jumps
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  if (isOpen !== prevIsOpen || initialTab !== prevInitialTab) {
    setPrevIsOpen(isOpen);
    setPrevInitialTab(initialTab);
    if (isOpen) {
      setView(initialTab);
      setEmailStep(0);
      setEmailFlowData({ oldOtp: '', newEmail: '', newOtp: '', firstName: '' });
    }
  }

  // Preference States with safeStorage
  const [notifications, setNotifications] = useState(() => safeStorage.getItem('pref_notifications') !== 'false');
  const [autoDelete, setAutoDelete] = useState(() => safeStorage.getItem('pref_autoDelete') === 'true');
  const [marketing, setMarketing] = useState(() => safeStorage.getItem('pref_marketing') === 'true');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = safeStorage.getItem('pref_darkMode');
    if (saved !== null) return saved === 'true';
    if (user?.theme) return user.theme === 'dark';
    if (user?.darkMode !== undefined) return user.darkMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loginAlerts, setLoginAlerts] = useState(() => user?.loginAlertsEnabled || false);

  // 1. Font Size State
  const [fontSize, setFontSize] = useState<'system' | 'small' | 'medium' | 'large'>(() => {
    const saved = safeStorage.getItem('pref_fontSize') as 'system' | 'small' | 'medium' | 'large' | null;
    if (saved) return saved;
    if (user?.fontSize) return user.fontSize as 'system' | 'small' | 'medium' | 'large';
    return 'system';
  });

  // 3. Notification Sound State
  const [soundEffects, setSoundEffects] = useState<boolean>(() => {
    const saved = safeStorage.getItem('pref_sound');
    if (saved !== null) return saved !== 'false';
    if (user?.notificationSoundEnabled !== undefined) return user.notificationSoundEnabled;
    return true;
  });

  // 4. Language State & Reactive Translations
  const { t, currentLanguage, changeLanguage } = useAppTranslation();

  // 8. Larger Text Accessibility State
  const [largerText, setLargerText] = useState<boolean>(() => {
    const saved = safeStorage.getItem('pref_largerText');
    if (saved !== null) return saved === 'true';
    if (user?.largerTextEnabled !== undefined) return user.largerTextEnabled;
    return false;
  });

  // 9. Auto Restore Session State
  const [autoRestoreSession, setAutoRestoreSession] = useState<boolean>(() => {
    if (user?.autoRestoreSession !== undefined) return user.autoRestoreSession;
    return safeStorage.getItem('pref_autoRestoreSession') !== 'false';
  });

  // 10. Document & PDF Studio Preferences (Real Working Settings for PaperX)
  const [pdfQuality, setPdfQuality] = useState<'high' | 'standard' | 'compact'>(() => {
    return user?.pdfQuality || (safeStorage.getItem('pref_pdfQuality') as 'high' | 'standard' | 'compact') || 'high';
  });

  const [namingPattern, setNamingPattern] = useState<'simple' | 'original' | 'date' | 'paperx' | string>(() => {
    const rawPattern = user?.namingPattern || safeStorage.getItem('pref_namingPattern') || 'simple';
    return rawPattern === 'paperx_date' ? 'paperx' : rawPattern;
  });

  const [autoSaveScan, setAutoSaveScan] = useState<boolean>(() => {
    if (user?.autoSaveScan !== undefined) return user.autoSaveScan;
    return safeStorage.getItem('pref_autoSaveScan') !== 'false';
  });

  const [ocrLanguage, setOcrLanguage] = useState<string>(() => {
    return user?.ocrLanguage || safeStorage.getItem('pref_ocrLanguage') || 'English';
  });

  const [autoCopyText, setAutoCopyText] = useState<boolean>(() => {
    if (user?.autoCopyText !== undefined) return user.autoCopyText;
    return safeStorage.getItem('pref_autoCopyText') !== 'false';
  });

  const [pdfAutoCompress, setPdfAutoCompress] = useState<boolean>(() => {
    return safeStorage.getItem('pref_pdfAutoCompress') !== 'false';
  });

  const hasMountedPreferencesRef = useRef(false);
  useEffect(() => {
    hasMountedPreferencesRef.current = true;
  }, []);

  // 6. Trusted Devices / Active Sessions State (Initialized with verified current device)
  const [activeSessions, setActiveSessions] = useState<UserSession[]>(() => {
    const info = getDeviceInfoSync();
    const deviceId = getDeviceId();
    return [{
      id: deviceId,
      userId: user?.uid || '',
      deviceName: info.name,
      deviceType: info.type,
      browser: info.browser,
      os: info.os,
      lastActive: new Date().toISOString(),
      loginTime: new Date().toISOString(),
      isCurrentSession: true
    }];
  });

  useEffect(() => {
    const info = getDeviceInfoSync();
    const deviceId = getDeviceId();
    const currentDeviceFallback: UserSession = {
      id: deviceId,
      userId: user?.uid || '',
      deviceName: info.name,
      deviceType: info.type,
      browser: info.browser,
      os: info.os,
      lastActive: new Date().toISOString(),
      loginTime: new Date().toISOString(),
      isCurrentSession: true
    };

    if (user?.uid) {
      // Clean/reset activeSessions to current fallback device of the NEW user immediately to prevent cross-account leak
      setActiveSessions([currentDeviceFallback]);

      recordUserSession(user.uid).catch(() => {});
      const unsubscribe = subscribeToUserSessions(user.uid, (sessions) => {
        if (sessions && sessions.length > 0) {
          setActiveSessions(sessions);
        }
      });
      return () => unsubscribe();
    } else {
      setActiveSessions([currentDeviceFallback]);
    }
  }, [user?.uid]);

  const [, setTzTicket] = useState(0);

  useEffect(() => {
    const handleTzUpdate = () => {
      setTzTicket(prev => prev + 1);
    };
    window.addEventListener('paperx_timezone_updated', handleTzUpdate);
    return () => window.removeEventListener('paperx_timezone_updated', handleTzUpdate);
  }, []);

  const getSafeTimeZone = (tz?: string | null): string | undefined => {
    if (!tz) return undefined;
    let cleanTz = tz.trim();
    const mapping: { [key: string]: string } = {
      'Calcutta': 'Asia/Kolkata',
      'Kolkata': 'Asia/Kolkata',
      'Bombay': 'Asia/Kolkata',
      'Mumbai': 'Asia/Kolkata',
      'Delhi': 'Asia/Kolkata',
      'New Delhi': 'Asia/Kolkata',
      'Madras': 'Asia/Kolkata',
      'Chennai': 'Asia/Kolkata',
      'India': 'Asia/Kolkata',
      'IST': 'Asia/Kolkata',
      'UTC': 'UTC',
      'GMT': 'UTC',
    };
    if (mapping[cleanTz]) {
      cleanTz = mapping[cleanTz];
    }
    try {
      Intl.DateTimeFormat(undefined, { timeZone: cleanTz });
      return cleanTz;
    } catch {
      return undefined;
    }
  };

  const getFormatOptions = (options: any) => {
    if (typeof window !== 'undefined') {
      const tz = localStorage.getItem('paperx_override_timezone');
      const safeTz = getSafeTimeZone(tz);
      if (safeTz) {
        return { ...options, timeZone: safeTz };
      }
    }
    return options;
  };

  // Format date helpers for real login dates and session times
  const formatLoginDate = (isoString?: string, sessionTimeZone?: string) => {
    if (!isoString) return 'Active session';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Active session';
      
      const rawTz = sessionTimeZone || (typeof window !== 'undefined' ? localStorage.getItem('paperx_override_timezone') : null);
      const targetTz = getSafeTimeZone(rawTz);
      
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetTz,
        timeZoneName: 'short'
      });
    } catch {
      return 'Active session';
    }
  };

  const formatLastActive = (isoString?: string, isCurrent?: boolean, sessionTimeZone?: string) => {
    if (isCurrent) return 'Active now';
    if (!isoString) return 'Recently active';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (isNaN(diffMs)) return 'Recently active';

      // Handle local system clock drift gracefully
      if (diffMs < 0) {
        if (Math.abs(diffMs) < 60000) return isCurrent ? 'Active now' : 'Just now';
        return 'Recently active';
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return isCurrent ? 'Active now' : 'Just now';
      if (diffMins < 3) return isCurrent ? 'Active now' : `${diffMins} min ago`;
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hr ago`;
      
      const rawTz = sessionTimeZone || (typeof window !== 'undefined' ? localStorage.getItem('paperx_override_timezone') : null);
      const targetTz = getSafeTimeZone(rawTz);
      
      if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: targetTz, timeZoneName: 'short' })}`;
      return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: targetTz, timeZoneName: 'short' });
    } catch {
      return 'Recently active';
    }
  };

  const formatSessionTime = (isoString?: string, sessionTimeZone?: string) => {
    return formatLastActive(isoString, false, sessionTimeZone);
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
  const [faVerifyState, setFaVerifyState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [totpEnrollObj, setTotpEnrollObj] = useState<any>(null);

  const handleAutoVerifyProfile2FA = async (code: string) => {
    if (code.length !== 6 || isVerifyingFA) return;
    setIsVerifyingFA(true);
    setFaError(null);
    setFaVerifyState('checking');

    try {
      if (totpEnrollObj) {
        await enrollTotpFactor(totpEnrollObj, code);
      } else {
        const isVerified = await verifyTOTPCode(faSecret, code);
        if (!isVerified) throw new Error('Invalid verification code');
      }

      setFaVerifyState('valid');
      setIsVerifyingFA(false);

      const codes = [
        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        `PX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      ];
      setFaBackupCodes(codes);
      setTwoStepEnabled(true);
      localStorage.setItem('pref_twoStep', 'true');
      if (user?.uid) {
        updateUserInFirestore(user.uid, { 
          twoFactorEnabled: true, 
          twoFactorMethod: 'totp'
        });
      }

      setTimeout(() => {
        setFaStep(3);
        setFaVerifyState('idle');
      }, 650);
    } catch (err: any) {
      setIsVerifyingFA(false);
      setFaVerifyState('invalid');
      setFaError(err?.message || 'Verification error occurred');
      setTimeout(() => {
        setFaCode('');
        setFaVerifyState('idle');
      }, 1200);
    }
  };

  useEffect(() => {
    if (user) {
      setTwoStepEnabled(user.twoFactorEnabled || false);
      setFaSecret(user.twoFactorSecret || '');
      setFaBackupCodes(user.twoFactorBackupCodes || []);
      setLoginAlerts(user.loginAlertsEnabled || false);
      if (user.theme) {
        setDarkMode(user.theme === 'dark');
      }
      if (user.fontSize) {
        setFontSize(user.fontSize as any);
      }
    } else {
      setTwoStepEnabled(false);
      setFaSecret('');
      setFaBackupCodes([]);
      setLoginAlerts(false);
    }
  }, [user]);
  const [defaultFormat, setDefaultFormat] = useState(() => localStorage.getItem('pref_defaultFormat') || 'PDF');
  const [compressionPreset, setCompressionPreset] = useState(() => localStorage.getItem('pref_compression') || 'balanced');
  const [billingCycle, setBillingCycle] = useState<'month' | 'half-year' | 'year'>(
    (user.billingCycle as any) || 'month'
  );
  const [dismissRefundNotice, setDismissRefundNotice] = useState(false);
  
  const isUserAdmin = user?.email?.toLowerCase() === 'paperx.dev@gmail.com' || user?.email?.toLowerCase() === 'paperx.assist@gmail.com' || (user as any)?.role === 'Admin' || (user as any)?.role === 'SuperAdmin';

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
  const [scheduledErasureDateString, setScheduledErasureDateString] = useState<string>('');
  const [cancelErasureSuccess, setCancelErasureSuccess] = useState(false);
  const [resetPreferencesSuccess, setResetPreferencesSuccess] = useState(false);
  const [manualRestoreSuccess, setManualRestoreSuccess] = useState(false);

  const handleGenerateFullAccountData = async (downloadFile = true) => {
    console.log("Export triggered in handleGenerateFullAccountData, downloadFile:", downloadFile);
    if (!user) {
      console.error("No user found for export");
      alert("Error: User session not found. Please log in again.");
      return;
    }
    setIsExportingData(true);
    try {
      console.log("Fetching docs for user:", user.uid || user.id);
      // 1. Fetch real documents from Firestore subcollection if user is logged in
      let realUserDocs: any[] = [];
      const uid = user?.uid || user?.id;
      if (uid) {
        try {
          const docsSnap = await getDocs(collection(db, 'users', uid, 'documents'));
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
        language: currentLanguage,
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
          uid: uid || 'anonymous',
          name: user?.name || 'PaperX User',
          email: user?.email || '',
          phone: formData.phone || user?.phone || '',
          jobTitle: formData.jobTitle || user?.jobTitle || '',
          company: formData.company || user?.company || '',
          location: formData.location || user?.location || '',
          bio: formData.bio || user?.bio || '',
          planName: user?.plan || 'Free Plan',
          purchasedPlan: user?.purchasedPlan || 'None',
          activePlanMode: user?.activePlanMode || 'None',
          planStatus: user?.subscriptionStatus || 'active',
          billingCycle: ((user?.plan as string) === 'Basic Plan' || (user?.plan as string) === 'Free Plan') ? 'N/A' : (user?.billingCycle || 'month'),
          planValidUntil: user?.planExpiresAt || user?.subscriptionEndDate || null,
          twoFactorAuthActive: twoStepEnabled,
          emailVerified: user?.emailVerified ?? true,
          registeredSince: user?.memberSince || '2026-01-01',
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
      setShowExportPreview(true);
      const totalCount = 1 + activeSessions.length + orders.length + (realUserDocs.length || localDocs.length);
      setExportFeedback({ count: totalCount, date: new Date().toLocaleTimeString(), filename });

      // Trigger real JSON file download only if requested
      if (downloadFile) {
        const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Data export error:", err);
      alert("Failed to export data. Please try again or contact support if the issue persists.");
    } finally {
      setIsExportingData(false);
    }
  };

  const handleInspectPayload = async () => {
    console.log("handleInspectPayload clicked, current exportJsonData:", !!exportJsonData);
    if (exportJsonData) {
      setShowExportPreview(true);
      return;
    }
    await handleGenerateFullAccountData(false);
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
      'pref_defaultFormat', 'pref_compression', 'pref_language', 'pref_darkMode'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    setFontSize('system');
    setLargerText(false);
    setPdfQuality('high');
    setNamingPattern('simple');
    setAutoSaveScan(true);
    setOcrLanguage('English');
    setAutoCopyText(false);
    setPdfAutoCompress(true);
    setSoundEffects(true);
    setAutoRestoreSession(true);
    setDefaultFormat('PDF');
    setCompressionPreset('balanced');
    changeLanguage('English');
    setDarkMode(false);
    document.documentElement.setAttribute('data-font-size', 'system');
    document.documentElement.setAttribute('data-larger-text', 'false');
    document.documentElement.classList.remove('dark');
    setResetPreferencesSuccess(true);
    setTimeout(() => setResetPreferencesSuccess(false), 3000);

    if (user?.uid) {
      updateUserInFirestore(user.uid, {
        fontSize: 'system',
        largerTextEnabled: false,
        pdfQuality: 'high',
        namingPattern: 'paperx_date',
        autoSaveScan: true,
        ocrLanguage: 'English',
        autoCopyText: false,
        pdfAutoCompress: true,
        notificationSoundEnabled: true,
        autoRestoreSession: true,
        language: 'English',
        darkMode: false,
        theme: 'light'
      });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed'));
  };

  const handleDetectAndRestoreFullApp = () => {
    const keysToRemove = [
      'pref_fontSize', 'pref_largerText', 'pref_pdfQuality',
      'pref_namingPattern', 'pref_autoSaveScan', 'pref_ocrLanguage',
      'pref_autoCopyText', 'pref_pdfAutoCompress', 'pref_sound',
      'pref_autoRestoreSession', 'pref_defaultFormat', 'pref_compression',
      'pref_language', 'pref_darkMode', 'paperx_current_view_override'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    safeStorage.setItem('paperx_manual_restore_detected', 'true');
    safeStorage.setItem('paperx_full_app_restored_at', new Date().toISOString());

    setFontSize('system');
    setLargerText(false);
    setPdfQuality('high');
    setNamingPattern('simple');
    setAutoSaveScan(true);
    setOcrLanguage('English');
    setAutoCopyText(false);
    setPdfAutoCompress(true);
    setSoundEffects(true);
    setAutoRestoreSession(true);
    setDefaultFormat('PDF');
    setCompressionPreset('balanced');
    changeLanguage('English');
    setDarkMode(false);

    document.documentElement.setAttribute('data-font-size', 'system');
    document.documentElement.setAttribute('data-larger-text', 'false');
    document.documentElement.classList.remove('dark');

    setManualRestoreSuccess(true);
    setResetPreferencesSuccess(true);
    setTimeout(() => {
      setManualRestoreSuccess(false);
      setResetPreferencesSuccess(false);
    }, 4500);

    if (user?.uid) {
      updateUserInFirestore(user.uid, {
        fontSize: 'system',
        largerTextEnabled: false,
        pdfQuality: 'high',
        namingPattern: 'paperx_date',
        autoSaveScan: true,
        ocrLanguage: 'English',
        autoCopyText: false,
        pdfAutoCompress: true,
        notificationSoundEnabled: true,
        autoRestoreSession: true,
        language: 'English',
        darkMode: false,
        theme: 'light',
        manualRestoreAt: new Date().toISOString()
      });
    }

    window.dispatchEvent(new CustomEvent('paperx_manual_restore_detected', { detail: { timestamp: Date.now() } }));
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed'));
  };

  const handleProceedToLogin = async () => {
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.error("Signout error during erasure:", signOutErr);
    }
    setShowDeleteAccountModal(false);
    onLogout('/login');
    onClose();
  };

  const handleCancelErasureRequest = async () => {
    if (!user) return;
    const uid = user?.uid || user?.id;
    if (uid) {
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          dataErasureRequested: false,
          dataErasureScheduledAt: null,
          dataErasureScheduledUntil: null,
          dataErasureCancelledAt: new Date().toISOString()
        }, { merge: true });
        setCancelErasureSuccess(true);
        setTimeout(() => setCancelErasureSuccess(false), 5000);
      } catch (err) {
        console.error("Failed to cancel erasure request:", err);
      }
    }
  };

  const handleRequestAccountDeletion = async () => {
    console.log("Deletion triggered with 10-day grace period...");
    if (!user) {
      console.error("No user found for deletion");
      alert("Error: User session not found. Please log in again.");
      return;
    }
    setIsSubmittingDeletion(true);
    try {
      const uid = user?.uid || user?.id;
      const now = new Date();
      const scheduledDateObj = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const scheduledUntilISO = scheduledDateObj.toISOString();
      const formattedDate = scheduledDateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = scheduledDateObj.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      const fullDisplay = `${formattedDate} at ${formattedTime}`;

      if (uid) {
        console.log("Scheduling 10-day deletion in Firestore for user:", uid);
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
          dataErasureRequested: true,
          dataErasureScheduledAt: now.toISOString(),
          dataErasureScheduledUntil: scheduledUntilISO
        }, { merge: true });

        // Submit official GDPR Right to Erasure ticket/audit log via server
        try {
          await fetch('/api/admin/tickets/raise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: `GDPR-DEL-${Date.now()}`,
              uid: uid,
              userEmail: user?.email || '',
              userName: user?.name || 'PaperX User',
              plan: user?.plan || 'Free Plan',
              amount: 0,
              utr: 'GDPR_ERASURE_REQUEST',
              orderStatus: 'PENDING',
              reason: 'GDPR Article 17 Right to Erasure / 10-Day Grace Period Deletion Request',
              notes: `User ${user?.email || 'unknown'} (${user?.name || 'unknown'}) scheduled account deletion for ${fullDisplay} (10 days). If user logs in before this date, the deletion request is automatically cancelled and all account data restored.`
            })
          });
        } catch (ticketErr) {
          console.warn("Ticket raising failed (non-critical):", ticketErr);
        }
      }

      setScheduledErasureDateString(fullDisplay);
      setDeletionSuccess(true);
      
      // Automatically redirect to login and signup dashboard after 3.5 seconds
      setTimeout(async () => {
        await handleProceedToLogin();
      }, 3500);
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
          const cleanUtr = (ord.utr || '').trim().toLowerCase();
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
          plan: selectedOrderForTicket.plan || 'Pro Plan',
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
    { id: 'personal', label: t('profile.account', 'Personal Information'), subLabel: t('profile.accountDesc', 'Manage your personal details'), icon: UserIcon },
    { id: 'billing', label: t('profile.planBilling', 'Billing & Subscription'), subLabel: t('profile.planBillingDesc', 'Manage your plan and payment'), icon: CreditCard },
    { id: 'preferences', label: t('profile.preferencesTab', 'Preferences'), subLabel: t('profile.preferencesTabDesc', 'Customize your experience'), icon: Settings },
    { id: 'support', label: t('profile.supportTab', 'Support Settings'), subLabel: t('profile.supportTabDesc', 'Help and troubleshooting'), icon: LifeBuoy },
    ...(isUserAdmin && onOpenAdmin ? [{ id: 'admin', label: t('profile.adminTab', 'PaperX Team Console'), subLabel: t('profile.adminTabDesc', 'Manage users, approvals, live queries & AI assist'), icon: Shield }] : [])
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
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeStorage.setItem('pref_darkMode', String(darkMode));
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { darkMode } }));
  }, [darkMode]);

  // 1. Apply Font Size
  useEffect(() => {
    if (document.documentElement.getAttribute('data-font-size') !== fontSize) {
      document.documentElement.setAttribute('data-font-size', fontSize);
    }
    safeStorage.setItem('pref_fontSize', fontSize);
  }, [fontSize]);

  const handleSetFontSize = (size: 'system' | 'small' | 'medium' | 'large') => {
    setFontSize(size);
    safeStorage.setItem('pref_fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { fontSize: size } }));
    if (user?.uid) {
      updateUserInFirestore(user.uid, { fontSize: size });
    }
  };

  // 2. Apply Larger Text Scale (Accessibility)
  useEffect(() => {
    if (document.documentElement.getAttribute('data-larger-text') !== String(largerText)) {
      document.documentElement.setAttribute('data-larger-text', String(largerText));
    }
    safeStorage.setItem('pref_largerText', String(largerText));
  }, [largerText]);

  // 3. Sound Effects Sync
  useEffect(() => {
    safeStorage.setItem('pref_sound', String(soundEffects));
  }, [soundEffects]);

  // 4. Language Sync
  useEffect(() => {
    safeStorage.setItem('pref_language', currentLanguage);
    window.dispatchEvent(new CustomEvent('paperx_language_changed', { detail: currentLanguage }));
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { language: currentLanguage } }));
    if (hasMountedPreferencesRef.current && user?.uid && normalizeLanguage(user.language) !== currentLanguage) {
      updateUserInFirestore(user.uid, { language: currentLanguage });
    }
  }, [currentLanguage]);

  // 9. Auto-Restore Session Sync
  useEffect(() => {
    safeStorage.setItem('pref_autoRestoreSession', String(autoRestoreSession));
    if (hasMountedPreferencesRef.current && user?.uid && user.autoRestoreSession !== autoRestoreSession) {
      updateUserInFirestore(user.uid, { autoRestoreSession });
    }
    try {
      setPersistence(auth, autoRestoreSession ? browserLocalPersistence : browserSessionPersistence);
    } catch (e) {}
  }, [autoRestoreSession]);

  // 10. Document & PDF Studio Preferences Sync
  useEffect(() => {
    safeStorage.setItem('pref_pdfQuality', pdfQuality);
    if (hasMountedPreferencesRef.current && user?.uid && user.pdfQuality !== pdfQuality) {
      updateUserInFirestore(user.uid, { pdfQuality });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { pdfQuality } }));
  }, [pdfQuality]);

  useEffect(() => {
    safeStorage.setItem('pref_namingPattern', namingPattern);
    const normalizedUserPattern = user?.namingPattern === 'paperx_date' ? 'paperx' : user?.namingPattern;
    if (hasMountedPreferencesRef.current && user?.uid && normalizedUserPattern !== namingPattern) {
      const firestorePattern: 'paperx_date' | 'original_processed' | 'timestamp' = 
        namingPattern === 'paperx' ? 'paperx_date' : namingPattern === 'simple' ? 'original_processed' : 'timestamp';
      updateUserInFirestore(user.uid, { namingPattern: firestorePattern });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { namingPattern } }));
  }, [namingPattern]);

  useEffect(() => {
    safeStorage.setItem('pref_autoSaveScan', String(autoSaveScan));
    if (hasMountedPreferencesRef.current && user?.uid && user.autoSaveScan !== autoSaveScan) {
      updateUserInFirestore(user.uid, { autoSaveScan });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { autoSaveScan } }));
  }, [autoSaveScan]);

  useEffect(() => {
    safeStorage.setItem('pref_ocrLanguage', ocrLanguage);
    if (hasMountedPreferencesRef.current && user?.uid && user.ocrLanguage !== ocrLanguage) {
      updateUserInFirestore(user.uid, { ocrLanguage });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { ocrLanguage } }));
  }, [ocrLanguage]);

  useEffect(() => {
    safeStorage.setItem('pref_autoCopyText', String(autoCopyText));
    if (hasMountedPreferencesRef.current && user?.uid && user.autoCopyText !== autoCopyText) {
      updateUserInFirestore(user.uid, { autoCopyText });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { autoCopyText } }));
  }, [autoCopyText]);

  useEffect(() => {
    safeStorage.setItem('pref_pdfAutoCompress', String(pdfAutoCompress));
    const rawUserCompress = (user as any)?.pdfAutoCompress;
    if (hasMountedPreferencesRef.current && user?.uid && rawUserCompress !== pdfAutoCompress) {
      updateUserInFirestore(user.uid, { pdfAutoCompress });
    }
    window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { pdfAutoCompress } }));
  }, [pdfAutoCompress]);

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
    console.log('Starting logout of other devices...');
    setIsLoggingOutAll(true);
    try {
      if (user?.uid) {
        // Wrap the session revocation in a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session revocation timed out')), 30000)
        );
        await Promise.race([removeAllOtherSessions(user.uid), timeoutPromise]);
        console.log('Successfully called removeAllOtherSessions');
      }
    } catch (e) {
      console.error('Revoke all sessions error:', e);
    } finally {
      console.log('Closing modal and resetting state');
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

      // 3. Clear temporary LocalStorage caches while safely preserving auth, user data & settings
      const preservePrefixes = [
        'firebase:',
        'pref_',
        'paperx_',
        'theme',
        'language'
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
              return 'bg-gradient-to-r from-white via-amber-50 to-amber-100 text-amber-900 border border-amber-300 shadow-sm shadow-amber-500/15 dark:from-[#231b0e] dark:via-amber-950/60 dark:to-[#1a140a] dark:text-amber-200 dark:border-amber-400/50';
          case 'Pro Plan':
              return 'bg-gradient-to-r from-white via-purple-50 to-purple-100 text-purple-900 border border-purple-200 shadow-sm shadow-purple-500/10 dark:from-[#1b1528] dark:via-purple-950/60 dark:to-[#171222] dark:text-purple-200 dark:border-purple-500/40';
          case 'Free Plan':
          case 'Basic Plan':
          default:
              return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      }
  };

  const getMembershipLabel = (plan: string) => {
      switch (plan) {
          case 'Max Plan': return 'Max Plan';
          case 'Pro Plan': return 'Pro Plan';
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
      <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
          <div className="p-6 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 bg-transparent relative">
            <button 
              type="button"
              onClick={() => { setView('personal'); setEmailError(null); }} 
              className="group p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-black dark:hover:text-white cursor-pointer z-10"
              title="Back"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none px-12">
              <h2 className="text-xl font-heading font-black tracking-tighter text-gray-900 dark:text-white text-center">Update Email</h2>
            </div>
            <div className="w-9 h-9" aria-hidden="true" />
          </div>

          <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-6 pb-6 md:px-8 md:pb-8">
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
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex items-center justify-center ios-glass-header z-20">
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
                <img 
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'PaperX')}&background=059669&color=fff`} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
            </div>
            {/* Ambient Glow for Max Members */}
            {user.plan === 'Max Plan' && (
                 <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 to-transparent opacity-50"></div>
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
                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center justify-center">
                    {getMembershipLabel(user.plan)}
                </span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 md:px-6 md:pb-6">
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
    <div className="absolute top-0 left-0 w-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between ios-glass-drawer border-b border-black/[0.06] dark:border-white/[0.08] z-20">
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
          className="group p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer z-10"
          title={viewHistory.length > 0 ? "Back" : "Close"}
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none px-10">
          <h2 className="text-sm sm:text-base font-heading font-black tracking-tight text-gray-900 dark:text-white text-center">
            {title}
          </h2>
        </div>

        <div className="w-7 h-7" aria-hidden="true" />
    </div>
  );

  const renderPersonal = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
        {renderHeader("Personal Information")}
        
        <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-6 pb-6 md:px-8 md:pb-8">
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
                                <span className="text-[8px] font-bold uppercase tracking-widest flex items-center justify-center">
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
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors duration-1000"></div>
                     <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-gray-800/30"></div>
                     
                     {user.plan === 'Max Plan' && (
                         <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent opacity-50"></div>
                     )}

                     <div className="relative z-10 flex justify-between items-start mb-8">
                        <div className="p-2 bg-white/10 rounded-lg border border-white/5 group-hover:bg-white/20 transition-colors">
                            <Crown size={20} className={`text-white group-hover-wiggle ${user.plan === 'Max Plan' ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-full border border-white/10 flex items-center gap-1.5">
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
        <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
            {renderHeader("Subscription & Billing")}
            <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 sm:px-6 sm:pb-6 bg-gray-50/50 dark:bg-[#0d1117]/50">
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
      <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
        {renderHeader("Payment History")}
        <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 md:px-6 md:pb-6 space-y-5">
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
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
                                className="w-full py-2 px-3.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-200/80 hover:bg-amber-300 dark:text-amber-100 dark:bg-amber-900/60 dark:hover:bg-amber-900 border border-amber-300/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      {renderHeader("Preferences")}
      <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-6 sm:px-6 sm:pb-8">
        <PreferencesView
          user={user}
          loginAlerts={loginAlerts}
          setLoginAlerts={setLoginAlerts}
          twoStepEnabled={twoStepEnabled}
          setTwoStepEnabled={setTwoStepEnabled}
          autoRestoreSession={autoRestoreSession}
          setAutoRestoreSession={setAutoRestoreSession}
          activeSessions={activeSessions}
          setShowLogoutAllModal={setShowLogoutAllModal}
          removeUserSession={removeUserSession}
          formatLoginDate={formatLoginDate}
          formatLastActive={formatLastActive}
          generateTotpSecretForEnrollment={generateTotpSecretForEnrollment}
          setFaSecret={setFaSecret}
          setTotpEnrollObj={setTotpEnrollObj}
          setShow2FAModal={setShow2FAModal}
          setFaStep={setFaStep}
          generateBase32Secret={generateBase32Secret}
          unenrollTotpFactor={unenrollTotpFactor}
          pdfQuality={pdfQuality}
          setPdfQuality={setPdfQuality}
          namingPattern={namingPattern}
          setNamingPattern={setNamingPattern}
          autoSaveScan={autoSaveScan}
          setAutoSaveScan={setAutoSaveScan}
          pdfAutoCompress={pdfAutoCompress}
          setPdfAutoCompress={setPdfAutoCompress}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          fontSize={fontSize}
          handleSetFontSize={handleSetFontSize}
          largerText={largerText}
          setLargerText={setLargerText}
          isClearingCache={isClearingCache}
          handleClearCacheInBackground={handleClearCacheInBackground}
          cacheClearedSuccess={cacheClearedSuccess}
          handleResetPreferences={handleResetPreferences}
          resetPreferencesSuccess={resetPreferencesSuccess}
          isCheckingUpdate={isCheckingUpdate}
          handleCheckUpdate={handleCheckUpdate}
          navigateTo={navigateTo}
        />
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      {renderHeader("About PaperX")}
      <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
        
        {/* Logo & Header Card */}
        <div className="p-6 bg-stone-50/90 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl text-center space-y-3">
          <div className="my-3 flex items-center justify-center">
            <img 
              src="/user_logo.png" 
              alt="PaperX Logo" 
              className="h-8 sm:h-10 w-auto object-contain mx-auto"
            />
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">Version 2.4.0 (Production)</p>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-sm mx-auto">
            PaperX is an all-in-one document studio designed for seamless PDF processing, camera scanning, OCR text extraction, live dictation, and long-term document archiving.
          </p>
        </div>

        {/* CEO Section */}
        <div className="p-6 bg-stone-50/90 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl text-center space-y-4">
          <img src="/ceo.png" alt="Sayan Biswas - CEO of PaperX" className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-white dark:border-[#30363d] shadow-md" />
          <div>
            <h3 className="text-base font-black font-heading text-stone-900 dark:text-white tracking-tight">Sayan Biswas</h3>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">CEO of PaperX</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 font-medium italic">"Empowering productivity through innovative document solutions."</p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 pl-1 font-heading">
            Platform Capabilities
          </h4>

          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <FileText size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">PDF & Document Processing</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Convert, merge, split, compress, and edit documents directly in your browser with fast server side acceleration.
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Camera size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Camera Scanning & OCR</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Scan physical documents with automatic edge crop detection, enhancement filters, and multilingual text recognition.
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Database size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">5-Year Cloud Archive</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Safely store and search through your saved documents by month, date, and year in "My Documents".
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Tight Security</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Your data is protected with enterprise-grade encryption and secure access controls for ultimate privacy.
            </p>
          </div>

          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-200/80 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center shrink-0">
                <Zap size={14} strokeWidth={2.2} />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Fastest Processing</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Experience lightning-fast document handling and processing powered by optimized server-side performance.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-stone-100/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-[#30363d] rounded-2xl md:rounded-3xl flex items-center justify-between text-xs">
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
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      {renderHeader("Terms of Service")}
      <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
        
        {/* Header Summary Card */}
        <div className="p-4 bg-stone-50/90 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
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
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">1. Account & Fair Usage</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              You are responsible for keeping your login credentials secure. PaperX provides document tools for personal and professional productivity within plan usage limits.
            </p>
          </div>

          {/* 2. Document Ownership */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">2. Document Ownership & Content</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              You retain 100% ownership of all files and content you upload to PaperX. You agree not to upload harmful, illegal, or copyright-infringing materials.
            </p>
          </div>

          {/* 3. Service Availability */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">3. Service & Updates</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              We continuously improve PaperX and may update features or perform maintenance from time to time to ensure optimal system stability and performance.
            </p>
          </div>

          {/* 4. Subscriptions & Billing */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">4. Subscriptions & Billing</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Subscription plans (Free, Pro, Max) dictate processing limits and features. Billing terms and renewal details can be reviewed in your Billing settings.
            </p>
          </div>

          {/* 5. Account Termination & Erasure */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">5. Account Deletion & 10-Day Grace Period</h5>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              When an account data erasure or deletion is requested, an automatic 10-day safety grace period is enforced. If no login occurs within 10 days, your account and all associated documents are permanently and irreversibly deleted. Signing in before the 10 days expire immediately cancels the deletion and restores full access.
            </p>
          </div>
        </div>

      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] relative">
      {renderHeader("Privacy Policy")}
      <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-[80px] px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
        
        {/* Header Summary Card */}
        <div className="p-4 bg-stone-50/90 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden group">
              <ShieldCheck size={18} strokeWidth={2.2} className="text-emerald-400 dark:text-emerald-600 drop-shadow-xs" />
            </div>
            <div>
              <h3 className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight">PaperX Privacy &amp; Data Protection</h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">GDPR &amp; CCPA compliant document confidentiality &amp; export tools</p>
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

          {/* Personal Data We Collect */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Fingerprint size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Personal Data We Collect</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              We collect only the data necessary to provide, protect, and maintain PaperX document intelligence services. We clearly differentiate required operational data from optional user settings:
            </p>

            <div className="pl-9 space-y-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {/* Service Required Data */}
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Required to Provide Service
                </span>
                <ul className="space-y-1 pl-1">
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><UserIcon size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Account Information:</strong> Name, registered email address, and profile identifiers provided during sign-up or login.</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><Key size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Authentication &amp; Security:</strong> Login tokens, password reset verification codes, session timestamps, and device authorization logs.</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><CreditCard size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Subscription &amp; Payment Details:</strong> Selected plan, billing duration, order ID, and UPI reference numbers (UTR/RRN) for payment verification. We do not store credit card numbers or UPI PINs.</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><FileText size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Document Processing Information:</strong> Uploaded PDF files, images, and documents submitted solely to execute your requested actions (e.g. OCR text extraction, document translation, conversion, or compression).</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><Monitor size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Device &amp; Session Data:</strong> Browser type, operating system, IP address for security logging, and active login sessions.</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><LifeBuoy size={12} className="text-emerald-600 dark:text-emerald-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Support Communications:</strong> Messages, transaction references, and screenshots submitted via Live Support Chat or email helpdesk.</div>
                  </li>
                </ul>
              </div>

              {/* Optional Information */}
              <div className="space-y-1.5 pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  Optional Information
                </span>
                <ul className="space-y-1 pl-1">
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><Sliders size={12} className="text-stone-600 dark:text-stone-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">App Preferences:</strong> Theme settings (Dark/Light), preferred language translations, accessibility scaling, and cloud storage integrations (Google Drive, Dropbox) when voluntarily connected.</div>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="shrink-0 mt-0.5"><Activity size={12} className="text-stone-600 dark:text-stone-400" /></span>
                    <div>• <strong className="text-stone-900 dark:text-white">Anonymous Usage Analytics:</strong> Aggregated tool performance telemetry and crash logs enabled to diagnose conversion bottlenecks and improve app stability.</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Cpu size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">How We Use Your Information</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              PaperX uses collected data solely for legitimate, service-oriented purposes to operate and deliver document intelligence tools:
            </p>

            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 pl-9 leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><UserCheck size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Account Management &amp; Authentication:</strong> Creating, maintaining, and securely authenticating user accounts, password resets, and managing active sessions.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Zap size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Document Processing &amp; Conversions:</strong> Executing file conversions, Neural OCR text extraction, layout-preserving translations, compression, merging, and digital signatures.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Database size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Storage &amp; File Retrieval:</strong> Storing, synchronizing, and retrieving saved documents within your personal account archive.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><CreditCard size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Subscriptions &amp; Payments:</strong> Verifying UPI reference numbers (UTR/RRN), activating Pro/Max tiers, delivering official invoices, and processing refund requests.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><LifeBuoy size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Customer Support &amp; Assistance:</strong> Responding to helpdesk tickets, Live Support Chat inquiries, and escalating urgent requests to the executive desk.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><ShieldCheck size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Security &amp; Abuse Prevention:</strong> Enforcing rate limits, detecting fraud, preventing unauthorized access, and securing system infrastructure.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Activity size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Performance &amp; Reliability:</strong> Monitoring processing latencies and diagnosing conversion errors to optimize speed and uptime.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><FileCheck size={12} className="text-indigo-600 dark:text-indigo-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Legal &amp; Regulatory Compliance:</strong> Complying with applicable Indian and global consumer protection, taxation, and statutory requirements.</div>
              </li>
            </ul>

            <div className="ml-9 p-3 bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/20 rounded-xl flex items-start gap-2">
              <ShieldCheck size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                Zero-Monetization &amp; AI Non-Training Pledge: PaperX never sells, rents, or monetizes personal information to third parties, and we never use your uploaded document contents to train public AI models.
              </p>
            </div>
          </div>

          {/* Cookies & Technical Storage */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                <Cookie size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Cookies &amp; Technical Storage</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              PaperX operates with a privacy-first architecture and does not use third-party advertising cookies or third-party behavioral analytics services to track users:
            </p>

            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 pl-9 leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Shield size={12} className="text-cyan-600 dark:text-cyan-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Zero Third-Party Advertising Cookies:</strong> We do not deploy cross-site tracking cookies, behavioral marketing trackers, or third-party advertising networks.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Database size={12} className="text-cyan-600 dark:text-cyan-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Essential Technical Storage:</strong> We use strictly necessary local browser storage (LocalStorage and secure session tokens) solely to maintain your login authentication, remember theme preferences, and secure API requests.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Eye size={12} className="text-cyan-600 dark:text-cyan-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">No Invasive Profiling:</strong> Any internal diagnostic metrics are technical and anonymous, utilized exclusively to detect system errors and optimize document conversion speeds.</div>
              </li>
            </ul>
          </div>

          {/* Children's Privacy Protection */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <ShieldAlert size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">Children&apos;s Privacy Protection</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              PaperX is intended strictly for users who are legally permitted to access the platform under applicable law. PaperX is not knowingly designed to solicit or collect personal information from children who are not legally permitted to use the service.
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              If PaperX becomes aware that personal data has been collected from a child contrary to applicable legal regulations, we will take prompt, appropriate steps to address and permanently delete such records where required. Parents or guardians may contact <strong className="text-stone-900 dark:text-white">paperx.assist@gmail.com</strong> for assistance.
            </p>
          </div>

          {/* 1. Document Privacy */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <FileCheck size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">1. Document &amp; File Confidentiality</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Your uploaded PDFs, scanned documents, and images are processed strictly to perform the actions you request (such as converting, merging, or scanning). We do not sell your files or use document contents to train public AI models.
            </p>
          </div>

          {/* 2. File Storage & Retention */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Database size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">2. Storage &amp; Retention Limits</h5>
            </div>
            <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 pl-9 leading-relaxed">
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><FileText size={12} className="text-teal-600 dark:text-teal-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">My Documents:</strong> Saved files are stored safely in your account archive.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Clock size={12} className="text-teal-600 dark:text-teal-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Recent Activity:</strong> Displays files created or modified within the last 30 days.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><Trash2 size={12} className="text-teal-600 dark:text-teal-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">User Deletion:</strong> You can delete any saved file from your archive at any time.</div>
              </li>
              <li className="flex items-start gap-1">
                <span className="shrink-0 mt-0.5"><AlertTriangle size={12} className="text-teal-600 dark:text-teal-400" /></span>
                <div>• <strong className="text-stone-900 dark:text-white">Account Erasure Criteria (10-Day Rule):</strong> When an account data erasure is requested, an automatic 10-day safety grace period begins. After 10 days of inactivity, the account and all documents are <strong>permanently and irreversibly deleted</strong>. Signing in before 10 days automatically cancels the erasure and restores everything.</div>
              </li>
            </ul>
          </div>

          {/* 3. Data Protection & Security */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20">
                <Lock size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">3. Account &amp; Data Security</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              All communications between your device and PaperX are secured using TLS 1.3 encryption. Account profile data, active sessions, and document records are protected with Firestore security rules.
            </p>
          </div>

          {/* 4. User Rights & Data Control */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Sliders size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">4. Your Data Rights &amp; Real Controls</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Under GDPR Article 17 &amp; 20 and CCPA, you retain full sovereignty over your data. You can download a complete structured JSON archive of your account, reset local preferences, or submit a GDPR Right to Erasure request. All erasure requests include an automatic 10-day grace period before permanent purge.
            </p>

            {/* 10-Day Permanent Deletion Criteria Banner */}
            <div className="ml-9 p-3.5 bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Data Erasure Criteria &amp; 10-Day Safe Timeline</span>
              </div>
              <ul className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1 pl-4 list-disc leading-relaxed">
                <li><strong className="text-stone-900 dark:text-white">10-Day Safety Window:</strong> Upon submitting an erasure request, your account is queued for 10 days rather than purged immediately, protecting against accidental loss.</li>
                <li><strong className="text-stone-900 dark:text-white">Automatic Permanent Delete:</strong> If you do not sign back in within 10 days, your account, PDF archives, login sessions, and settings will be permanently and irreversibly purged from our database.</li>
                <li><strong className="text-stone-900 dark:text-white">Instant Cancellation on Login:</strong> Entering and logging into your account at any time before the 10 days elapse automatically cancels the erasure request and restores full account access.</li>
              </ul>
            </div>

            {/* Quick Actions Grid */}
            <div className="relative z-50 pl-9 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <Undo2 size={13} className="" />
                    <span>Reset App Preferences</span>
                  </>
                )}
              </button>

              {user?.dataErasureRequested ? (
                <div className="relative z-50 col-span-1 sm:col-span-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      <Clock size={13} className="shrink-0" />
                      <span>Data Erasure Scheduled (10-Day Period)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelErasureRequest}
                      className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                    >
                      {cancelErasureSuccess ? 'Erasure Cancelled!' : 'Cancel Erasure Now'}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-normal">
                    Permanent deletion is set for {user.dataErasureScheduledUntil ? new Date(user.dataErasureScheduledUntil).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'in 10 days'}. Logging in or clicking "Cancel Erasure Now" automatically restores your account with nothing lost.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); console.log("Erasure button clicked"); setShowDeleteAccountModal(true); }}
                  className="relative z-50 py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 size={13} className="" />
                  <span>Request Data Erasure</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Policy Changes & Updates */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                <RefreshCw size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">5. Policy Changes &amp; Updates</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              PaperX may update this Privacy Policy periodically to reflect enhancements to our services, evolving security practices, or statutory legal requirements.
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              The latest version will always be published within the PaperX platform with an updated &ldquo;Last Updated&rdquo; date, and users are encouraged to review it periodically. Where legally required, PaperX will provide appropriate advance notice of material policy changes.
            </p>
          </div>

          {/* 6. Privacy Contact & Grievance */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Mail size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">6. Privacy Contact &amp; Grievance Redressal</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              If you have any questions, concerns, personal data requests, or privacy grievances regarding PaperX data practices, you can contact our privacy desk directly:
            </p>
            <div className="ml-9 p-3 bg-stone-100/90 dark:bg-[#1f242c]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              <p className="flex items-center gap-1.5">
                <Mail size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>• <strong className="text-stone-900 dark:text-white">Official Privacy Email:</strong> <a href="mailto:paperx.assist@gmail.com" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">paperx.assist@gmail.com</a></span>
              </p>
              <p className="flex items-center gap-1.5">
                <LifeBuoy size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>• <strong className="text-stone-900 dark:text-white">Live Support Grievance:</strong> Open 24/7 Live Support Chat and select <em>&ldquo;Talk with CEO&rdquo;</em> for direct executive grievance escalation.</span>
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
                * Please provide your registered email address, relevant Order/User ID, and sufficient details regarding your request to help us identify and address your inquiry promptly.
              </p>
            </div>
          </div>

          {/* 7. Privacy Policy Information */}
          <div className="p-4 bg-stone-50/80 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Info size={14} strokeWidth={2.2} className="" />
              </div>
              <h5 className="font-heading font-bold text-stone-900 dark:text-white text-xs">7. Privacy Policy Information</h5>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-9">
              Official release audit metadata and version specifications for the PaperX Privacy Policy:
            </p>

            <div className="ml-9 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-stone-100/90 dark:bg-[#1f242c]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-0.5">
                <div className="flex items-center gap-1">
                  <Calendar size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500">Effective Date</span>
                </div>
                <p className="font-bold text-stone-900 dark:text-white text-xs">October 6, 2026</p>
                <p className="text-[10.5px] text-stone-500 dark:text-stone-400">Official active date</p>
              </div>

              <div className="p-3 bg-stone-100/90 dark:bg-[#1f242c]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-0.5">
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500">Last Updated</span>
                </div>
                <p className="font-bold text-stone-900 dark:text-white text-xs">October 6, 2026</p>
                <p className="text-[10.5px] text-stone-500 dark:text-stone-400">Current policy revision</p>
              </div>

              <div className="p-3 bg-stone-100/90 dark:bg-[#1f242c]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-0.5">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500">Policy Version</span>
                </div>
                <p className="font-bold text-stone-900 dark:text-white text-xs">v2.4.0 (Production)</p>
                <p className="text-[10.5px] text-stone-500 dark:text-stone-400">PaperX Global Ecosystem</p>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 pl-9 leading-relaxed">
              * The latest official version of the PaperX Privacy Policy is continuously accessible within the app under Account Settings &gt; Privacy Policy.
            </p>
          </div>
        </div>

        {/* Real Working Export Account Data Action Card */}
        <div className="relative z-50 p-4.5 bg-stone-100/90 dark:bg-[#151b23]/80 border border-stone-200/90 dark:border-white/[0.08] rounded-2xl md:rounded-3xl space-y-3.5 shadow-xs">
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
                <Check size={11} strokeWidth={3} className="" /> {exportFeedback.count} Records Exported
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isExportingData}
              onClick={() => { console.log("Export button clicked"); handleGenerateFullAccountData(true); }}
              className="flex-1 min-w-[140px] py-2.5 px-4 bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-black rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isExportingData ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Preparing Export...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={14} />
                  <span>Download JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isExportingData}
              onClick={(e) => { e.stopPropagation(); console.log("Inspect button clicked"); handleInspectPayload(); }}
              className="py-2.5 px-3.5 bg-white dark:bg-[#1f242c] border border-stone-200 dark:border-[#30363d] text-stone-800 dark:text-[#c9d1d9] hover:bg-stone-50 dark:hover:bg-[#30363d] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              title="Inspect raw JSON data in viewer"
            >
              <Eye size={13} />
              <span>Inspect</span>
            </button>

            {exportJsonData && (
              <button
                type="button"
                onClick={handleCopyExportJson}
                className="py-2.5 px-3 bg-white dark:bg-[#1f242c] border border-stone-200 dark:border-[#30363d] text-stone-800 dark:text-[#c9d1d9] hover:bg-stone-50 dark:hover:bg-[#30363d] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
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
      {inline ? (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#0d1117] overflow-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 h-full overflow-hidden"
            >
              {view === 'menu' && renderMenu()}
              {view === 'personal' && renderPersonal()}
              {view === 'billing' && renderBilling()}
              {view === 'payment-history' && renderPaymentHistory()}
              {view === 'preferences' && renderPreferences()}
              {view === 'email-change' && renderEmailChange()}
              {view === 'about' && renderAbout()}
              {view === 'terms' && renderTerms()}
              {view === 'privacy' && renderPrivacy()}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                key="profile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
                onClick={onClose}
              />

              {/* Panel */}
              <motion.div 
                key="profile-panel"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                className="fixed top-0 left-0 h-full w-full sm:max-w-md bg-white dark:bg-[#0d1117] z-50 shadow-xl flex flex-col overflow-hidden will-change-transform transform-gpu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 h-full overflow-hidden"
                  >
                    {view === 'menu' && renderMenu()}
                    {view === 'personal' && renderPersonal()}
                    {view === 'billing' && renderBilling()}
                    {view === 'payment-history' && renderPaymentHistory()}
                    {view === 'preferences' && renderPreferences()}
                    {view === 'email-change' && renderEmailChange()}
                    {view === 'about' && renderAbout()}
                    {view === 'terms' && renderTerms()}
                    {view === 'privacy' && renderPrivacy()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Log Out of All Devices Confirmation Modal */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
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
                className="flex-1 py-3 bg-gray-100 dark:bg-[#1f242c] text-gray-700 dark:text-[#c9d1d9] font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-[#30363d] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isLoggingOutAll}
                onClick={handleLogoutAllDevices}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOutAll ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  'Log Out Other Devices'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check for Update Modal */}
      {showUpdateModal && updateResult && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpdateModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-[#0d1117] border border-stone-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto font-bold shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-stone-900 dark:text-white text-base font-heading">PaperX is Up to Date</h3>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  Version {updateResult.version}
                </p>
              </div>
              {updateResult.buildDate && (
                <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                  Build: {updateResult.buildDate}
                </p>
              )}
              <p className="text-xs text-stone-500 dark:text-stone-400 pt-1 leading-relaxed">
                {updateResult.message || 'You are running the latest version of PaperX. All document tools and security updates are active.'}
              </p>
            </div>

            {updateResult.releaseNotes && (
              <div className="p-3 bg-stone-50 dark:bg-[#151b23]/80 border border-stone-200/80 dark:border-white/[0.08] rounded-2xl text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed max-h-28 overflow-y-auto">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">What's New:</span>
                {updateResult.releaseNotes}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  handleDetectAndRestoreFullApp();
                }}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Layout size={14} />
                <span>Restore Full App UI & Layout</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="py-3 px-4 bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-black font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal with Authenticator (TOTP) */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base font-heading truncate">2-Step Verification</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Secure your account with an Authenticator App
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShow2FAModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 ml-auto"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Scan Authenticator QR */}
            {faStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#151b23]/80 rounded-2xl border border-gray-100 dark:border-white/[0.08] text-center">
                  <div className="p-3 bg-white dark:bg-[#0d1117] rounded-2xl border border-gray-200 dark:border-[#30363d] inline-block mb-3 shadow-sm">
                    <img 
                      src={getAuthenticatorQRCodeURL(faSecret, user?.email || 'user@paperx.app')} 
                      alt="Authenticator QR Code" 
                      className="w-36 h-36 mx-auto rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Scan QR Code with Authenticator App</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Google Authenticator, Authy, 1Password, or Apple Passwords</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-mono select-all bg-white dark:bg-[#1f242c] py-1.5 px-3 rounded-lg border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-white font-bold">
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
              <div className="space-y-4 py-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                  Open your authenticator app and enter the 6-digit verification code:
                </p>

                <div className="flex flex-col items-center">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
                    6-Digit Authenticator Code
                  </label>

                  {/* 6-Box Segmented Code Input with Dynamic Outer Line States */}
                  <div className="relative flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-[320px] mx-auto my-1">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const char = faCode[idx] || '';
                      const isCurrent = idx === faCode.length && faCode.length < 6;
                      const isFilled = Boolean(char);

                      let boxBorderAndBg = '';
                      if (faVerifyState === 'valid') {
                        boxBorderAndBg = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30 shadow-md scale-105';
                      } else if (faVerifyState === 'invalid') {
                        boxBorderAndBg = 'bg-red-50 dark:bg-red-950/50 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/30 animate-shake';
                      } else if (faVerifyState === 'checking') {
                        boxBorderAndBg = 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 ';
                      } else if (isFilled) {
                        boxBorderAndBg = 'bg-white dark:bg-[#1f242c] border-gray-900 dark:border-white text-gray-900 dark:text-white shadow-xs';
                      } else if (isCurrent) {
                        boxBorderAndBg = 'bg-white dark:bg-[#0d1117] border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10';
                      } else {
                        boxBorderAndBg = 'bg-gray-50 dark:bg-[#151b23]/80 border-gray-200 dark:border-white/[0.08] text-gray-400';
                      }

                      return (
                        <div 
                          key={idx}
                          className={`w-11 h-14 sm:w-12 sm:h-14 rounded-2xl border flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 leading-none ${boxBorderAndBg}`}
                        >
                          {char || (isCurrent && faVerifyState === 'idle' ? <span className="inline-block w-0.5 h-6 bg-gray-900 dark:bg-white animate-pulse self-center rounded-full" /> : '')}
                        </div>
                      );
                    })}

                    {/* Hidden overlay input for full touch & auto-detection */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      autoFocus
                      disabled={faVerifyState === 'valid' || isVerifyingFA}
                      maxLength={6}
                      value={faCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFaCode(val);
                        if (faVerifyState !== 'idle' && faVerifyState !== 'checking') {
                          setFaVerifyState('idle');
                        }
                        setFaError(null);
                        if (val.length === 6 && faVerifyState !== 'checking' && faVerifyState !== 'valid') {
                          handleAutoVerifyProfile2FA(val);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-center font-mono text-xl z-10"
                    />
                  </div>

                  {/* Status & Feedback */}
                  {faVerifyState === 'checking' && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-amber-600 dark:text-amber-400 font-bold">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying authenticator code...</span>
                    </div>
                  )}

                  {faVerifyState === 'valid' && (
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Code verified! Enabling 2FA...</span>
                    </div>
                  )}

                  {faError && (
                    <p className="text-xs text-red-500 mt-3 font-bold flex items-center justify-center gap-1">
                      <AlertTriangle size={14} />
                      <span>{faError}</span>
                    </p>
                  )}

                  {/* Navigation Helper Link */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFaStep(1);
                        setFaCode('');
                        setFaVerifyState('idle');
                        setFaError(null);
                      }}
                      className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium hover:underline transition cursor-pointer"
                    >
                      ← Rescan QR Code
                    </button>
                  </div>
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
                  <div className="bg-gray-50 dark:bg-[#151b23]/80 p-3 rounded-xl border border-gray-200 dark:border-white/[0.08] grid grid-cols-2 gap-2 font-mono text-xs text-gray-900 dark:text-white font-bold text-center">
                    {faBackupCodes.map((code, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#1f242c] py-1.5 px-2 rounded border border-gray-200 dark:border-[#30363d] shadow-xs select-all">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
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
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 ml-auto"
                      aria-label="Close modal"
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

                      <div className="p-3.5 bg-gray-50 dark:bg-[#151b23]/80 rounded-xl border border-gray-200 dark:border-white/[0.08] text-xs text-gray-600 dark:text-gray-300 space-y-1">
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
                      <div className="p-3.5 bg-gray-50 dark:bg-[#151b23]/80 rounded-2xl border border-gray-200 dark:border-white/[0.08] space-y-2 text-xs">
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
                                    : 'bg-gray-50 dark:bg-[#151b23]/80 hover:bg-gray-100 dark:hover:bg-[#1f242c] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white'
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
                                        ? 'text-gray-300 dark:text-gray-500' 
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
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#151b23]/80 border border-gray-200 dark:border-white/[0.08] rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
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
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportPreview(false); }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
        >
          <div className="bg-white dark:bg-[#0d1117] border border-stone-200 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-[#1f242c] text-stone-900 dark:text-white flex items-center justify-center font-bold">
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
                className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-[#1f242c] flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
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
                  onClick={() => { console.log("Modal Download button clicked"); handleGenerateFullAccountData(true); }}
                  className="relative z-50 py-2.5 px-4 bg-stone-900 hover:bg-black text-white dark:bg-white dark:hover:bg-stone-100 dark:text-black rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
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

      {/* GDPR Data Erasure / Account Deletion Modal (10-Day Safe Grace Period) */}
      {showDeleteAccountModal && (() => {
        const targetDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        const dynamicDateStr = targetDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const dynamicTimeStr = targetDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
        const fullDisplayDate = `${dynamicDateStr} at ${dynamicTimeStr}`;

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteAccountModal(false); }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 overflow-y-auto"
          >
            <div className="relative bg-white dark:bg-[#0d1117] border border-stone-200 dark:border-white/[0.08] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 my-8">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-[#1f242c] flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto font-bold shadow-xs">
                <Clock size={24} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-heading font-black text-stone-900 dark:text-white text-base">Request Account Data Erasure</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Protected with an automatic 10-day safety grace period
                </p>
              </div>

              {deletionSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Data Erasure Scheduled</p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Scheduled for permanent deletion on:
                    </p>
                    <div className="py-2 px-3 bg-white/80 dark:bg-[#0d1117]/80 rounded-xl border border-emerald-300 dark:border-emerald-700/50 font-bold text-stone-900 dark:text-white text-xs">
                      {scheduledErasureDateString || fullDisplayDate}
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl text-left text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Shield size={12} className="text-emerald-600 dark:text-emerald-400" />
                      10-Day Safe Cancellation:
                    </p>
                    <p className="leading-relaxed">
                      Simply log back into your PaperX account before this date to cancel this erasure request. Your account and all stored documents will be immediately restored with nothing lost.
                    </p>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Signing you out and redirecting to the login dashboard...
                  </p>
                  <button
                    type="button"
                    onClick={handleProceedToLogin}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Proceed to Login & Signup Page</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Real Date Detection Banner */}
                  <div className="p-3.5 bg-stone-50 dark:bg-[#151b23]/90 rounded-2xl border border-stone-200 dark:border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-500" />
                        Exact Deletion Date (10 Days)
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded-full text-[10px] font-bold">
                        10 Days Later
                      </span>
                    </div>
                    <p className="text-sm font-black text-stone-900 dark:text-white">
                      {fullDisplayDate}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Your erasure request takes exactly 10 days before documents and credentials are permanently purged.
                    </p>
                  </div>

                  {/* Grace Period Rules Card */}
                  <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-2">
                    <p className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Shield size={13} className="text-amber-600 dark:text-amber-400" />
                      How the 10-day safety grace period works:
                    </p>
                    <ul className="text-[11px] space-y-1.5 pl-3 list-disc text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                      <li>
                        <strong>Login cancels deletion:</strong> If you enter and sign into your account at any time before {dynamicDateStr}, the erasure is <strong>instantly cancelled</strong> and you can use your account again with <strong>nothing lost</strong>.
                      </li>
                      <li>
                        <strong>Automatic permanent delete:</strong> If you do not sign in within exactly 10 days, your account, PDF archives, and settings will be permanently and irreversibly deleted.
                      </li>
                      <li>
                        <strong>Immediate sign out:</strong> After confirming, your session will end and you will be moved directly to the login & signup page dashboard.
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountModal(false)}
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Keep Account Safe
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
                          <span>Scheduling...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} />
                          <span>Confirm Erasure (10 Days)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};