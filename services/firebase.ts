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
  User as FirebaseUser
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

// Initialize Auth
export const auth = getAuth(app);

// Apply initial session persistence setting (Auto-Restore Session preference)
try {
  if (typeof window !== 'undefined') {
    const isAutoRestore = localStorage.getItem('pref_autoRestoreSession') !== 'false';
    setPersistence(auth, isAutoRestore ? browserLocalPersistence : browserSessionPersistence).catch(() => {});
  }
} catch (_) {}

// Initialize Firestore with long-polling resilience across Node.js & browser environments
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  // Try initializing with settings and databaseId
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, dbId);
} catch (e: any) {
  // If already initialized or other error, fallback to getFirestore
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

  const isPaidPlan = user.plan === 'Plus Plan' || user.plan === 'Max Plan' || 
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
      previousPlan: (user.plan as any) || 'Plus Plan',
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

  // Try retrieving cached profile first for speed
  try {
    const cachedSnap = await getDocFromCache(userRef);
    if (cachedSnap.exists()) {
      const existing = cachedSnap.data() as User;
      
      let bestAvatarUrl = avatarUrl;
      if (existing.avatarUrl && !existing.avatarUrl.includes('ui-avatars.com')) {
          bestAvatarUrl = existing.avatarUrl;
      }
      if (firebaseUser.photoURL) {
          bestAvatarUrl = firebaseUser.photoURL;
      }

      const cachedProfile: User = {
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
        maxProjects: typeof existing.maxProjects === 'number' ? existing.maxProjects : 5
      };

      const { user: checkedProfile } = checkAndHandlePlanExpiry(cachedProfile);
      return checkedProfile;
    }
  } catch (_) {
    // Cache miss, proceed
  }

  // Asynchronously ensure document exists in Firestore without delaying authentication/UI
  (async () => {
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const existing = snap.data() as User;
        
        let bestAvatarUrl = avatarUrl;
        if (existing.avatarUrl && !existing.avatarUrl.includes('ui-avatars.com')) {
            bestAvatarUrl = existing.avatarUrl;
        }
        if (firebaseUser.photoURL) {
            bestAvatarUrl = firebaseUser.photoURL;
        }

        const merged: User = {
          ...initialProfile,
          ...existing,
          avatarUrl: bestAvatarUrl,
          forceLogout: false,
          forceReLogin: false,
          updatedAt: new Date().toISOString()
        };

        const { user: checkedMerged } = checkAndHandlePlanExpiry(merged);

        await setDoc(userRef, checkedMerged, { merge: true });
      } else {
        await setDoc(userRef, {
          ...initialProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Background Firestore profile sync:', err);
      setDoc(userRef, {
        ...initialProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(e => console.warn('Background setDoc notice:', e));
    }
  })();

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
  authListeners.push(listener);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index !== -1) {
      authListeners.splice(index, 1);
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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
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

    // If Firebase project has not enabled Email/Password in Console or Identity Toolkit is restricted,
    // seamlessly use high-availability server fallback so user account is created and usable immediately.
    if (
      code === 'auth/operation-not-allowed' || 
      msg.includes('operation-not-allowed') ||
      code.includes('api-key-not-valid') ||
      msg.includes('api-key-not-valid')
    ) {
      console.info('[PaperX Auth] Seamlessly completing registration via resilient server fallback...');
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

                  await checkDeviceLimit(data.user.uid);
      dispatchPaperXAuthChange(data.user);
      return data.user;
    }

    throw firebaseErr;
  }
};

/**
 * Real Email & Password Login
 */
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const profile = await syncUserProfile(userCredential.user);
    dispatchPaperXAuthChange(profile);
    return profile;
  } catch (firebaseErr: any) {
    const code = firebaseErr?.code || '';
    const msg = firebaseErr?.message || '';

    if (
      code === 'auth/operation-not-allowed' || 
      msg.includes('operation-not-allowed') ||
      code.includes('api-key-not-valid') ||
      msg.includes('api-key-not-valid')
    ) {
      console.info('[PaperX Auth] Seamlessly logging in via resilient server fallback...');
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
      return data.user;
    }

    throw firebaseErr;
  }
};

/**
 * Real Google Sign In
 */
let isGoogleLoginInProgress = false;

export const loginWithGoogle = async (): Promise<User | null> => {
  if (isGoogleLoginInProgress) {
    return null;
  }

  isGoogleLoginInProgress = true;
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(userCredential.user);
    dispatchPaperXAuthChange(profile);
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
  }
  
  console.log("logoutUser: clearing local session and dispatching null auth change...");
  clearLocalSession();
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
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
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
    dispatchPaperXAuthChange(updated);
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
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        const timestamp = typeof data.timestamp === 'number' && !isNaN(data.timestamp)
          ? data.timestamp
          : (data.createdAt ? new Date(data.createdAt).getTime() : (data.date ? new Date(data.date).getTime() : Date.now()));
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

/**
 * Add / Update a document in Firestore with real-time sync and 30-day recent & 5-year preservation
 */
export const addDocumentToFirestore = async (uid: string, docData: any): Promise<void> => {
  if (!uid || !docData) return;
  try {
    const docId = docData.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const docRef = doc(db, 'users', uid, 'documents', docId);
    const safeDocData = { ...docData };

    const timestamp = typeof safeDocData.timestamp === 'number' && !isNaN(safeDocData.timestamp)
      ? safeDocData.timestamp
      : Date.now();
    const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = safeDocData.expiresAt || new Date(timestamp + fiveYearsMs).toISOString();
    const recentUntil = safeDocData.recentUntil || new Date(timestamp + thirtyDaysMs).toISOString();

    // Firestore has a 1MB limit. Only strip dataUrl if it exceeds ~750KB
    if (safeDocData.dataUrl && safeDocData.dataUrl.length > 750000) {
      delete safeDocData.dataUrl;
    }

    const payload = {
      ...safeDocData,
      id: docId,
      timestamp,
      retentionYears: 5,
      isArchived5Years: true,
      retentionDaysRecent: 30,
      recentUntil,
      expiresAt,
      createdAt: safeDocData.createdAt || new Date(timestamp).toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('Firestore add document notice (offline/unavailable):', err);
  }
};

/**
 * Delete a document from Firestore
 */
export const deleteDocumentFromFirestore = async (uid: string, docId: string): Promise<void> => {
  if (!uid || !docId) return;
  try {
    const docRef = doc(db, 'users', uid, 'documents', docId);
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

export const getDeviceName = async (): Promise<{ name: string, type: 'mobile' | 'desktop' | 'tablet', browser: string, os: string }> => {
  if (typeof window === 'undefined') {
    return { name: 'Unknown Device', type: 'desktop', browser: 'Browser', os: 'OS' };
  }
  
  const parser = new UAParser();
  const result = parser.getResult();
  
  let deviceName = '';
  
  // 1. Try to get high entropy Client Hints (Modern Chrome/Android)
  const nav = navigator as any;
  if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
    try {
      const hints = await nav.userAgentData.getHighEntropyValues(['model', 'make']);
      if (hints.make && hints.model) {
         deviceName = `${hints.make} ${hints.model}`;
      } else if (hints.model) {
         deviceName = hints.model;
      }
    } catch (e) {}
  }

  // 2. Fallback to UAParser for specific vendor/model
  if (!deviceName) {
    if (result.device.vendor && result.device.model) {
      deviceName = `${result.device.vendor} ${result.device.model}`;
    } else if (result.device.model) {
      deviceName = result.device.model;
    } else if (result.device.vendor) {
      deviceName = `${result.device.vendor} Device`;
    }
  }

  // 3. Fallback to general OS/Device if unknown
  if (!deviceName || deviceName.trim() === '') {
    if (result.os.name === 'iOS') deviceName = 'Apple iOS Device';
    else if (result.os.name === 'Mac OS') deviceName = 'Apple Mac';
    else if (result.os.name === 'Windows') deviceName = 'Windows PC';
    else if (result.os.name === 'Android') deviceName = 'Android Device';
    else if (result.os.name === 'Linux') deviceName = 'Linux PC';
    else deviceName = 'Generic Device';
  }

  let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (result.device.type === 'mobile' || result.device.type === 'tablet') {
    type = result.device.type;
  }

  const browserName = result.browser.name ? result.browser.name : 'Web Browser';
  const osName = result.os.name ? result.os.name : 'OS';

  return {
    name: deviceName,
    type,
    browser: browserName,
    os: osName
  };
};

export const recordUserSession = async (userId: string) => {
  if (!userId || typeof window === 'undefined') return;
  const deviceId = getDeviceId();
  
  try {
    const deviceInfo = await getDeviceName();
    const now = new Date().toISOString();
    const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);

    // Using setDoc with { merge: true } creates or updates without requiring getDoc server roundtrip
    await setDoc(sessionRef, {
      id: deviceId,
      userId,
      deviceName: deviceInfo.name,
      deviceType: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      lastActive: now,
      loginTime: now
    }, { merge: true });
  } catch (e: any) {
    // Silently ignore offline network/cache errors so app execution is never interrupted
    console.warn("Session recording offline notice:", e?.message || e);
  }
};

export const subscribeToUserSessions = (userId: string, callback: (sessions: UserSession[]) => void) => {
  if (!userId) return () => {};
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  return onSnapshot(sessionsRef, (snapshot) => {
    const rawSessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as UserSession);
    const sessions = rawSessions.filter(s => s.revoked !== true);
    const deviceId = getDeviceId();
    const formattedSessions = sessions.map(s => ({
      ...s,
      isCurrentSession: s.id === deviceId
    }));
    formattedSessions.sort((a, b) => {
      if (a.isCurrentSession) return -1;
      if (b.isCurrentSession) return 1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
    callback(formattedSessions);
  });
};


export const monitorCurrentSession = (userId: string, onRevoked: () => void) => {
  if (!userId || typeof window === 'undefined') return () => {};
  const deviceId = getDeviceId();
  const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);
  
  let isInitial = true;
  return onSnapshot(sessionRef, (snapshot) => {
    const data = snapshot.data();
    // Trigger revocation if:
    // 1. The session document is deleted
    // 2. The session document explicitly has a 'revoked' flag set to true
    if (!isInitial && (!snapshot.exists() || data?.revoked === true)) {
      onRevoked();
    }
    isInitial = false;
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
