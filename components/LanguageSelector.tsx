import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppTranslation, normalizeLanguage } from '../translations';

export const SUPPORTED_LANGUAGES = [
  { code: 'English', short: 'EN', label: 'English (US)', native: 'English' },
  { code: 'Spanish', short: 'ES', label: 'Español', native: 'Español' },
  { code: 'French', short: 'FR', label: 'Français', native: 'Français' },
  { code: 'German', short: 'DE', label: 'Deutsch', native: 'Deutsch' },
  { code: 'Hindi', short: 'HI', label: 'हिंदी', native: 'हिंदी' },
  { code: 'Japanese', short: 'JA', label: '日本語', native: '日本語' },
  { code: 'Chinese', short: 'ZH', label: '中文', native: '中文' },
  { code: 'Portuguese', short: 'PT', label: 'Português', native: 'Português' },
  { code: 'Russian', short: 'RU', label: 'Русский', native: 'Русский' },
  { code: 'Korean', short: 'KO', label: '한국어', native: '한국어' },
  { code: 'Italian', short: 'IT', label: 'Italiano', native: 'Italiano' },
  { code: 'Arabic', short: 'AR', label: 'العربية', native: 'العربية' },
  { code: 'Marathi', short: 'MR', label: 'मराठी', native: 'मराठी' },
  { code: 'Telugu', short: 'TE', label: 'తెలుగు', native: 'తెలుగు' },
  { code: 'Tamil', short: 'TA', label: 'தமிழ்', native: 'தமிழ்' },
  { code: 'Gujarati', short: 'GU', label: 'ગુજરાતી', native: 'ગુજરાતી' },
  { code: 'Urdu', short: 'UR', label: 'اردو', native: 'اردو' }
];

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'select';
  className?: string;
  onSelectLanguage?: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
  onSelectLanguage
}) => {
  const { currentLanguage, changeLanguage } = useAppTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeNormalized = normalizeLanguage(currentLanguage);
  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === activeNormalized) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (langCode: string) => {
    changeLanguage(langCode);
    if (onSelectLanguage) {
      onSelectLanguage(langCode);
    }
    setIsOpen(false);
  };

  if (variant === 'select') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={activeNormalized}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full py-3 pl-4 pr-10 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer appearance-none transition-all shadow-xs"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              {l.native} ({l.code})
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'compact' ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700/80 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs select-none"
          title="Change Application Language"
        >
          <Globe size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{activeLangObj.native}</span>
          <ChevronDown size={12} className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:border-black dark:hover:border-white transition-all cursor-pointer shadow-xs select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{activeLangObj.native} ({activeLangObj.code})</span>
          </div>
          <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      )}

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto z-50 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-2 no-scrollbar backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800/80 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">Select Language ({SUPPORTED_LANGUAGES.length})</span>
              <Globe size={13} className="text-stone-400" />
            </div>

            <div className="grid grid-cols-1 gap-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = activeNormalized === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-heading truncate">{lang.native}</span>
                      <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-stone-400'}`}>({lang.label})</span>
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
