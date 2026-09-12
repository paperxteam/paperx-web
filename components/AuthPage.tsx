import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Lock, 
  User as UserIcon, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  ShieldAlert,
  Phone
} from 'lucide-react';
import { GlassPillButton } from './GlassPillButton';
import { DeviceLimitModal } from './DeviceLimitModal';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  sendResetOtpCode,
  verifyResetOtpCode,
  completePasswordResetWithToken,
  getUser2FAStatus,
  getAuthErrorMessage,
  isValidEmail,
  getEmailFormatError
} from '../services/firebase';
import { verifyTOTPCode } from '../services/totpService';

interface AuthPageProps {
  mode: 'login' | 'signup' | 'reset';
  onAuthSuccess: () => void;
  onNavigate: (path: string) => void;
}

const GoogleIcon = ({ className = "" }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/**
 * Enhanced Password Strength Meter
 * Evaluates password and displays exact tiers: Weak, Moderate, Strong
 */
export const PasswordStrengthMeter: React.FC<{
  password: string;
  onStrengthChange?: (tier: 'weak' | 'moderate' | 'strong' | '') => void;
}> = ({ password, onStrengthChange }) => {
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

  let tier: 'weak' | 'moderate' | 'strong' | '' = '';
  let level = 0; // 0: empty, 1: weak, 2: moderate, 3: strong

  if (!password) {
    tier = '';
    level = 0;
  } else if (password.length < 6 || (!hasNumbers && !hasSpecial && password.length < 8)) {
    tier = 'weak';
    level = 1;
  } else if (hasMinLength && ((hasLetters && hasNumbers) || (hasUpperAndLower && hasSpecial))) {
    if (password.length >= 9 && hasUpperAndLower && hasNumbers && hasSpecial) {
      tier = 'strong';
      level = 3;
    } else {
      tier = 'moderate';
      level = 2;
    }
  } else {
    tier = 'weak';
    level = 1;
  }

  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(tier);
    }
  }, [tier, onStrengthChange]);

  if (!password) return null;

  return (
    <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
        className="mt-2.5 space-y-2 overflow-hidden"
    >
      {/* 3-Segment Strength Bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div 
            className={`h-full transition-all duration-300 ${
              level >= 1 
                ? level === 1 
                  ? 'bg-red-500' 
                  : level === 2 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500' 
                : 'bg-transparent'
            }`} 
          />
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div 
            className={`h-full transition-all duration-300 ${
              level >= 2 
                ? level === 2 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500' 
                : 'bg-transparent'
            }`} 
          />
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div 
            className={`h-full transition-all duration-300 ${
              level >= 3 ? 'bg-emerald-500' : 'bg-transparent'
            }`} 
          />
        </div>
      </div>

      {/* Label and Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          Password strength:
        </span>
        <span 
          className={`font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px] ${
            tier === 'weak' 
              ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' 
              : tier === 'moderate' 
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' 
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
          }`}
        >
          {tier === 'weak' ? 'Weak' : tier === 'moderate' ? 'Moderate' : 'Strong'}
        </span>
      </div>

      {/* Criteria Checklist Pills */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
        <div className={`flex items-center gap-1 font-medium ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {hasMinLength ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-0.5" />}
          <span>8+ Chars</span>
        </div>
        <div className={`flex items-center gap-1 font-medium ${(hasLetters && hasNumbers) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {(hasLetters && hasNumbers) ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-0.5" />}
          <span>Letters & #</span>
        </div>
        <div className={`flex items-center gap-1 font-medium ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {hasSpecial ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-0.5" />}
          <span>Symbol ($#@)</span>
        </div>
      </div>
    </motion.div>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ mode: initialMode, onAuthSuccess, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);
  
  // Reset Password Flow State:
  // 'main' (for login/signup) | 'forgot-email' (step 1) | 'forgot-code' (step 2) | 'reset-password-form' (step 3) | 'reset-password-success' (step 4) | '2fa-challenge'
  const [viewState, setViewState] = useState<'main' | 'forgot-email' | 'forgot-code' | 'reset-password-form' | 'reset-password-success' | '2fa-challenge'>(
    initialMode === 'reset' ? 'forgot-email' : 'main'
  );
  const [resetSessionToken, setResetSessionToken] = useState<string | null>(null);
  const [passwordTier, setPasswordTier] = useState<'weak' | 'moderate' | 'strong' | ''>('');

  // 2-Step Verification Challenge State
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState<boolean>(false);
  const [twoFactorVerifyState, setTwoFactorVerifyState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [useBackupCodeMode, setUseBackupCodeMode] = useState<boolean>(false);
  const [backupCodeInput, setBackupCodeInput] = useState<string>('');

  const handleAutoVerify2FA = async (code: string) => {
    if (code.length !== 6 || isVerifyingTwoFactor || twoFactorVerifyState === 'checking' || twoFactorVerifyState === 'valid') return;
    setIsVerifyingTwoFactor(true);
    setTwoFactorVerifyState('checking');
    setTwoFactorError(null);

    try {
      const sec = twoFactorSecret || localStorage.getItem('paperx_2fa_secret') || '';
      const isVerified = await verifyTOTPCode(sec, code);
      if (isVerified) {
        setTwoFactorVerifyState('valid');
        setIsVerifyingTwoFactor(false);
        setTimeout(() => {
          onAuthSuccess();
        }, 500);
      } else {
        setTwoFactorVerifyState('invalid');
        setIsVerifyingTwoFactor(false);
        setTwoFactorError('Invalid Authenticator code. Please check your app.');
      }
    } catch (err: any) {
      setTwoFactorVerifyState('invalid');
      setIsVerifyingTwoFactor(false);
      setTwoFactorError(err.message || 'Invalid or expired verification code.');
    }
  };

  useEffect(() => {
    if (initialMode === 'reset') {
      setViewState('forgot-email');
    } else {
      setViewState('main');
    }
    setError(null);
  }, [initialMode]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    resetCode: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [otpVerifyState, setOtpVerifyState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const emailErr = getEmailFormatError(formData.email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    if (initialMode === 'signup' && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (initialMode === 'signup') {
        await registerWithEmail(
          formData.email.trim(),
          formData.password,
          formData.firstName.trim(),
          formData.lastName.trim()
        );
        setIsLoading(false);
        onAuthSuccess();
      } else {
        await loginWithEmail(
          formData.email.trim(),
          formData.password
        );

        // Check if user has 2-Step Verification enabled
        const faStatus = await getUser2FAStatus(formData.email.trim());
        const local2FA = localStorage.getItem('pref_twoStep') === 'true';

        if (faStatus.twoFactorEnabled || local2FA) {
          const secret = faStatus.twoFactorSecret || localStorage.getItem('paperx_2fa_secret') || '';
          const backupCodes = faStatus.twoFactorBackupCodes || [];

          setTwoFactorSecret(secret);
          setTwoFactorBackupCodes(backupCodes);
          setTwoFactorCode('');
          setTwoFactorError(null);
          setUseBackupCodeMode(false);
          setBackupCodeInput('');

          setIsLoading(false);
          setViewState('2fa-challenge');
          return;
        }

        setIsLoading(false);
        onAuthSuccess();
      }
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = getAuthErrorMessage(err, 'email');
      setError(errMsg);
      if (err?.message?.includes('DEVICE_LIMIT_EXCEEDED') || errMsg.includes('Device limit exceeded')) {
        setShowDeviceLimitModal(true);
      }
    }
  };

  // Step 1: Request 6-Digit Code for Email
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = getEmailFormatError(formData.email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOtpVerifyState('idle');
    
    try {
      await sendResetOtpCode(formData.email.trim());
      setIsLoading(false);
      setFormData(prev => ({ ...prev, resetCode: '' }));
      setOtpVerifyState('idle');
      setViewState('forgot-code');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || getAuthErrorMessage(err));
    }
  };

  // Step 2: Verify 6-Digit Code (Sent directly to user email)
  const executeCodeVerification = async (targetCode: string) => {
    const code = targetCode.trim().replace(/\D/g, '');
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      setOtpVerifyState('invalid');
      return;
    }

    setIsLoading(true);
    setOtpVerifyState('checking');
    setError(null);

    try {
      const res = await verifyResetOtpCode(formData.email.trim(), code);
      setIsLoading(false);
      setOtpVerifyState('valid');
      setError(null);
      setResetSessionToken(res.resetSessionToken);
      
      // Keep green outer boundaries visible for clear instant feedback, then transition to set new password
      setTimeout(() => {
        setViewState('reset-password-form');
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setOtpVerifyState('invalid');
      setError(err.message || 'Invalid or expired verification code. Please check your email and try again.');
    }
  };

  const handleVerifyCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || otpVerifyState === 'checking' || otpVerifyState === 'valid') return;
    await executeCodeVerification(formData.resetCode);
  };

  // Step 3: Set New Password with Strength Meter & Server Token
  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!resetSessionToken) {
      setError('Session expired. Please request a new verification code.');
      setViewState('forgot-email');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await completePasswordResetWithToken(
        formData.email.trim(),
        resetSessionToken,
        formData.newPassword
      );
      setIsLoading(false);
      setViewState('reset-password-success');

      setTimeout(() => {
        onNavigate('/login');
      }, 2500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || getAuthErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await loginWithGoogle();
      if (!user) {
        // User closed/cancelled Google sign-in window; keep login page clean & ready
        setIsLoading(false);
        return;
      }
      if (user?.email) {
        const faStatus = await getUser2FAStatus(user.email);
        const local2FA = localStorage.getItem('pref_twoStep') === 'true';
        if (faStatus.twoFactorEnabled || local2FA) {
          const secret = faStatus.twoFactorSecret || localStorage.getItem('paperx_2fa_secret') || '';
          const backupCodes = faStatus.twoFactorBackupCodes || [];

          setTwoFactorSecret(secret);
          setTwoFactorBackupCodes(backupCodes);
          setTwoFactorCode('');
          setTwoFactorError(null);
          setUseBackupCodeMode(false);
          setBackupCodeInput('');

          setIsLoading(false);
          setViewState('2fa-challenge');
          return;
        }
      }
      setIsLoading(false);
      onAuthSuccess();
    } catch (err: any) {
      setIsLoading(false);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('Pending promise was never set') ||
        msg.includes('INTERNAL ASSERTION FAILED')
      ) {
        return;
      }
      const errMsg = getAuthErrorMessage(err, 'google');
      setError(errMsg);
      if (err?.message?.includes('DEVICE_LIMIT_EXCEEDED') || errMsg.includes('Device limit exceeded')) {
        setShowDeviceLimitModal(true);
      }
    }
  };

  // Render 2-Step Verification Challenge (TOTP Authenticator / Backup Code)
  const render2FAChallenge = () => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-200/60 dark:border-gray-800 overflow-hidden relative z-10 mx-auto"
    >
      <div className="p-6 sm:p-8 md:p-10">
        <div className="text-center mb-6">
          <button 
            onClick={() => {
              setViewState('main');
              setError(null);
              setTwoFactorError(null);
            }}
            className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-3 sm:mb-4 cursor-pointer"
          >
            <ArrowLeft size={16} className="mr-1" />
            Cancel & Back to Sign In
          </button>

          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            useBackupCodeMode 
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
              : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
          }`}>
            {useBackupCodeMode ? (
              <KeyRound size={26} />
            ) : (
              <ShieldCheck size={26} />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
            {useBackupCodeMode 
              ? 'Recovery Backup Code' 
              : 'Authenticator Code'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
            {useBackupCodeMode 
              ? 'Enter one of your 8-character backup recovery codes generated when setting up 2FA.'
              : 'Enter the 6-digit verification code from Google Authenticator, Authy, or Apple Passwords.'}
          </p>
        </div>

        {twoFactorError && (
          <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-xs font-medium text-red-600 dark:text-red-400 shadow-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">{twoFactorError}</div>
          </div>
        )}

        {/* Verification Form */}
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setTwoFactorError(null);

            if (useBackupCodeMode) {
              const code = backupCodeInput.trim().toUpperCase();
              if (!code) {
                setTwoFactorError('Please enter a backup recovery code.');
                return;
              }
              const localCodes = JSON.parse(localStorage.getItem('paperx_2fa_backup_codes') || '[]');
              const allBackupCodes = [...twoFactorBackupCodes, ...localCodes];
              const normalizedCode = code.startsWith('PX-') ? code : `PX-${code}`;
              const isValidBackup = allBackupCodes.some(c => c.toUpperCase() === normalizedCode || c.toUpperCase() === code);

              if (!isValidBackup) {
                setTwoFactorError('Invalid backup recovery code.');
                return;
              }
              onAuthSuccess();
              return;
            }

            const code = twoFactorCode.trim().replace(/\D/g, '');
            if (code.length !== 6) {
              setTwoFactorError('Please enter the complete 6-digit code.');
              return;
            }

            setIsVerifyingTwoFactor(true);

            try {
              const sec = twoFactorSecret || localStorage.getItem('paperx_2fa_secret') || '';
              const isVerified = await verifyTOTPCode(sec, code);
              setIsVerifyingTwoFactor(false);
              if (!isVerified) {
                setTwoFactorError('Invalid Authenticator code. Please check your app.');
                return;
              }
              onAuthSuccess();
            } catch (err: any) {
              setIsVerifyingTwoFactor(false);
              setTwoFactorError(err.message || 'Invalid or expired verification code.');
            }
          }} 
          className="space-y-4"
        >
          {useBackupCodeMode ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Backup Recovery Code
              </label>
              <input
                type="text"
                value={backupCodeInput}
                onChange={(e) => {
                  setBackupCodeInput(e.target.value);
                  setTwoFactorError(null);
                }}
                placeholder="PX-1234-5678"
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center font-mono text-base uppercase font-bold tracking-wider text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
              <GlassPillButton 
                type="submit"
                className="w-full mt-4" 
                size="lg"
                disabled={isVerifyingTwoFactor || !backupCodeInput.trim()}
              >
                {isVerifyingTwoFactor ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </span>
                ) : (
                  'Verify Backup Code & Sign In'
                )}
              </GlassPillButton>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                6-Digit Security Code
              </label>

              {/* 6-Box Segmented Code Input */}
              <motion.div 
                animate={twoFactorVerifyState === 'invalid' ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-[320px] mx-auto"
              >
                {Array.from({ length: 6 }).map((_, idx) => {
                  const char = twoFactorCode[idx] || '';
                  const isCurrent = idx === twoFactorCode.length && twoFactorCode.length < 6;
                  const isFilled = Boolean(char);

                  let boxBorderAndBg = '';
                  if (twoFactorVerifyState === 'valid') {
                    boxBorderAndBg = 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/25 shadow-sm shadow-emerald-500/10';
                  } else if (twoFactorVerifyState === 'invalid') {
                    boxBorderAndBg = 'bg-red-50/80 dark:bg-red-950/40 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/25 shadow-sm shadow-red-500/10';
                  } else if (twoFactorVerifyState === 'checking') {
                    boxBorderAndBg = 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/60 dark:border-amber-400/60 text-gray-900 dark:text-white ring-2 ring-amber-500/20';
                  } else if (isFilled) {
                    boxBorderAndBg = 'bg-gray-50 dark:bg-gray-800/80 border-gray-900 dark:border-white text-gray-900 dark:text-white shadow-sm';
                  } else if (isCurrent) {
                    boxBorderAndBg = 'bg-white dark:bg-gray-900 border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10';
                  } else {
                    boxBorderAndBg = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400';
                  }

                  return (
                    <div 
                      key={idx}
                      className={`w-11 h-14 sm:w-12 sm:h-14 rounded-xl border flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 ${boxBorderAndBg}`}
                    >
                      {char || (isCurrent && twoFactorVerifyState === 'idle' ? <span className="w-0.5 h-6 bg-gray-900 dark:bg-white animate-pulse" /> : '')}
                    </div>
                  );
                })}

                {/* Hidden input overlay for full touch & mobile keyboard focus */}
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={twoFactorVerifyState === 'valid' || isVerifyingTwoFactor}
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(val);
                    if (twoFactorVerifyState !== 'idle' && twoFactorVerifyState !== 'checking') {
                      setTwoFactorVerifyState('idle');
                    }
                    setTwoFactorError(null);
                    if (val.length === 6 && twoFactorVerifyState !== 'checking' && twoFactorVerifyState !== 'valid') {
                      handleAutoVerify2FA(val);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </motion.div>

              {/* Status indicator feedback */}
              <div className="min-h-[24px] mt-3 flex items-center justify-center">
                {twoFactorVerifyState === 'valid' && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Code verified! Signing in...
                  </motion.p>
                )}
                {twoFactorVerifyState === 'invalid' && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-red-500 flex items-center gap-1.5"
                  >
                    <ShieldAlert size={15} /> Invalid code. Please try again.
                  </motion.p>
                )}
                {twoFactorVerifyState === 'checking' && (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying 2FA code...</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCodeMode(!useBackupCodeMode);
                setTwoFactorError(null);
              }}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white underline cursor-pointer"
            >
              {useBackupCodeMode ? '← Use 6-digit Authenticator code' : 'Use backup recovery code instead'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  // Render Dedicated Forgot / Reset Password Flow
  const renderForgotFlow = () => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-200/60 dark:border-gray-800 overflow-hidden relative z-10 mx-auto"
    >
        <AnimatePresence mode="wait">
            <motion.div 
                key={viewState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8 md:p-10"
            >
                <div className="text-center mb-6">
                    <button 
                        onClick={() => {
                            if (viewState === 'forgot-code') {
                                setViewState('forgot-email');
                                setOtpVerifyState('idle');
                            } else {
                                onNavigate('/login');
                            }
                            setError(null);
                        }}
                        className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-3 sm:mb-4"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        {viewState === 'forgot-code' ? 'Change Email' : 'Back to Sign In'}
                    </button>

                {/* Step 1: Enter Account Email */}
                {viewState === 'forgot-email' && (
                    <>
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <KeyRound size={26} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Reset Password</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
                            Enter the email address of the account you want to reset, and we will send a 6-digit verification code.
                        </p>
                    </>
                )}

                {/* Step 2: Enter 6-Digit Code */}
                {viewState === 'forgot-code' && (
                    <>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-scale-in">
                            <ShieldCheck size={26} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Check Your Email</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium mb-3">
                            We have sent a 6-digit verification code to <span className="font-bold text-gray-900 dark:text-white">{formData.email}</span>. Please copy the code from your email and paste it below.
                        </p>
                    </>
                )}

                {/* Step 3: Create New Password with Strength Meter */}
                {viewState === 'reset-password-form' && (
                    <>
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Lock size={26} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Create New Password</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
                            Set a strong new password for your PaperX account.
                        </p>
                    </>
                )}

                {/* Step 4: Success Message */}
                {viewState === 'reset-password-success' && (
                    <>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-scale-in">
                            <CheckCircle2 size={24} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">Password Updated!</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            Your password has been reset successfully. Redirecting you to Sign In...
                        </p>
                    </>
                )}
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-sm text-red-600 dark:text-red-400 shadow-sm">
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 animate-pulse" />
                            <div className="flex-1 font-medium leading-relaxed text-xs">{error}</div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {viewState !== 'reset-password-success' && (
                <form onSubmit={
                    viewState === 'forgot-email'
                        ? handleForgotSubmit
                        : viewState === 'forgot-code'
                        ? handleVerifyCodeSubmit
                        : handleConfirmResetSubmit
                } className="space-y-4">
                    {/* Step 1 Input: Email */}
                    {viewState === 'forgot-email' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                    placeholder="your-email@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2 Input: 6-Digit Code */}
                    {viewState === 'forgot-code' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                                    Enter 6-Digit Verification Code
                                </label>
                                
                                {/* 6-Box Segmented Code Input */}
                                <motion.div 
                                    animate={otpVerifyState === 'invalid' ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="relative flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-[320px] mx-auto"
                                >
                                    {Array.from({ length: 6 }).map((_, idx) => {
                                        const char = formData.resetCode[idx] || '';
                                        const isCurrent = idx === formData.resetCode.length && formData.resetCode.length < 6;
                                        const isFilled = Boolean(char);

                                        let boxBorderAndBg = '';
                                        if (otpVerifyState === 'valid') {
                                            boxBorderAndBg = 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/25 shadow-sm shadow-emerald-500/10';
                                        } else if (otpVerifyState === 'invalid') {
                                            boxBorderAndBg = 'bg-red-50/80 dark:bg-red-950/40 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/25 shadow-sm shadow-red-500/10';
                                        } else if (otpVerifyState === 'checking') {
                                            boxBorderAndBg = 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/60 dark:border-amber-400/60 text-gray-900 dark:text-white ring-2 ring-amber-500/20';
                                        } else if (isFilled) {
                                            boxBorderAndBg = 'bg-gray-50 dark:bg-gray-800/80 border-gray-900 dark:border-white text-gray-900 dark:text-white shadow-sm';
                                        } else if (isCurrent) {
                                            boxBorderAndBg = 'bg-white dark:bg-gray-900 border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/10';
                                        } else {
                                            boxBorderAndBg = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400';
                                        }

                                        return (
                                            <div 
                                                key={idx}
                                                className={`w-11 h-14 sm:w-12 sm:h-14 rounded-xl border flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 ${boxBorderAndBg}`}
                                            >
                                                {char || (isCurrent && otpVerifyState === 'idle' ? <span className="w-0.5 h-6 bg-gray-900 dark:bg-white animate-pulse" /> : '')}
                                            </div>
                                        );
                                    })}
                                    {/* Transparent full-cover input overlay to capture typing, mobile keyboards, and clipboard paste */}
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        autoFocus
                                        disabled={otpVerifyState === 'valid' || isLoading}
                                        required
                                        maxLength={6}
                                        value={formData.resetCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setFormData(prev => ({ ...prev, resetCode: val }));
                                            if (otpVerifyState !== 'idle' && otpVerifyState !== 'checking') {
                                                setOtpVerifyState('idle');
                                                setError(null);
                                            }
                                            // Automatically instantly sync and verify upon entering 6 digits
                                            if (val.length === 6 && otpVerifyState !== 'checking' && otpVerifyState !== 'valid') {
                                                executeCodeVerification(val);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer tracking-[1em]"
                                        aria-label="6-digit verification code"
                                    />
                                </motion.div>

                                {/* Instant feedback status under boxes */}
                                <div className="h-6 mt-2 flex items-center justify-center">
                                    {otpVerifyState === 'valid' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 size={14} className="text-emerald-500" />
                                            <span>Code verified successfully!</span>
                                        </motion.div>
                                    )}
                                    {otpVerifyState === 'invalid' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400"
                                        >
                                            <ShieldAlert size={14} className="text-red-500" />
                                            <span>Invalid verification code</span>
                                        </motion.div>
                                    )}
                                    {otpVerifyState === 'checking' && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            <Loader2 size={13} className="animate-spin text-[#FF671F]" />
                                            <span>Verifying code...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs pt-1 px-1">
                                <span className="text-gray-400 dark:text-gray-500 font-medium">Expires in 15 mins</span>
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={handleForgotSubmit}
                                    className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white inline-flex items-center gap-1 font-bold transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={12} /> Resend Code
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 3 Inputs: New Password + Strength Meter + Confirm Password */}
                    {viewState === 'reset-password-form' && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                        placeholder="••••••••"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {/* Real-time Password Strength Meter: Weak, Moderate, Strong */}
                                <PasswordStrengthMeter 
                                  password={formData.newPassword} 
                                  onStrengthChange={setPasswordTier} 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Confirm New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                        placeholder="••••••••"
                                        value={formData.confirmNewPassword}
                                        onChange={(e) => setFormData({...formData, confirmNewPassword: e.target.value})}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {formData.confirmNewPassword && formData.newPassword !== formData.confirmNewPassword && (
                                    <p className="text-[11px] text-red-500 font-semibold mt-1 ml-1 flex items-center gap-1">
                                        <ShieldAlert size={12} /> Passwords do not match
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {viewState !== 'forgot-code' && (
                        <GlassPillButton 
                            type="submit"
                            className="w-full mt-4" 
                            size="lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>
                                        {viewState === 'forgot-email' ? 'Generating 6-Digit Code...' : 'Updating Password...'}
                                    </span>
                                </span>
                            ) : (
                                viewState === 'forgot-email' ? 'Send 6-Digit Code' : 'Save New Password'
                            )}
                        </GlassPillButton>
                    )}
                </form>
            )}

            {viewState === 'reset-password-success' && (
                <div className="pt-2">
                    <GlassPillButton 
                        type="button"
                        onClick={() => onNavigate('/login')}
                        className="w-full"
                        size="lg"
                    >
                        Sign In Now
                    </GlassPillButton>
                </div>
            )}
            </motion.div>
        </AnimatePresence>
    </motion.div>
  );

  if (viewState === '2fa-challenge') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 relative py-8">
            {render2FAChallenge()}
        </div>
      );
  }

  if (viewState !== 'main') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 relative py-8">
            {renderForgotFlow()}
        </div>
      );
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 relative py-8"
    >
        
        <div className="w-full max-w-[440px] bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-200/60 dark:border-gray-800 overflow-hidden relative z-10">
            <div className="p-6 sm:p-8 md:p-10">
                <div className="text-center mb-6 sm:mb-8">
                     <button 
                        onClick={() => onNavigate('/')}
                        className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-3 sm:mb-4"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Home
                    </button>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                        {initialMode === 'login' ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
                        {initialMode === 'login' 
                            ? 'Enter your details to access your workspace.' 
                            : 'Start your 5 free trials. No credit card required.'}
                    </p>
                </div>

                <div className="space-y-4">
                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={19} className="animate-spin" /> : <GoogleIcon />}
                        <span>{initialMode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-sm text-red-600 dark:text-red-400 shadow-sm">
                                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0 animate-pulse" />
                                    <div className="flex-1 font-medium leading-relaxed">{error}</div>
                                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {initialMode === 'signup' && (
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-fade-in-up">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">First Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <UserIcon size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                            placeholder="Paper"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Last Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <UserIcon size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                            placeholder="X"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                    placeholder="paperx@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                {initialMode === 'login' && (
                                    <button 
                                        type="button" 
                                        onClick={() => onNavigate('/forgot-password')}
                                        className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock size={16} className="text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            
                            {initialMode === 'signup' && (
                                <PasswordStrengthMeter 
                                  password={formData.password} 
                                  onStrengthChange={setPasswordTier} 
                                />
                            )}
                        </div>

                        <GlassPillButton 
                            type="submit"
                            className="w-full mt-2 text-sm sm:text-base font-bold py-3.5" 
                            size="lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={19} className="animate-spin" />
                                    <span>Processing...</span>
                                </span>
                            ) : (
                                initialMode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </GlassPillButton>
                    </form>
                </div>
            </div>
            
            <div className="px-6 sm:px-8 py-4 sm:py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {initialMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        onClick={() => onNavigate(initialMode === 'login' ? '/signup' : '/login')}
                        className="font-bold text-black dark:text-white hover:underline transition-all ml-1"
                    >
                        {initialMode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>

        {/* Dedicated High-Visibility Device Limit Modal */}
        <DeviceLimitModal 
          isOpen={showDeviceLimitModal} 
          onClose={() => setShowDeviceLimitModal(false)} 
          email={formData.email} 
        />
    </motion.div>
  );
};
