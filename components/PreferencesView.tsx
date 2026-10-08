import React from 'react';
import { 
  SlidersHorizontal, Tag, Camera, Minimize2, Moon, Sun, 
  Type, Eye, Languages, Bell, KeyRound, Lock, Trash2, RotateCcw, 
  RefreshCw, ChevronRight, ChevronDown, Check, Clock, LogOut, 
  Info, Sparkles, Smartphone, Laptop, Tablet, Monitor, ShieldCheck, FileText
} from 'lucide-react';
import { User, UserSession } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { AnimatedDeviceIcon } from './AnimatedDeviceIcon';
import { safeStorage } from '../src/utils/safeStorage';
import { updateUserInFirestore } from '../services/firebase';
import { getSampleFormattedFileName } from '../lib/namingUtils';

export interface PreferencesViewProps {
  user: User | null;
  // Security & Sessions
  loginAlerts: boolean;
  setLoginAlerts: (v: boolean) => void;
  twoStepEnabled: boolean;
  setTwoStepEnabled: (v: boolean) => void;
  autoRestoreSession: boolean;
  setAutoRestoreSession: (v: boolean) => void;
  activeSessions: UserSession[];
  setShowLogoutAllModal: (v: boolean) => void;
  removeUserSession: (uid: string, id: string) => Promise<void>;
  formatLoginDate: (time: any, tz?: string) => string;
  formatLastActive: (time: any, short?: boolean, tz?: string) => string;
  generateTotpSecretForEnrollment: () => Promise<any>;
  setFaSecret: (s: string) => void;
  setTotpEnrollObj: (o: any) => void;
  setShow2FAModal: (v: boolean) => void;
  setFaStep: (step: number) => void;
  generateBase32Secret: () => string;
  unenrollTotpFactor: () => Promise<void>;
  
  // Document & PDF Studio
  pdfQuality: 'high' | 'standard' | 'compact';
  setPdfQuality: (v: 'high' | 'standard' | 'compact') => void;
  namingPattern: string;
  setNamingPattern: (v: string) => void;
  autoSaveScan: boolean;
  setAutoSaveScan: (v: boolean) => void;
  pdfAutoCompress: boolean;
  setPdfAutoCompress: (v: boolean) => void;
  
  // Appearance & Display
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  fontSize: 'system' | 'small' | 'medium' | 'large';
  handleSetFontSize: (size: 'system' | 'small' | 'medium' | 'large') => void;
  largerText: boolean;
  setLargerText: (v: boolean) => void;

  // Storage & Maintenance
  isClearingCache: boolean;
  handleClearCacheInBackground: () => void;
  cacheClearedSuccess: boolean;
  handleResetPreferences: () => void;
  resetPreferencesSuccess: boolean;

  // App Info & Legal
  isCheckingUpdate: boolean;
  handleCheckUpdate: () => void;
  navigateTo: (tab: any) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  user,
  loginAlerts,
  setLoginAlerts,
  twoStepEnabled,
  setTwoStepEnabled,
  autoRestoreSession,
  setAutoRestoreSession,
  activeSessions,
  setShowLogoutAllModal,
  removeUserSession,
  formatLoginDate,
  formatLastActive,
  generateTotpSecretForEnrollment,
  setFaSecret,
  setTotpEnrollObj,
  setShow2FAModal,
  setFaStep,
  generateBase32Secret,
  unenrollTotpFactor,
  pdfQuality,
  setPdfQuality,
  namingPattern,
  setNamingPattern,
  autoSaveScan,
  setAutoSaveScan,
  pdfAutoCompress,
  setPdfAutoCompress,
  darkMode,
  setDarkMode,
  fontSize,
  handleSetFontSize,
  largerText,
  setLargerText,
  isClearingCache,
  handleClearCacheInBackground,
  cacheClearedSuccess,
  handleResetPreferences,
  resetPreferencesSuccess,
  isCheckingUpdate,
  handleCheckUpdate,
  navigateTo,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* 1. Document & PDF Studio */}
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            Document & PDF Studio
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2.5">

          {/* PDF Quality */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <SlidersHorizontal size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight">PDF & Document Quality</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5">Default output resolution and rendering fidelity</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/90 dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800">
              {[
                { id: 'high', label: 'High', dpi: '300 DPI' },
                { id: 'standard', label: 'Standard', dpi: '150 DPI' },
                { id: 'compact', label: 'Compact', dpi: '96 DPI' },
              ].map(q => {
                const isActive = pdfQuality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      const qualityVal = q.id as 'high' | 'standard' | 'compact';
                      setPdfQuality(qualityVal);
                      if (user?.uid) updateUserInFirestore(user.uid, { pdfQuality: qualityVal });
                    }}
                    title={`${q.label} - ${q.dpi}`}
                    className={`relative py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                      isActive 
                        ? 'bg-white dark:bg-[#2d333b] text-stone-950 dark:text-white font-black shadow-xs' 
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{q.label}</span>
                    <span className={`text-[10px] font-mono font-normal ${isActive ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-500'}`}>
                      {q.dpi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default File Naming */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Tag size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight">Default File Naming</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5">Automatic naming pattern for exported documents</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <select
                  value={namingPattern}
                  onChange={(e) => {
                    const newPat = e.target.value;
                    setNamingPattern(newPat);
                    if (user?.uid) updateUserInFirestore(user.uid, { namingPattern: newPat });
                  }}
                  className="w-full h-11 py-2.5 pl-3.5 pr-10 bg-stone-50 dark:bg-[#151b23] border border-stone-200 dark:border-[#30363d] rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer appearance-none shadow-xs"
                >
                  <option value="simple">Simple (e.g. Scan 1.pdf)</option>
                  <option value="original">Original Name (e.g. Invoice_Processed.pdf)</option>
                  <option value="date">Date Stamp (e.g. Scan_20-09-2026.pdf)</option>
                  <option value="paperx">PaperX Prefix (e.g. PaperX_Scan_1.pdf)</option>
                  <option value="timestamp">Timestamp (e.g. Scan_1726837200000.pdf)</option>
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-[#151b23] border border-stone-200/60 dark:border-white/[0.05] rounded-xl text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                <Sparkles size={13} className="shrink-0 text-amber-500" />
                <span className="truncate">Sample Output: <strong className="text-stone-900 dark:text-stone-100 font-semibold">{getSampleFormattedFileName(namingPattern)}</strong></span>
              </div>
            </div>
          </div>

          {/* Auto-Save Scanned Files */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Camera size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Auto-Save Scanned Files</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Save camera and document scans directly to library</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoSaveScan}
              aria-label="Toggle auto save scans"
              onClick={() => {
                const newValue = !autoSaveScan;
                setAutoSaveScan(newValue);
                if (user?.uid) updateUserInFirestore(user.uid, { autoSaveScan: newValue });
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                autoSaveScan ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  autoSaveScan ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {autoSaveScan && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          {/* Auto-Compress Output */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Minimize2 size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Auto-Compress Output</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Automatically optimize generated PDFs for reduced file size</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pdfAutoCompress}
              aria-label="Toggle auto compress output"
              onClick={() => {
                const newValue = !pdfAutoCompress;
                setPdfAutoCompress(newValue);
                if (user?.uid) updateUserInFirestore(user.uid, { pdfAutoCompress: newValue });
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                pdfAutoCompress ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  pdfAutoCompress ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {pdfAutoCompress && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Appearance & Display */}
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            Appearance & Display
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
          
          {/* Dark Mode */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                {darkMode ? <Moon size={18} strokeWidth={2.2} /> : <Sun size={18} strokeWidth={2.2} />}
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Dark Mode</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Switch between crisp light and deep dark themes</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
              onClick={() => {
                const newValue = !darkMode;
                setDarkMode(newValue);
                safeStorage.setItem('pref_darkMode', String(newValue));
                if (newValue) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { darkMode: newValue } }));
                if (user?.uid) {
                  updateUserInFirestore(user.uid, {
                    theme: newValue ? 'dark' : 'light',
                    darkMode: newValue
                  });
                }
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                darkMode ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  darkMode ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {darkMode && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Type size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight">App Font Size</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5">Scale interface reading and typography</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/90 dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800">
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
                    onClick={() => handleSetFontSize(size)}
                    title={size === 'system' ? 'Device Default (Auto-scales per screen resolution)' : `${labels[size]} Font Size`}
                    className={`relative py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      isActive 
                        ? 'bg-white dark:bg-[#2d333b] text-stone-950 dark:text-white font-black shadow-xs' 
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {labels[size]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Legibility */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Eye size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Enhanced Legibility</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">High contrast & optimized glyph spacing</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={largerText}
              aria-label="Toggle accessibility font"
              onClick={() => {
                const newValue = !largerText;
                setLargerText(newValue);
                safeStorage.setItem('pref_largerText', String(newValue));
                document.documentElement.setAttribute('data-larger-text', String(newValue));
                window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { largerText: newValue } }));
                if (user?.uid) updateUserInFirestore(user.uid, { largerTextEnabled: newValue });
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                largerText ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  largerText ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {largerText && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* 3. Language & Regional */}
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            Language & Regional
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs">
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Languages size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight">App Language</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5">Select your preferred user interface locale</p>
              </div>
            </div>
            <div className="relative">
              <LanguageSelector 
                variant="select" 
                onSelectLanguage={(langCode) => {
                  if (user?.uid) {
                    updateUserInFirestore(user.uid, { language: langCode }).catch(console.warn);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Security & Sessions */}
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            Security & Sessions
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
          
          {/* Login Alerts */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Bell size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Login Alerts</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Notify me on new device sign-ins</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={loginAlerts}
              aria-label="Toggle login alerts"
              onClick={() => {
                const newValue = !loginAlerts;
                setLoginAlerts(newValue);
                safeStorage.setItem('pref_loginAlerts', String(newValue));
                window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { loginAlerts: newValue } }));
                if (user?.uid) {
                  updateUserInFirestore(user.uid, { loginAlertsEnabled: newValue });
                }
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                loginAlerts ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  loginAlerts ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {loginAlerts && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          {/* Two-Step Verification (2FA) */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <KeyRound size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight">Two-Step Verification</p>
                  {twoStepEnabled && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500 text-white rounded-full uppercase tracking-wider">Active</span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Protect account logins with TOTP Authenticator Apps</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={twoStepEnabled}
              aria-label="Toggle two step verification"
              onClick={async () => {
                if (!twoStepEnabled) {
                  try {
                    const res = await generateTotpSecretForEnrollment();
                    setFaSecret(res.secret);
                    setTotpEnrollObj(res.totpSecretObj);
                    setShow2FAModal(true);
                    setFaStep(1);
                  } catch (e) {
                    const sec = generateBase32Secret();
                    setFaSecret(sec);
                    setTotpEnrollObj(null);
                    setShow2FAModal(true);
                    setFaStep(1);
                  }
                } else {
                  try {
                    await unenrollTotpFactor();
                  } catch (e) {}
                  setTwoStepEnabled(false);
                  localStorage.setItem('pref_twoStep', 'false');
                  window.dispatchEvent(new CustomEvent('paperx_preferences_changed', { detail: { twoStepEnabled: false } }));
                  if (user?.uid) {
                    updateUserInFirestore(user.uid, {
                      twoFactorEnabled: false
                    });
                  }
                }
              }}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                twoStepEnabled ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  twoStepEnabled ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {twoStepEnabled && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          {/* Auto-Restore Session */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Lock size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Auto-Restore Session</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Keep your workspace securely logged in across launches</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoRestoreSession}
              aria-label="Toggle auto restore session"
              onClick={() => setAutoRestoreSession(!autoRestoreSession)}
              className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white cursor-pointer shrink-0 ${
                autoRestoreSession ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-transform duration-200 ${
                  autoRestoreSession ? 'translate-x-5 bg-white dark:bg-stone-900 text-stone-900 dark:text-white' : 'translate-x-0 bg-white dark:bg-stone-400'
                }`}
              >
                {autoRestoreSession && <Check size={10} strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          {/* Active Devices & Sessions */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight flex items-center gap-2">
                  Active Devices & Sessions
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {activeSessions.length} {activeSessions.length === 1 ? 'device' : 'devices'}
                  </span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                  Real-time authorized hardware & browsers signed in to your account.
                </p>
              </div>
              {activeSessions.filter(s => !s.isCurrentSession).length > 0 && (
                <button 
                  onClick={() => setShowLogoutAllModal(true)}
                  className="text-xs text-red-500 hover:text-red-600 font-bold cursor-pointer shrink-0 transition-colors"
                >
                  Log out others
                </button>
              )}
            </div>

            <div className="space-y-2">
              {activeSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                    session.isCurrentSession 
                      ? 'bg-stone-50/90 dark:bg-[#151b23] border-stone-300/80 dark:border-[#30363d]' 
                      : 'bg-white/80 dark:bg-[#1c222b] border-stone-200/60 dark:border-white/[0.05]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      session.isCurrentSession 
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-black shadow-xs' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-white/[0.08]'
                    }`}>
                      {session.deviceType === 'mobile' ? (
                        <Smartphone size={20} strokeWidth={2} />
                      ) : session.deviceType === 'tablet' ? (
                        <Tablet size={20} strokeWidth={2} />
                      ) : session.deviceType === 'laptop' ? (
                        <Laptop size={20} strokeWidth={2} />
                      ) : (
                        <Monitor size={20} strokeWidth={2} />
                      )}
                    </div>
                    {session.isCurrentSession && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center" title="Active on this device">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-white dark:ring-[#151b23]" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-stone-900 dark:text-white shrink-0">
                        {(() => {
                          const raw = session.deviceName || '';
                          const cleaned = raw.replace(/android/gi, '').replace(/^[()\s\-_]+|[()\s\-_]+$/g, '').trim();
                          if (!cleaned) {
                            return session.deviceType === 'mobile' ? 'Smartphone' : session.deviceType === 'tablet' ? 'Tablet' : session.deviceType === 'laptop' ? 'Laptop' : 'Current Device';
                          }
                          return cleaned;
                        })()}
                      </p>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60">
                        {session.deviceType}
                      </span>
                      {session.isCurrentSession && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                          <Check size={10} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>This Device</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {(session.browser || 'Web Browser').replace(/android/gi, 'Mobile').trim()} • {(session.os || 'OS').replace(/android/gi, 'Mobile OS').trim()}
                      {session.location && ` • ${session.location}`}
                      {session.ipAddress && ` (${session.ipAddress})`}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                      <span className="inline-flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400">
                        <Clock size={10} className="shrink-0 text-stone-400" />
                        Logged in: {formatLoginDate(session.loginTime || session.lastActive, session.timeZone)}
                      </span>
                      <span>•</span>
                      <span className={session.isCurrentSession ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                        {session.isCurrentSession ? (
                          <span className="inline-flex items-center gap-1.5 shrink-0 align-middle">
                            <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span>Active now</span>
                          </span>
                        ) : (
                          `Last active: ${formatLastActive(session.lastActive, false, session.timeZone)}`
                        )}
                      </span>
                    </div>
                  </div>
                  {!session.isCurrentSession && (
                    <button
                      onClick={async () => {
                        if (user?.uid) {
                          await removeUserSession(user.uid, session.id);
                        }
                      }}
                      title="Revoke session"
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 5. Storage & Maintenance */}
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            Storage & Maintenance
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2.5">

          {/* Clear Temporary Cache */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Trash2 size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Clear Temporary Cache</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Release local draft memory & preview buffers</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isClearingCache}
              onClick={handleClearCacheInBackground}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 border shrink-0 ${
                cacheClearedSuccess
                  ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white border-stone-200 dark:border-stone-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isClearingCache ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : cacheClearedSuccess ? (
                <>
                  <Check size={13} strokeWidth={3} />
                  <span>Cleared</span>
                </>
              ) : (
                <span>Clear Cache</span>
              )}
            </button>
          </div>

          {/* Reset All Preferences */}
          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#1c222b] rounded-2xl border border-stone-200/70 dark:border-white/[0.06] shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <RotateCcw size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Reset Preferences to Default</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">Restore standard defaults for PDF, theme & language</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetPreferences}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 border shrink-0 ${
                resetPreferencesSuccess
                  ? 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                  : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white border-stone-200 dark:border-stone-700'
              }`}
            >
              {resetPreferencesSuccess ? (
                <>
                  <Check size={13} strokeWidth={3} />
                  <span>Reset Complete</span>
                </>
              ) : (
                <span>Reset Defaults</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* 6. App Info & Legal */}
      <div className="pb-2">
        <div className="flex items-center gap-2.5 px-1 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-stone-900 dark:bg-stone-100" />
          <h3 className="text-xs font-black tracking-wider text-stone-500 dark:text-stone-400 uppercase font-heading">
            App Info & Legal
          </h3>
        </div>
        <div className="bg-stone-50/60 dark:bg-[#151b23]/90 border border-stone-200/80 dark:border-white/[0.08] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-2">
          
          <button
            type="button"
            disabled={isCheckingUpdate}
            onClick={handleCheckUpdate}
            className="w-full p-3.5 bg-white dark:bg-[#1c222b] hover:bg-stone-50 dark:hover:bg-[#222834] border border-stone-200/70 dark:border-white/[0.06] rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs disabled:opacity-80 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <RefreshCw size={18} strokeWidth={2.2} className={isCheckingUpdate ? 'animate-spin' : ''} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">
                  {isCheckingUpdate ? 'Checking for Updates...' : 'Check for Updates'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate">
                  {isCheckingUpdate ? 'Connecting to update server...' : 'PaperX v2.4.0 (Latest Production Build)'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('about')}
            className="w-full p-3.5 bg-white dark:bg-[#1c222b] hover:bg-stone-50 dark:hover:bg-[#222834] border border-stone-200/70 dark:border-white/[0.06] rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <Info size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">About PaperX</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate">Version specs, architecture & team details</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('terms')}
            className="w-full p-3.5 bg-white dark:bg-[#1c222b] hover:bg-stone-50 dark:hover:bg-[#222834] border border-stone-200/70 dark:border-white/[0.06] rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Terms of Service</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate">Platform usage rules and service terms</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('privacy')}
            className="w-full p-3.5 bg-white dark:bg-[#1c222b] hover:bg-stone-50 dark:hover:bg-[#222834] border border-stone-200/70 dark:border-white/[0.06] rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck size={18} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-stone-900 dark:text-white text-sm tracking-tight leading-tight truncate">Privacy Policy</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5 truncate">End-to-end data encryption and zero-inspection guarantee</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

        </div>
      </div>

    </div>
  );
};
