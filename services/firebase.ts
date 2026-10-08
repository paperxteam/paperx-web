import { initializeApp, getApps, getApp, setLogLevel } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  User as FirebaseUser,
  TotpMultiFactorGenerator,
  multiFactor,
  MultiFactorResolver
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  getDocFromCache,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentSnapshot,
  collection,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, UserSession } from '../types';
import { UAParser } from 'ua-parser-js';
import { checkPermanentSuspendedStatus } from '../src/utils/profanityFilter';
// Standard Firebase Web Client Config
const firebaseAppConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId || undefined
};

// Set Firebase SDK log level to silent to suppress benign internal SDK assertion logs
try {
  setLogLevel('silent');
} catch (_) {}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseAppConfig) : getApp();

// Initialize Auth cleanly
export const auth = getAuth(app);

// Initialize Firestore with long-polling resilience across Node.js & browser environments
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  // Try initializing with settings and databaseId
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  }, dbId);
} catch (e: any) {
  // If already initialized or other error, fallback to getFirestore
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Dedicated Google Drive Provider with least-privilege picker scopes
export const driveGoogleProvider = new GoogleAuthProvider();
driveGoogleProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveGoogleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
driveGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache for Google Drive access (never persisted to localStorage/sessionStorage)
let cachedGoogleDriveToken: string | null = null;

export const getCachedGoogleDriveToken = (): string | null => cachedGoogleDriveToken;
export const setCachedGoogleDriveToken = (token: string | null) => {
  cachedGoogleDriveToken = token;
};

export const getOrRequestGoogleDriveToken = async (): Promise<string> => {
  if (cachedGoogleDriveToken) {
    try {
      const testRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${cachedGoogleDriveToken}` }
      });
      if (testRes.ok) {
        return cachedGoogleDriveToken;
      }
    } catch (_) {}
  }

  try {
    const result = await signInWithPopup(auth, driveGoogleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Drive authorization.');
    }
    cachedGoogleDriveToken = credential.accessToken;
    return cachedGoogleDriveToken;
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('closed')
    ) {
      throw new Error('Google Drive authorization was cancelled.');
    }
    throw err;
  }
};

/**
 * Strict and helpful email format validator.
 * Validates domain structure, TLD length, and catches common typos like missing '.com' or invalid formats.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) return false;

  const parts = clean.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;

  for (const part of domainParts) {
    if (!part || part.length === 0) return false;
  }

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) return false;

  return true;
};

export const getEmailFormatError = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'Please enter your email address.';
  }
  const clean = email.trim();
  if (!clean.includes('@')) {
    return 'Please include an "@" in the email address (e.g. name@gmail.com).';
  }
  const parts = clean.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'Please enter a complete email address (e.g. name@gmail.com).';
  }
  const domain = parts[1];
  if (!domain.includes('.')) {
    return `Please enter a valid email domain (e.g. ${domain}.com).`;
  }
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return 'Please enter a valid top-level domain (e.g. .com, .org, .net).';
  }
  if (!isValidEmail(clean)) {
    return 'Please enter a valid email address format (e.g. name@gmail.com).';
  }
  return null;
};

/**
 * Format Firebase Auth errors into clean, user-friendly messages
 */
export const getAuthErrorMessage = (error: any, provider?: 'email' | 'google'): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  const msg = error.message || '';

  if (msg.includes('DEVICE_LIMIT_EXCEEDED')) {
    return 'Device limit exceeded! You can only be logged into a maximum of 5 devices simultaneously. Please log out from another device to continue.';
  }

  if (msg.includes('ACCOUNT_PERMANENTLY_DELETED')) {
    return 'This account was permanently deleted in accordance with your GDPR Right to Erasure request after the 10-day period expired.';
  }

  if (
    msg.includes('Pending promise was never set') ||
    msg.includes('INTERNAL ASSERTION FAILED') ||
    code === 'auth/cancelled-popup-request'
  ) {
    return 'Google sign-in popup was closed or cancelled. Please click "Sign in with Google" again.';
  }

  if (code.includes('api-key-not-valid') || msg.includes('api-key-not-valid')) {
    return `Firebase API key is not yet active or authorized for project "${firebaseConfig.projectId}". Please ensure Email/Password and Google sign-in methods are enabled in the Firebase Console (Authentication > Sign-in method).`;
  }
  if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
    if (provider === 'google') {
      return `Google sign-in is not enabled in Firebase project "${firebaseConfig.projectId}". Please enable the "Google" provider in Firebase Console > Authentication > Sign-in method.`;
    }
    if (provider === 'email') {
      return `Email/Password sign-in is not enabled in Firebase project "${firebaseConfig.projectId}". Please verify the "Email/Password" toggle is enabled and saved in Firebase Console > Authentication > Sign-in method.`;
    }
    return `This sign-in provider is not enabled in Firebase project "${firebaseConfig.projectId}". Please enable Email/Password or Google in Firebase Console > Authentication > Sign-in method.`;
  }
  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    return `This app domain is not in the authorized domains list for project "${firebaseConfig.projectId}". Please add this domain in Firebase Console > Authentication > Settings > Authorized Domains.`;
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format (e.g. name@gmail.com).';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to multiple failed login attempts. Please reset password or try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/internal-error':
      return 'An internal authentication error occurred. Please ensure Apple and Google providers are correctly configured in Firebase Console.';
    case 'auth/argument-error':
      return 'Please check your inputs and try again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Automatically checks if a user's subscription membership has expired.
 * If expired:
 * 1. Downgrades the user in Firestore to 'Basic Plan', status 'expired', maxProjects: 5, isPro: false.
 * 2. Returns updated user profile with isExpired: true.
 */
export const checkAndHandlePlanExpiry = (user: User): { isExpired: boolean; user: User } => {
  if (!user) return { isExpired: false, user };

  const isPaidPlan = user.plan === 'Pro Plan' || user.plan === 'Max Plan' || 
    (typeof user.plan === 'string' && (user.plan.toLowerCase().includes('plus') || user.plan.toLowerCase().includes('max') || user.plan.toLowerCase().includes('pro')));
  
  if (!isPaidPlan) {
    return { isExpired: false, user };
  }

  // Check expiration date
  const expiryTimestamp = user.planExpiresAt 
    ? new Date(user.planExpiresAt).getTime() 
    : (user.subscriptionEndDate ? new Date(user.subscriptionEndDate).getTime() : null);

  if (expiryTimestamp && expiryTimestamp <= Date.now()) {
    // Membership has expired!
    const expiredUser: User = {
      ...user,
      previousPlan: (user.plan as any) || 'Pro Plan',
      plan: 'Basic Plan',
      subscriptionStatus: 'expired',
      isPro: false,
      maxProjects: 5,
      updatedAt: new Date().toISOString()
    };

    // Asynchronously update Firestore document to persist expiration across all devices & sessions
    if (user.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          plan: 'Basic Plan',
          subscriptionStatus: 'expired',
          previousPlan: user.plan,
          isPro: false,
          maxProjects: 5,
          updatedAt: new Date().toISOString()
        }).catch((err) => {
          console.warn('Firestore plan expiration update notice:', err);
        });
      } catch (e) {
        console.warn('Firestore plan expiration write notice:', e);
      }
    }

    return { isExpired: true, user: expiredUser };
  }

  return { isExpired: false, user };
};

/**
 * Ensure user document exists in Firestore and return full User profile
 */
export const syncUserProfile = async (
  firebaseUser: FirebaseUser,
  additionalData?: { firstName?: string; lastName?: string }
): Promise<User> => {
  await checkDeviceLimit(firebaseUser.uid);

  const userRef = doc(db, 'users', firebaseUser.uid);

  const fallbackName = additionalData?.firstName
    ? `${additionalData.firstName} ${additionalData.lastName || ''}`.trim()
    : firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Paper X User';

  const avatarUrl = firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
  const memberSinceDate = firebaseUser.metadata.creationTime
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const initialProfile: User = {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    name: fallbackName,
    email: firebaseUser.email || '',
    avatarUrl,
    plan: 'Basic Plan',
    purchasedPlan: 'Basic Plan',
    activePlanMode: 'Basic Plan',
    billingCycle: 'month',
    subscriptionStatus: 'free',
    memberSince: memberSinceDate,
    projectsUsed: 0,
    maxProjects: 5
  };

  let existing: User | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existing = snap.data() as User;
    }
  } catch (_) {
    try {
      const cachedSnap = await getDocFromCache(userRef);
      if (cachedSnap.exists()) {
        existing = cachedSnap.data() as User;
      }
    } catch (_) {}
  }

  // Handle 10-day GDPR data erasure policy
  if (existing?.dataErasureRequested) {
    const now = Date.now();
    const scheduledTime = existing.dataErasureScheduledUntil
      ? new Date(existing.dataErasureScheduledUntil).getTime()
      : (existing.dataErasureScheduledAt ? new Date(existing.dataErasureScheduledAt).getTime() + 10 * 24 * 60 * 60 * 1000 : 0);

    if (scheduledTime > 0 && now >= scheduledTime) {
      // 10 DAYS EXPIRED: Permanently purge account!
      console.log('10 days passed since erasure request. Purging account permanently...');
      try {
        const docsSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'documents'));
        await Promise.all(docsSnap.docs.map(d => deleteDoc(doc(db, 'users', firebaseUser.uid, 'documents', d.id))));
      } catch (e) {
        console.warn('Document purge error:', e);
      }
      try {
        const sessSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'sessions'));
        await Promise.all(sessSnap.docs.map(s => deleteDoc(doc(db, 'users', firebaseUser.uid, 'sessions', s.id))));
      } catch (e) {
        console.warn('Session purge error:', e);
      }
      try {
        await deleteDoc(userRef);
      } catch (e) {
        console.warn('User doc purge error:', e);
      }
      await auth.signOut();
      throw new Error('ACCOUNT_PERMANENTLY_DELETED');
    } else {
      // User logged in BEFORE 10 days: automatically cancel data erasure and preserve everything!
      console.log('User logged in before 10-day deadline. Cancelling data erasure request and restoring account...');
      existing.dataErasureRequested = false;
      existing.dataErasureScheduledAt = undefined;
      existing.dataErasureScheduledUntil = undefined;
      existing.dataErasureCancelledAt = new Date().toISOString();

      try {
        await setDoc(userRef, {
          dataErasureRequested: false,
          dataErasureScheduledAt: null,
          dataErasureScheduledUntil: null,
          dataErasureCancelledAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to persist erasure cancellation to Firestore:', err);
      }

      try {
        sessionStorage.setItem('paperx_erasure_restored_notice', 'true');
      } catch (_) {}
    }
  }

  if (existing) {
    let bestAvatarUrl = avatarUrl;
    if (existing.avatarUrl && !existing.avatarUrl.includes('ui-avatars.com')) {
      bestAvatarUrl = existing.avatarUrl;
    }
    if (firebaseUser.photoURL) {
      bestAvatarUrl = firebaseUser.photoURL;
    }

    const userIsPermanentlySuspended = Boolean(
      existing.isPermanentSuspended ||
      (existing.status === 'DISABLED') ||
      Boolean((existing as any).isBlocked) ||
      checkPermanentSuspendedStatus(firebaseUser.email || firebaseUser.uid)
    );

    const mergedProfile: User = {
      ...initialProfile,
      ...existing,
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || existing.email || initialProfile.email,
      name: existing.name || fallbackName,
      avatarUrl: bestAvatarUrl,
      plan: existing.plan || 'Basic Plan',
      planExpiresAt: existing.planExpiresAt,
      billingCycle: existing.billingCycle,
      subscriptionStatus: existing.subscriptionStatus || 'free',
      previousPlan: existing.previousPlan,
      isPro: existing.isPro || false,
      memberSince: existing.memberSince || memberSinceDate,
      projectsUsed: typeof existing.projectsUsed === 'number' ? existing.projectsUsed : 0,
      maxProjects: typeof existing.maxProjects === 'number' ? existing.maxProjects : 5,
      dataErasureRequested: existing.dataErasureRequested ?? false,
      dataErasureScheduledAt: existing.dataErasureScheduledAt,
      dataErasureScheduledUntil: existing.dataErasureScheduledUntil,
      isPermanentSuspended: userIsPermanentlySuspended,
      permanentSuspensionReason: userIsPermanentlySuspended 
        ? (existing.permanentSuspensionReason || localStorage.getItem('paperx_permanent_banned_reason') || 'Giving hate and slangs to PaperX after receiving 3 warnings. Strictly prohibited by PaperX App Rules.')
        : undefined,
      isBlocked: userIsPermanentlySuspended || Boolean(existing.isBlocked),
      status: userIsPermanentlySuspended ? 'DISABLED' : (existing.status || 'ACTIVE'),
      blockReason: existing.blockReason || (userIsPermanentlySuspended ? 'Account permanently suspended' : undefined),
      forceLogout: false,
      forceReLogin: false,
      updatedAt: new Date().toISOString()
    };

    if (userIsPermanentlySuspended && typeof window !== 'undefined') {
      try {
        if (firebaseUser.email) {
          localStorage.setItem(`paperx_permanent_banned_${firebaseUser.email.toLowerCase()}`, 'true');
          localStorage.setItem('paperx_permanent_banned_email', firebaseUser.email);
        }
        if (firebaseUser.uid) {
          localStorage.setItem(`paperx_permanent_banned_${firebaseUser.uid}`, 'true');
        }
      } catch (_) {}
    }

    const { user: checkedProfile } = checkAndHandlePlanExpiry(mergedProfile);

    // Clear legacy ban keys from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('paperx_user_ban_until');
        localStorage.removeItem('paperx_user_ban_reason');
        window.dispatchEvent(new Event('paperx_ban_updated'));
      } catch (_) {}
    }
    
    // Background sync to keep Firestore updated
    setDoc(userRef, checkedProfile, { merge: true }).catch(e => console.warn('Background setDoc notice:', e));
    return checkedProfile;
  }

  // If new user, check if this email/uid is on banned list
  const isNewUserBanned = checkPermanentSuspendedStatus(firebaseUser.email || firebaseUser.uid);
  if (isNewUserBanned) {
    initialProfile.isPermanentSuspended = true;
    initialProfile.status = 'DISABLED';
    initialProfile.isBlocked = true;
    initialProfile.permanentSuspensionReason = localStorage.getItem('paperx_permanent_banned_reason') || 'Giving hate and slangs to PaperX after receiving 3 warnings. Strictly prohibited by PaperX App Rules.';
  }

  // If new user, create document
  await setDoc(userRef, {
    ...initialProfile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return initialProfile;
};

const SESSION_STORAGE_KEY = 'paperx_auth_user_session';

export const saveLocalSession = (user: User | null) => {
  if (user) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (_) {}
  } else {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_) {}
  }
};

export const getLocalSession = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

export const clearLocalSession = () => {
  saveLocalSession(null);
};

type AuthListener = (user: User | null) => void;
const authListeners: AuthListener[] = [];

export const onPaperXAuthStateChanged = (listener: AuthListener): (() => void) => {
  if (typeof listener === 'function') {
    authListeners.push(listener);
  }
  return () => {
    if (Array.isArray(authListeners)) {
      const index = authListeners.indexOf(listener);
      if (index !== -1) {
        authListeners.splice(index, 1);
      }
    }
  };
};

export const dispatchPaperXAuthChange = (user: User | null) => {
  saveLocalSession(user);
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.warn('Auth listener error:', e);
    }
  });
};

/**
 * Real Email & Password Signup
 */

export const checkDeviceLimit = async (uid: string) => {
  if (!uid || typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  let snapshot;
  try {
    snapshot = await getDocs(sessionsRef);
  } catch (e: any) {
    // If offline, allow execution gracefully
    console.warn("checkDeviceLimit offline notice:", e?.message || e);
    return;
  }
  
  const activeDocs = snapshot.docs.filter(docSnap => docSnap.data()?.revoked !== true);

  if (activeDocs.length >= 5) {
    const isAlreadyActive = activeDocs.some(doc => doc.id === deviceId);
    if (!isAlreadyActive) {
      const now = Date.now();
      const SevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      let cleanedCount = 0;

      // 1. Auto-clean stale sessions older than 7 days
      for (const sessionDoc of activeDocs) {
        const data = sessionDoc.data();
        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        if (!lastActiveTime || (now - lastActiveTime > SevenDaysMs)) {
          try {
            await deleteDoc(doc(db, 'users', uid, 'sessions', sessionDoc.id));
            cleanedCount++;
          } catch (_) {}
        }
      }

      if (cleanedCount > 0) {
        try {
          const freshSnap = await getDocs(sessionsRef);
          const freshActive = freshSnap.docs.filter(docSnap => docSnap.data()?.revoked !== true);
          if (freshActive.length < 5) return;
        } catch (_) {}
      }

      // 2. Auto-clean oldest inactive sessions if inactive > 24 hours
      const OneDayMs = 24 * 60 * 60 * 1000;
      const sortedDocs = [...activeDocs].sort((a, b) => {
        const timeA = a.data().lastActive ? new Date(a.data().lastActive).getTime() : 0;
        const timeB = b.data().lastActive ? new Date(b.data().lastActive).getTime() : 0;
        return timeA - timeB;
      });

      for (const oldDoc of sortedDocs) {
        const time = oldDoc.data().lastActive ? new Date(oldDoc.data().lastActive).getTime() : 0;
        if (!time || (now - time > OneDayMs)) {
          try {
            await deleteDoc(doc(db, 'users', uid, 'sessions', oldDoc.id));
            return;
          } catch (_) {}
        }
      }

      // Save the actual active sessions to show dynamically in the limit modal!
      try {
        const limitSessions = activeDocs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            deviceName: d.deviceName || 'Unknown Device',
            deviceType: d.deviceType || 'desktop',
            browser: d.browser || 'Web Browser',
            os: d.os || 'OS',
            lastActive: d.lastActive || new Date().toISOString(),
            loginTime: d.loginTime || new Date().toISOString(),
            timeZone: d.timeZone || 'UTC',
            location: d.location || '',
            ipAddress: d.ipAddress || '',
            isCurrentSession: false
          };
        });
        localStorage.setItem('paperx_temp_device_limit_sessions', JSON.stringify(limitSessions));
      } catch (_) {}

      dispatchPaperXAuthChange(null);
      await signOut(auth).catch(() => {});
      throw new Error('DEVICE_LIMIT_EXCEEDED');
    }
  }
};

export const registerWithEmail = async (
  email: string,
  pass: string,
  firstName: string,
  lastName: string
): Promise<User> => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('paperx_is_new_login', 'true');
      (window as any).__paperx_is_new_login = true;
    } catch (_) {}
  }

  // 1. Attempt Client Firebase Auth
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];
    
    // Update auth profile in background without blocking signup completion
    updateProfile(userCredential.user, {
      displayName: fullName,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
    }).catch(e => console.warn('Background profile update notice:', e));

    const profile = await syncUserProfile(userCredential.user, { firstName, lastName });
    dispatchPaperXAuthChange(profile);
    return profile;
  } catch (firebaseErr: any) {
    const code = firebaseErr?.code || '';
    const msg = firebaseErr?.message || '';

    // If it's a known user-level validation error, throw directly so user sees the exact advice
    if (
      code === 'auth/email-already-in-use' ||
      code === 'auth/weak-password' ||
      code === 'auth/invalid-email'
    ) {
      throw firebaseErr;
    }

    // For any project configuration, argument, restriction, or permission error,
    // seamlessly use high-availability server registration fallback so the account is created instantly.
    console.info('[PaperX Auth] Seamlessly completing registration via resilient server fallback...', { code, msg });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: pass,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account. Please try again.');
      }

      await checkDeviceLimit(data.user.uid || data.user.id);
      dispatchPaperXAuthChange(data.user);
      return data.user;
    } catch (serverErr: any) {
      if (serverErr?.message && !serverErr.message.includes('fetch')) {
        throw serverErr;
      }
      throw firebaseErr;
    }
  }
};

/**
 * Real Email & Password Login
 */
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('paperx_is_new_login', 'true');
      (window as any).__paperx_is_new_login = true;
    } catch (_) {}
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await syncUserProfile(userCredential.user);
    dispatchPaperXAuthChange(profile);
    triggerLoginAlert(profile.uid || profile.id, profile.email || '');
    return profile;
  } catch (firebaseErr: any) {
    const code = firebaseErr?.code || '';
    const msg = firebaseErr?.message || '';

    if (code === 'auth/multi-factor-auth-required') {
      throw firebaseErr;
    }

    if (
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/too-many-requests'
    ) {
      // Check server fallback in case the account was registered via server fallback
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: pass
          })
        });

        const data = await response.json();
        if (response.ok && data.user) {
          await checkDeviceLimit(data.user.uid || data.user.id);
          dispatchPaperXAuthChange(data.user);
          triggerLoginAlert(data.user.uid || data.user.id, data.user.email || '');
          return data.user;
        }
      } catch (_) {}

      throw firebaseErr;
    }

    console.info('[PaperX Auth] Seamlessly logging in via resilient server fallback...', { code, msg });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: pass
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password. Please check your credentials.');
      }

      await checkDeviceLimit(data.user.uid || data.user.id);
      dispatchPaperXAuthChange(data.user);
      triggerLoginAlert(data.user.uid || data.user.id, data.user.email || '');
      return data.user;
    } catch (serverErr: any) {
      if (serverErr?.message && !serverErr.message.includes('fetch')) {
        throw serverErr;
      }
      throw firebaseErr;
    }
  }
};

/**
 * Official Firebase Identity Platform MFA / TOTP Helpers
 */
export async function generateTotpSecretForEnrollment() {
  if (!auth.currentUser) throw new Error('No authenticated user');
  const session = await multiFactor(auth.currentUser).getSession();
  const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
  return {
    secret: totpSecret.secretKey,
    qrCodeUrl: totpSecret.generateQrCodeUrl(auth.currentUser.email || 'user@paperx.app', 'PaperX'),
    totpSecretObj: totpSecret
  };
}

export async function enrollTotpFactor(totpSecretObj: any, code: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecretObj, code);
  await multiFactor(auth.currentUser).enroll(assertion, 'PaperX Authenticator');
}

export async function unenrollTotpFactor() {
  if (!auth.currentUser) throw new Error('No authenticated user');
  const enrolled = multiFactor(auth.currentUser).enrolledFactors;
  const totp = enrolled.find(f => f.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (totp) {
    await multiFactor(auth.currentUser).unenroll(totp);
  }
}

/**
 * Real Google Sign In
 */
let isGoogleLoginInProgress = false;

export const loginWithGoogle = async (): Promise<User | null> => {
  if (isGoogleLoginInProgress) {
    return null;
  }

  isGoogleLoginInProgress = true;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('paperx_is_new_login', 'true');
      (window as any).__paperx_is_new_login = true;
    } catch (_) {}
  }
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(userCredential.user);
    dispatchPaperXAuthChange(profile);
    triggerLoginAlert(profile.uid || profile.id, profile.email || '');
    return profile;
  } catch (err: any) {
    const msg = err?.message || '';
    const code = err?.code || '';

    // If user voluntarily closed/cancelled popup or interrupted, silently return null
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('Pending promise was never set') ||
      msg.includes('INTERNAL ASSERTION FAILED')
    ) {
      return null;
    }
    throw err;
  } finally {
    isGoogleLoginInProgress = false;
  }
};

/**
 * Real Password Reset Code (OTP) & Direct Verification
 */
export const sendResetOtpCode = async (email: string): Promise<{ success: boolean; code?: string; message: string }> => {
  const cleanEmail = email.trim();
  
  // Trigger Firebase reset email in background (if enabled in project)
  sendPasswordResetEmail(auth, cleanEmail).catch(err => {
    console.warn('Firebase background reset email notice:', err);
  });

  // Call Server OTP API
  const response = await fetch('/api/auth/send-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send reset code');
  }

  return data;
};

export const verifyResetOtpCode = async (email: string, code: string): Promise<{ success: boolean; resetSessionToken: string }> => {
  const response = await fetch('/api/auth/verify-reset-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), code: code.trim() })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify reset code');
  }

  return data;
};

export const completePasswordResetWithToken = async (email: string, resetSessionToken: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/auth/reset-password-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      resetSessionToken,
      newPassword
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password');
  }

  return data;
};

export const sendEmailChangeCode = async (targetEmail: string, isNewEmail: boolean): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/auth/send-email-change-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetEmail: targetEmail.trim(), isNewEmail })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send verification code');
  }

  return data;
};

export const verifyEmailChangeCode = async (targetEmail: string, code: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch('/api/auth/verify-email-change-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetEmail: targetEmail.trim(), code: code.trim() })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Invalid verification code');
  }

  return data;
};

export const getUser2FAStatus = async (
  email: string
): Promise<{ 
  twoFactorEnabled: boolean; 
  twoFactorMethod?: 'totp'; 
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
}> => {
  try {
    const response = await fetch('/api/auth/get-user-2fa-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() })
    });
    if (!response.ok) return { twoFactorEnabled: false };
    return await response.json();
  } catch {
    return { twoFactorEnabled: false };
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  const cleanEmail = email.trim();
  const actionCodeSettings = {
    url: window.location.origin + '?mode=resetPassword',
    handleCodeInApp: false
  };

  try {
    await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
  } catch (err: any) {
    console.warn('ActionCodeSettings failed, falling back to standard reset:', err);
    // If actionCodeSettings domain is not whitelisted or fails, fallback to direct Firebase standard reset email
    await sendPasswordResetEmail(auth, cleanEmail);
  }
};

export const verifyResetCode = async (code: string): Promise<string> => {
  return await verifyPasswordResetCode(auth, code);
};

export const confirmResetPassword = async (code: string, newPassword: string): Promise<void> => {
  await confirmPasswordReset(auth, code, newPassword);
};

/**
 * Real Logout
 */
export const logoutUser = async (): Promise<void> => {
  console.log("logoutUser: starting...");
  const currentUid = auth.currentUser?.uid || getLocalSession()?.uid || getLocalSession()?.id;
  
  // Non-blocking cleanup: trigger it but do not await it
  if (currentUid && typeof window !== 'undefined') {
    const deviceId = getDeviceId();
    console.log("logoutUser: triggering background session cleanup...");
    deleteDoc(doc(db, 'users', currentUid, 'sessions', deviceId)).then(() => {
      console.log("logoutUser: background session cleanup successful");
    }).catch(e => {
      console.warn('logoutUser: background session cleanup failed (benign):', e);
    });
    try {
      localStorage.removeItem(`paperx_login_time_${deviceId}`);
      if (currentUid) {
        localStorage.removeItem(`paperx_login_time_${currentUid}_${deviceId}`);
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('paperx_login_time_')) {
          localStorage.removeItem(key);
          i--;
        }
      }
      sessionStorage.removeItem('paperx_is_new_login');
      delete (window as any).__paperx_is_new_login;
    } catch (_) {}
  }
  
  console.log("logoutUser: clearing local session and dispatching null auth change...");
  cachedGoogleDriveToken = null;
  clearLocalSession();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('paperx_user_ban_until');
      localStorage.removeItem('paperx_user_ban_reason');
      window.dispatchEvent(new Event('paperx_ban_updated'));
    } catch (_) {}
  }
  dispatchPaperXAuthChange(null);
  
  try {
    console.log("logoutUser: signing out...");
    await signOut(auth);
    console.log("logoutUser: signed out successfully");
  } catch (e) {
    console.error('Sign out notice:', e);
    throw new Error('Sign out failed');
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserInFirestore = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore update notice (offline/unavailable):', err);
  }

  // Also sync to server cache
  try {
    await fetch('/api/admin/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: uid, uid, ...data })
    });
  } catch (_) {}

  const current = getLocalSession();
  if (current && (current.uid === uid || current.id === uid)) {
    const updated = { ...current, ...data };
    saveLocalSession(updated);
  }
};

/**
 * Sync Documents from Firestore with Instant Real-Time onSnapshot & Retention Sync
 */
export const subscribeToUserDocuments = (uid: string, callback: (docs: any[]) => void) => {
  if (!uid) return () => {};
  try {
    const colRef = collection(db, 'users', uid, 'documents');

    const parseDocs = (snapshot: any) => {
      const docs: any[] = [];
      const parseVal = (val: any): number => {
        if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
        if (!val) return 0;
        if (typeof val.toMillis === 'function') {
          try { const r = val.toMillis(); if (r > 0) return r; } catch (e) {}
        }
        if (typeof val.seconds === 'number' && val.seconds > 0) return val.seconds * 1000;
        if (typeof val._seconds === 'number' && val._seconds > 0) return val._seconds * 1000;
        if (typeof val === 'string') {
          const p = new Date(val).getTime();
          if (!isNaN(p) && p > 0) return p;
        }
        return 0;
      };

      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        let timestamp = parseVal(data.timestamp) || parseVal(data.createdAt) || parseVal(data.date);
        if (!timestamp && typeof docSnap.id === 'string' && docSnap.id.startsWith('doc_')) {
          const parts = docSnap.id.split('_');
          if (parts.length >= 2) {
            const parsedId = parseInt(parts[1], 10);
            if (!isNaN(parsedId) && parsedId > 1000000000000) timestamp = parsedId;
          }
        }
        if (!timestamp) {
          timestamp = data._fallbackTs || Date.now();
        }
        docs.push({
          id: docSnap.id,
          ...data,
          timestamp,
          retentionYears: data.retentionYears || 5,
          retentionDaysRecent: data.retentionDaysRecent || 30,
          isArchived5Years: true
        });
      });
      docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return docs;
    };

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const docs = parseDocs(snapshot);
      callback(docs);
    }, (error) => {
      console.warn('Firestore documents subscription notice:', error.message);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  } catch (err) {
    console.warn('Firestore subscribe notice:', err);
    return () => {};
  }
};

export const saveLocalFileBinary = async (id: string, dataUrl: string): Promise<void> => {
  if (!id || !dataUrl || typeof window === 'undefined') return;

  // 1. Direct localStorage key for fast retrieval if reasonably sized (< 2MB)
  try {
    if (dataUrl.length < 2000000) {
      localStorage.setItem('paperx_file_' + id, dataUrl);
    }
  } catch (_) {}

  // 2. IndexedDB store for zero-limit binary persistence
  if (typeof window !== 'undefined' && window.indexedDB) {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('paperx_local_db', 2);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('paperx_files')) {
            db.createObjectStore('paperx_files', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          if (db.objectStoreNames.contains('paperx_files')) {
            const tx = db.transaction('paperx_files', 'readwrite');
            tx.objectStore('paperx_files').put({ id, dataUrl, updatedAt: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }
};

/**
 * Add / Update a document in Firestore with real-time sync, chunked binary storage (expanding beyond 1MB limit), and 5-year preservation
 */
export const addDocumentToFirestore = async (uid: string, docData: any): Promise<void> => {
  if (!uid || !docData) return;
  try {
    const docId = docData.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const docRef = doc(db, 'users', uid, 'documents', docId);
    const safeDocData = { ...docData };

    const rawDataUrl = typeof safeDocData.dataUrl === 'string' ? safeDocData.dataUrl : '';

    // Immediately preserve binary in local IndexedDB / localStorage for zero-delay offline preview
    if (rawDataUrl) {
      saveLocalFileBinary(docId, rawDataUrl).catch(() => {});
    }

    let timestamp = Date.now();
    if (typeof safeDocData.timestamp === 'number' && !isNaN(safeDocData.timestamp) && safeDocData.timestamp > 0) {
      timestamp = safeDocData.timestamp;
    } else if (typeof safeDocData.timestamp === 'string') {
      const parsed = new Date(safeDocData.timestamp).getTime();
      if (!isNaN(parsed) && parsed > 0) timestamp = parsed;
    }
    const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = safeDocData.expiresAt || new Date(timestamp + fiveYearsMs).toISOString();
    const recentUntil = safeDocData.recentUntil || new Date(timestamp + thirtyDaysMs).toISOString();

    const CHUNK_SIZE = 400000; // ~400KB per chunk safely within Firestore 1MB limits
    let hasChunks = false;
    let chunkCount = 0;

    if (rawDataUrl && rawDataUrl.length > 500000) {
      hasChunks = true;
      chunkCount = Math.ceil(rawDataUrl.length / CHUNK_SIZE);
      safeDocData.dataUrl = ''; // Keep parent metadata lightweight
      safeDocData.hasChunks = true;
      safeDocData.chunkCount = chunkCount;
      safeDocData.totalLength = rawDataUrl.length;

      // Save chunks into subcollection users/{uid}/documents/{docId}/chunks
      const chunkPromises = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunkPart = rawDataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkDocRef = doc(db, 'users', uid, 'documents', docId, 'chunks', `chunk_${i}`);
        chunkPromises.push(setDoc(chunkDocRef, {
          index: i,
          chunk: chunkPart,
          timestamp: Date.now()
        }, { merge: true }));
      }
      await Promise.all(chunkPromises);
    } else if (rawDataUrl) {
      safeDocData.hasChunks = false;
      safeDocData.chunkCount = 0;
    }

    const payload: Record<string, any> = {
      ...safeDocData,
      id: docId,
      timestamp,
      retentionYears: 5,
      isArchived5Years: true,
      retentionDaysRecent: 30,
      recentUntil,
      expiresAt,
      hasChunks: hasChunks || Boolean(safeDocData.hasChunks),
      chunkCount: chunkCount || safeDocData.chunkCount || 0,
      createdAt: safeDocData.createdAt || new Date(timestamp).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cleanPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        cleanPayload[key] = value;
      }
    }

    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (err) {
    console.warn('Firestore add document notice (offline/unavailable):', err);
  }
};

/**
 * Fetch full binary dataUrl for a document from Firestore, assembling chunks if necessary
 */
export const fetchDocumentBinaryFromFirestore = async (uid: string, docId: string): Promise<string | null> => {
  if (!uid || !docId) return null;
  try {
    const docRef = doc(db, 'users', uid, 'documents', docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    if (data.dataUrl && typeof data.dataUrl === 'string' && data.dataUrl.length > 0) {
      return data.dataUrl;
    }

    if (data.hasChunks && data.chunkCount > 0) {
      const chunksCol = collection(db, 'users', uid, 'documents', docId, 'chunks');
      const chunksSnap = await getDocs(chunksCol);
      if (!chunksSnap.empty) {
        const sortedDocs = chunksSnap.docs
          .map(d => d.data())
          .sort((a, b) => (a.index || 0) - (b.index || 0));
        const assembled = sortedDocs.map(d => d.chunk || '').join('');
        return assembled || null;
      }
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetch document binary notice:', err);
    return null;
  }
};

/**
 * Delete a document and its binary chunks from Firestore
 */
export const deleteDocumentFromFirestore = async (uid: string, docId: string): Promise<void> => {
  if (!uid || !docId) return;
  try {
    const docRef = doc(db, 'users', uid, 'documents', docId);
    const chunksCol = collection(db, 'users', uid, 'documents', docId, 'chunks');
    const chunksSnap = await getDocs(chunksCol);
    if (!chunksSnap.empty) {
      const deletePromises = chunksSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    }
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete document notice (offline/unavailable):', err);
  }
};

/**
 * Real-time User Profile Listener
 */
export const subscribeToUserProfile = (uid: string, callback: (user: User | null) => void) => {
  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawUser = snapshot.data() as User;
        const { user: checkedUser } = checkAndHandlePlanExpiry(rawUser);
        callback(checkedUser);
      }
    }, (error) => {
      console.warn('Firestore offline / connection notice for profile:', error.message);
    });
  } catch (err) {
    console.warn('Firestore profile subscription notice:', err);
    return () => {};
  }
};


export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  let deviceId = localStorage.getItem('paperx_device_id');
  if (!deviceId) {
    deviceId = sessionStorage.getItem('paperx_device_id');
    if (deviceId) {
      localStorage.setItem('paperx_device_id', deviceId);
    } else {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('paperx_device_id', deviceId);
    }
  }
  return deviceId;
};

export const getDeviceInfoSync = (): { name: string, type: 'mobile' | 'laptop' | 'desktop' | 'tablet', browser: string, os: string } => {
  if (typeof window === 'undefined') {
    return { name: 'Current Device', type: 'desktop', browser: 'Browser', os: 'OS' };
  }
  
  try {
    const parser = new UAParser();
    const result = parser.getResult();
    const ua = navigator.userAgent;
    
    let deviceName = '';
    
    // 1. Vendor and Model from UAParser
    if (result.device.vendor && result.device.model) {
      deviceName = `${result.device.vendor} ${result.device.model}`;
    } else if (result.device.model) {
      deviceName = result.device.model;
    } else if (result.device.vendor) {
      deviceName = `${result.device.vendor} Device`;
    }

    const osName = result.os.name || '';
    const osVersion = result.os.version || '';
    
    let type: 'mobile' | 'laptop' | 'desktop' | 'tablet' = 'desktop';

    // 2. Identify Tablets
    const isIPad = /ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidTablet = /android/i.test(ua) && !/mobile/i.test(ua);
    const isGenericTablet = result.device.type === 'tablet' || /(tablet|playbook|silk|kindle)/i.test(ua);

    if (isIPad || isAndroidTablet || isGenericTablet) {
      type = 'tablet';
      if (!deviceName) {
        deviceName = isIPad ? 'Apple iPad' : 'Tablet Device';
      }
    } 
    // 3. Identify Mobile Smartphones
    else if (result.device.type === 'mobile' || /iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
      type = 'mobile';
      if (!deviceName) {
        if (/iphone/i.test(ua)) deviceName = 'Apple iPhone';
        else deviceName = 'Smartphone';
      }
    } 
    // 4. Identify Laptops vs Desktops
    else {
      if (/CrOS/i.test(ua)) {
        type = 'laptop';
        if (!deviceName) deviceName = 'Chromebook';
      } else if (osName === 'macOS' || osName === 'Mac OS' || /Macintosh/i.test(ua)) {
        const isLikelyLaptop = window.screen.width <= 1800 || (window.devicePixelRatio >= 2 && window.screen.width <= 2000) || ('ontouchstart' in window);
        type = isLikelyLaptop ? 'laptop' : 'desktop';
        if (!deviceName) {
          deviceName = isLikelyLaptop ? 'Apple MacBook' : 'Apple Mac Desktop';
        }
      } else if (osName === 'Windows' || /Windows/i.test(ua)) {
        const isTouch = navigator.maxTouchPoints > 0;
        const isLaptopScreen = window.screen.width <= 1920 && (window.screen.height <= 1200 || isTouch);
        type = isLaptopScreen ? 'laptop' : 'desktop';
        if (!deviceName) {
          const winVer = osVersion || (ua.includes('Windows NT 10.0') ? '10/11' : '');
          deviceName = isLaptopScreen ? `Windows ${winVer} Laptop` : `Windows ${winVer} PC`;
        }
      } else if (osName === 'Linux' || /Linux/i.test(ua)) {
        const isLaptopScreen = window.screen.width <= 1600 || navigator.maxTouchPoints > 0;
        type = isLaptopScreen ? 'laptop' : 'desktop';
        if (!deviceName) {
          deviceName = isLaptopScreen ? 'Linux Laptop' : 'Linux Workstation';
        }
      } else {
        type = 'desktop';
        if (!deviceName) deviceName = 'Computer';
      }
    }

    // 5. Browser details
    let browserName = result.browser.name || 'Web Browser';
    if (result.browser.version) {
      const majorVer = result.browser.version.split('.')[0];
      browserName = `${browserName} ${majorVer}`;
    }
    
    let sanitizedOsName = osName;
    if (/android/i.test(sanitizedOsName)) {
      sanitizedOsName = 'Mobile OS';
    }
    const formattedOs = sanitizedOsName ? (osVersion ? `${sanitizedOsName} ${osVersion}` : sanitizedOsName) : 'OS';

    let cleanName = deviceName.replace(/android/gi, '').replace(/^[()\s\-_]+|[()\s\-_]+$/g, '').trim();
    if (!cleanName) {
      cleanName = type === 'mobile' ? 'Smartphone' : type === 'tablet' ? 'Tablet' : 'Current Device';
    }

    return {
      name: cleanName,
      type,
      browser: browserName.replace(/android/gi, 'Mobile').trim(),
      os: formattedOs
    };
  } catch (_) {
    return {
      name: 'Current Device',
      type: 'desktop',
      browser: 'Web Browser',
      os: 'OS'
    };
  }
};

export const getDeviceName = async (): Promise<{ name: string, type: 'mobile' | 'laptop' | 'desktop' | 'tablet', browser: string, os: string }> => {
  const syncInfo = getDeviceInfoSync();
  if (typeof window === 'undefined') {
    return syncInfo;
  }
  
  let deviceName = syncInfo.name;
  let deviceType = syncInfo.type;

  // Modern Client Hints for model / make if available
  const nav = navigator as any;
  if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
    try {
      const hints = await nav.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion', 'formFactors']);
      
      if (hints.formFactors && Array.isArray(hints.formFactors) && hints.formFactors.length > 0) {
        if (hints.formFactors.includes('mobile')) deviceType = 'mobile';
        else if (hints.formFactors.includes('tablet')) deviceType = 'tablet';
        else if (hints.formFactors.includes('desktop') && deviceType !== 'laptop') deviceType = 'desktop';
      }

      if (hints.model && hints.model.trim()) {
        deviceName = hints.model.trim();
      }

      if (hints.platform === 'Windows' && hints.platformVersion) {
        const major = parseInt(hints.platformVersion.split('.')[0], 10);
        if (major >= 13) {
          deviceName = deviceName.replace(/Windows( 10)?/, 'Windows 11');
        }
      }
    } catch (_) {}
  }

  // Battery API check to accurately differentiate Laptop vs Desktop when on PC/Mac
  if (deviceType === 'desktop' || deviceType === 'laptop') {
    try {
      if (typeof (navigator as any).getBattery === 'function') {
        const battery = await (navigator as any).getBattery();
        if (battery) {
          deviceType = 'laptop';
          if (syncInfo.os.includes('Mac') || syncInfo.os.includes('macOS')) {
            deviceName = 'Apple MacBook';
          } else if (syncInfo.os.includes('Windows')) {
            deviceName = deviceName.includes('Laptop') ? deviceName : deviceName.replace(/PC$/, 'Laptop');
          }
        }
      }
    } catch (_) {}
  }

  let finalName = (deviceName || syncInfo.name).replace(/android/gi, '').replace(/^[()\s\-_]+|[()\s\-_]+$/g, '').trim();
  if (!finalName) {
    finalName = deviceType === 'mobile' ? 'Smartphone' : deviceType === 'tablet' ? 'Tablet' : deviceType === 'laptop' ? 'Laptop' : 'Current Device';
  }

  return {
    ...syncInfo,
    name: finalName,
    type: deviceType,
    browser: syncInfo.browser.replace(/android/gi, 'Mobile').trim(),
    os: syncInfo.os.replace(/android/gi, 'Mobile OS').trim()
  };
};

interface GeoLocationInfo {
  ipAddress?: string;
  location?: string;
  timeZone?: string;
}

export const fetchClientGeoLocation = async (): Promise<GeoLocationInfo> => {
  if (typeof window === 'undefined') return {};

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const tzName = localTz.split('/').pop()?.replace(/_/g, ' ') || 'Local';
  const defaultGeo: GeoLocationInfo = {
    timeZone: localTz,
    location: tzName !== 'UTC' ? `${tzName} Region` : 'Unknown Location'
  };

  // Try ipapi.co (HTTPS) first with AbortController 3s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res && res.ok) {
      const data = await res.json();
      if (data) {
        return {
          ipAddress: data.ip || undefined,
          location: data.city && data.country_name ? `${data.city}, ${data.country_name}` : data.city || data.country_name || undefined,
          timeZone: data.timezone || localTz
        };
      }
    }
  } catch (_) {}

  // Fallback to ip-api.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://demo.ip-api.com/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res && res.ok) {
      const data = await res.json();
      if (data && (data.status === 'success' || data.city)) {
        return {
          ipAddress: data.query || undefined,
          location: data.city && data.country ? `${data.city}, ${data.country}` : data.city || data.country || undefined,
          timeZone: data.timezone || localTz
        };
      }
    }
  } catch (_) {}

  return defaultGeo;
};

export const recordUserSession = async (userId: string, isNewLogin: boolean = false) => {
  if (!userId || typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  
  // Prevent background/inactive tabs from updating lastActive timestamps
  if (!isNewLogin && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return;
  }
  
  try {
    const deviceInfo = await getDeviceName();
    const now = new Date().toISOString();
    const loginKey = `paperx_login_time_${userId}_${deviceId}`;
    
    // Check if new login is requested via param OR via sessionStorage flag OR global flag
    let isNewLoginSession = isNewLogin;
    try {
      if (
        sessionStorage.getItem('paperx_is_new_login') === 'true' ||
        (typeof window !== 'undefined' && (window as any).__paperx_is_new_login)
      ) {
        isNewLoginSession = true;
        sessionStorage.removeItem('paperx_is_new_login');
        if (typeof window !== 'undefined') {
          delete (window as any).__paperx_is_new_login;
        }
      }
    } catch (_) {}

    const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);

    // Resolve client geolocation data
    let geo: GeoLocationInfo = {};
    try {
      geo = await fetchClientGeoLocation();
    } catch (_) {}

    const clientTimeZone = geo.timeZone || (typeof window !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : 'UTC');

    if (isNewLoginSession) {
      // Direct login action: strictly force-overwrite to current time in both localStorage & Firestore
      localStorage.setItem(loginKey, now);
      try {
        localStorage.removeItem(`paperx_login_time_${deviceId}`);
      } catch (_) {}

      await setDoc(sessionRef, {
        id: deviceId,
        userId,
        deviceName: deviceInfo.name,
        deviceType: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastActive: now,
        loginTime: now,
        timeZone: clientTimeZone,
        ipAddress: geo.ipAddress || '',
        location: geo.location || '',
        revoked: false
      }, { merge: true });
    } else {
      // Check existing session document in Firestore
      let preservedLoginTime = null;
      try {
        const snap = await getDoc(sessionRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.loginTime) {
            // Reset loginTime if the session has been inactive for more than 30 minutes (standard session timeout)
            const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
            const thirtyMinsMs = 30 * 60 * 1000;
            if (lastActiveTime && (new Date(now).getTime() - lastActiveTime > thirtyMinsMs)) {
              preservedLoginTime = now;
            } else {
              preservedLoginTime = data.loginTime;
            }
          }
        }
      } catch (_) {}

      if (!preservedLoginTime) {
        // Fallback to local storage if firestore was empty/offline
        preservedLoginTime = localStorage.getItem(loginKey);
        if (!preservedLoginTime) {
          const legacyKey = `paperx_login_time_${deviceId}`;
          const legacyTime = localStorage.getItem(legacyKey);
          if (legacyTime) {
            preservedLoginTime = legacyTime;
            localStorage.setItem(loginKey, legacyTime);
            localStorage.removeItem(legacyKey);
          }
        }
        if (!preservedLoginTime) {
          preservedLoginTime = now;
        }
      }

      // Synchronize back to local storage
      localStorage.setItem(loginKey, preservedLoginTime);

      await setDoc(sessionRef, {
        id: deviceId,
        userId,
        deviceName: deviceInfo.name,
        deviceType: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastActive: now,
        loginTime: preservedLoginTime,
        timeZone: clientTimeZone,
        ipAddress: geo.ipAddress || '',
        location: geo.location || '',
        revoked: false
      }, { merge: true });
    }
  } catch (e: any) {
    // Silently ignore offline network/cache errors so app execution is never interrupted
    console.warn("Session recording offline notice:", e?.message || e);
  }
};

export const subscribeToUserSessions = (userId: string, callback: (sessions: UserSession[]) => void) => {
  if (!userId) return () => {};
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const deviceId = getDeviceId();
  
  // Ensure the current session is registered/updated in Firestore
  recordUserSession(userId).catch(() => {});

  // Build the guaranteed current device session object
  const initialDeviceInfo = getDeviceInfoSync();
  const loginKey = `paperx_login_time_${userId}_${deviceId}`;
  
  let preservedLoginTime = null;
  let isNewLoginSessionSync = false;
  try {
    if (
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('paperx_is_new_login') === 'true' || (window as any).__paperx_is_new_login)
    ) {
      isNewLoginSessionSync = true;
    }
  } catch (_) {}

  if (typeof window !== 'undefined') {
    if (isNewLoginSessionSync) {
      preservedLoginTime = new Date().toISOString();
    } else {
      preservedLoginTime = localStorage.getItem(loginKey);
      if (!preservedLoginTime) {
        // Legacy key fallback/migration during subscription too
        preservedLoginTime = localStorage.getItem(`paperx_login_time_${deviceId}`);
      }
    }
  }
  
  if (!preservedLoginTime) {
    preservedLoginTime = new Date().toISOString();
  }

  const clientTimeZone = typeof window !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') : 'UTC';
  const currentFallbackSession: UserSession = {
    id: deviceId,
    userId,
    deviceName: initialDeviceInfo.name,
    deviceType: initialDeviceInfo.type,
    browser: initialDeviceInfo.browser,
    os: initialDeviceInfo.os,
    lastActive: new Date().toISOString(),
    loginTime: preservedLoginTime,
    timeZone: clientTimeZone,
    isCurrentSession: true
  };

  let hasEmittedFromFirestore = false;

  const unsubscribe = onSnapshot(sessionsRef, (snapshot) => {
    hasEmittedFromFirestore = true;
    const rawSessions = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as UserSession);
    const validSessions = rawSessions.filter(s => s.revoked !== true);
    
    let formattedSessions: UserSession[] = validSessions.map(s => ({
      ...s,
      isCurrentSession: s.id === deviceId
    }));

    // If the current device session has not yet propagated into Firestore docs, include it immediately
    const hasCurrent = formattedSessions.some(s => s.isCurrentSession);
    if (!hasCurrent) {
      formattedSessions = [currentFallbackSession, ...formattedSessions];
      recordUserSession(userId).catch(() => {});
    }

    formattedSessions.sort((a, b) => {
      if (a.isCurrentSession) return -1;
      if (b.isCurrentSession) return 1;
      return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
    });

    callback(formattedSessions);
  }, (err) => {
    console.warn("Session subscription notice:", err?.message || err);
    // If offline or permission error, ensure current device is still displayed
    if (!hasEmittedFromFirestore) {
      callback([currentFallbackSession]);
    }
  });

  return unsubscribe;
};


export const monitorCurrentSession = (userId: string, onRevoked: () => void) => {
  if (!userId || typeof window === 'undefined') return () => {};
  const deviceId = getDeviceId();
  const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);
  
  let hadExisted = false;
  return onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      hadExisted = true;
      const data = snapshot.data();
      // Only revoke if explicitly marked as revoked by user on another device
      if (data?.revoked === true) {
        onRevoked();
      }
    } else if (hadExisted) {
      // Only revoke if the document genuinely existed during this session and was deleted
      onRevoked();
    }
  }, (err) => {
    // Non-fatal permission/offline notice: never force logout on connection drops
    console.warn("Session monitor notice (non-fatal):", err?.message || err);
  });
};

export const removeAllOtherSessions = async (userId: string) => {
  if (!userId) return;
  const deviceId = getDeviceId();
  console.log('removeAllOtherSessions: starting for userId:', userId, 'deviceId:', deviceId);
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    console.log('removeAllOtherSessions: fetching all sessions...');
    const snapshot = await getDocs(sessionsRef);
    console.log('removeAllOtherSessions: fetched', snapshot.size, 'sessions');
    
    if (snapshot.empty) {
      console.log('removeAllOtherSessions: no sessions to update');
      return;
    }

    const sessionsToUpdate = snapshot.docs.filter(docSnap => 
      docSnap.id !== deviceId && docSnap.data().revoked !== true
    );
    if (sessionsToUpdate.length === 0) {
      console.log('removeAllOtherSessions: no other sessions to update');
      return;
    }

    console.log('removeAllOtherSessions: updating', sessionsToUpdate.length, 'sessions in batches of 500');

    // Firestore write batch limit is 500
    const BATCH_SIZE = 500;
    const batchPromises = [];
    for (let i = 0; i < sessionsToUpdate.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = sessionsToUpdate.slice(i, i + BATCH_SIZE);
      
      batchDocs.forEach((docSnap) => {
        batch.delete(doc(db, 'users', userId, 'sessions', docSnap.id));
      });

      console.log(`removeAllOtherSessions: committing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      batchPromises.push(batch.commit());
    }
    
    await Promise.all(batchPromises);

    console.log(`Successfully set revoked flag for ${sessionsToUpdate.length} other sessions.`);
  } catch (e) {
    console.error("Failed to update other sessions", e);
    throw e; // Re-throw to handle in UI
  }
};

export const removeUserSession = async (userId: string, sessionId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (e) {
    console.error("Failed to remove session", e);
  }
};

export const triggerLoginAlert = async (uid: string, email: string) => {
  const deviceId = getDeviceId();
  const deviceInfo = await getDeviceName();
  const deviceName = `${deviceInfo.name} (${deviceInfo.browser} on ${deviceInfo.os})`;
  
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'Unknown';

  const date = new Date().toLocaleDateString('en-US', {
    dateStyle: 'medium'
  });
  
  try {
    // Check if the user has multiple active sessions (1+ other devices active) in Firestore
    const sessionsRef = collection(db, 'users', uid, 'sessions');
    const sessionSnap = await getDocs(sessionsRef);
    const rawSessions = sessionSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    const activeSessions = rawSessions.filter((s: any) => s.revoked !== true);

    const hasOtherActiveDevice = activeSessions.some((s: any) => s.id !== deviceId);

    if (!hasOtherActiveDevice) {
      console.log("[LoginAlert] Login is on a single active device, skipping security email alert.");
      return;
    }

    const response = await fetch('/api/auth/send-login-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        uid, 
        email, 
        deviceId,
        deviceName,
        userAgent,
        platform,
        date
      })
    });
    if (!response.ok) {
      const data = await response.json();
      console.error("Failed to send login alert", data);
    }
  } catch (e) {
    console.error("Failed to send login alert", e);
  }
};
