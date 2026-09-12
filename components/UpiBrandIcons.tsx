import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';

export interface UpiAppIconsStripProps {
  upiUri?: string;
  vpa?: string;
  payeeName?: string;
  amount?: string;
  orderId?: string;
  membershipName?: string;
  billingCycle?: string;
  onAppClick?: (appName: string) => void;
}

interface UpiBrandItem {
  id: 'gpay' | 'phonepe' | 'paytm' | 'upi';
  name: string;
  logoSrc: string;
  heightClass: string;
  androidPackage: string;
  iosSchemePrefix: string;
}

const OFFICIAL_UPI_APPS: UpiBrandItem[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    logoSrc: '/icons/gpay-clean.svg',
    heightClass: 'h-3.5 sm:h-4',
    androidPackage: 'com.google.android.apps.nbu.paisa.user',
    iosSchemePrefix: 'tez://upi/pay',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    logoSrc: '/icons/phonepe-clean.svg',
    heightClass: 'h-3.5 sm:h-4',
    androidPackage: 'com.phonepe.app',
    iosSchemePrefix: 'phonepe://pay',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    logoSrc: '/icons/paytm-clean.svg',
    heightClass: 'h-3 sm:h-3.5',
    androidPackage: 'net.one97.paytm',
    iosSchemePrefix: 'paytmmp://pay',
  },
  {
    id: 'upi',
    name: 'BHIM UPI',
    logoSrc: '/icons/upi-clean.svg',
    heightClass: 'h-3.5 sm:h-4',
    androidPackage: 'in.org.npci.upiapp',
    iosSchemePrefix: 'upi://pay',
  },
];

export const UpiAppIconsStrip: React.FC<UpiAppIconsStripProps> = ({
  upiUri,
  vpa,
  payeeName = 'PaperX Cloud',
  amount,
  orderId,
  membershipName = 'PaperX Plus Plan',
  billingCycle = '1 Year',
  onAppClick,
}) => {
  const [activeRedirectApp, setActiveRedirectApp] = useState<string | null>(null);

  // Extract from fallback upiUri if individual parameters aren't provided
  const queryParams = React.useMemo(() => {
    let resolvedVpa = vpa || '';
    let resolvedAmount = amount || '';
    let resolvedOrderId = orderId || '';
    let resolvedNote = `${membershipName} ${billingCycle} ${resolvedOrderId}`.trim();
    let resolvedPayee = payeeName;

    if (upiUri && (!resolvedVpa || !resolvedAmount || !resolvedOrderId)) {
      try {
        const queryPart = upiUri.includes('?') ? upiUri.split('?')[1] : upiUri;
        const parsed = new URLSearchParams(queryPart);
        if (!resolvedVpa) resolvedVpa = parsed.get('pa') || '';
        if (!resolvedAmount) resolvedAmount = parsed.get('am') || '';
        if (!resolvedOrderId) resolvedOrderId = parsed.get('tr') || '';
        if (!resolvedNote) resolvedNote = parsed.get('tn') || resolvedNote;
        if (!resolvedPayee) resolvedPayee = parsed.get('pn') || 'PaperX Cloud';
      } catch {
        // Safe fallback
      }
    }

    const note = `${membershipName} ${billingCycle} ${resolvedOrderId}`.trim();
    return {
      vpa: resolvedVpa,
      amount: resolvedAmount,
      orderId: resolvedOrderId,
      note,
      payee: resolvedPayee,
    };
  }, [upiUri, vpa, amount, orderId, membershipName, billingCycle, payeeName]);

  // Generate target intent/scheme for a specific UPI app
  const getAppLinks = (app: UpiBrandItem) => {
    const { vpa, amount, orderId, note, payee } = queryParams;
    const query = `pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payee)}&am=${encodeURIComponent(amount)}&cu=INR&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(note)}`;
    const genericUpiUri = `upi://pay?${query}`;

    if (app.id === 'upi') {
      return { primaryUri: genericUpiUri, fallbackUri: genericUpiUri };
    }

    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /(ipad|iphone|ipod)/i.test(navigator.userAgent);

    if (isAndroid) {
      // Direct Android package intent — opens the exact selected app to payment screen with amount, order ID, note
      const androidIntent = `intent://pay?${query}#Intent;scheme=upi;package=${app.androidPackage};end`;
      return { primaryUri: androidIntent, fallbackUri: genericUpiUri };
    }

    if (isIOS) {
      // iOS custom scheme for supported apps
      const iosUri = `${app.iosSchemePrefix}?${query}`;
      return { primaryUri: iosUri, fallbackUri: genericUpiUri };
    }

    // Desktop / Fallback scheme
    const desktopScheme = app.iosSchemePrefix !== 'upi://pay'
      ? `${app.iosSchemePrefix}?${query}`
      : genericUpiUri;

    return { primaryUri: desktopScheme, fallbackUri: genericUpiUri };
  };

  const handleAppClick = (e: React.MouseEvent<HTMLAnchorElement>, app: UpiBrandItem) => {
    e.preventDefault();
    const { primaryUri, fallbackUri } = getAppLinks(app);

    if (onAppClick) {
      onAppClick(app.name);
    }

    setActiveRedirectApp(app.name);
    setTimeout(() => setActiveRedirectApp(null), 4000);

    const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isMobile) {
      // Trigger navigation immediately
      window.location.href = primaryUri;

      // If the selected app is not installed, fallback to generic UPI chooser after brief delay
      if (app.id !== 'upi') {
        const startTime = Date.now();
        setTimeout(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'visible' && Date.now() - startTime < 2500) {
            window.location.href = fallbackUri;
          }
        }, 1200);
      }
    } else {
      // Desktop: just try opening the link (might show a "choose app" prompt or fail silently)
      window.location.href = primaryUri;
    }
  };

  return (
    <div className="w-full mt-2.5 pt-2 border-t border-stone-200/80 dark:border-stone-700/60 flex flex-col items-center">
      {/* Header bar */}
      <div className="flex items-center justify-between w-full max-w-[320px] px-1 mb-1.5 text-stone-500 dark:text-stone-400">
        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-stone-600 dark:text-stone-300 flex items-center gap-1">
          <ShieldCheck size={11} className="text-emerald-500" />
          <span>Pay with any UPI App</span>
        </span>
        <span className="text-[8.5px] sm:text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
          Instant Pre-fill
        </span>
      </div>

      {/* Authentic Brand Badges Grid (Clicking directly opens the selected app with amount, order ID, and membership pre-filled) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-[320px]">
        {OFFICIAL_UPI_APPS.map((app) => {
          const { primaryUri } = getAppLinks(app);
          const isSelected = activeRedirectApp === app.name;

          return (
            <a
              key={app.id}
              href={primaryUri}
              onClick={(e) => handleAppClick(e, app)}
              className={`h-8 sm:h-8.5 px-2 rounded-xl bg-white border transition-all flex items-center justify-center cursor-pointer group shadow-2xs ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 bg-amber-50/50 dark:bg-stone-800'
                  : 'border-stone-200/90 hover:scale-[1.04] hover:shadow-xs hover:border-amber-500/60 active:scale-95'
              }`}
              title={`Pay ₹${queryParams.amount} with ${app.name} (${queryParams.orderId})`}
              aria-label={`Pay ₹${queryParams.amount} with ${app.name}`}
            >
              <img
                src={app.logoSrc}
                alt={app.name}
                className={`${app.heightClass} w-auto max-w-full object-contain transition-transform group-hover:scale-105 select-none pointer-events-none`}
                loading="eager"
              />
            </a>
          );
        })}
      </div>

      {/* Instant redirection status feedback */}
      {activeRedirectApp && (
        <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-[9px] sm:text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 animate-fadeIn max-w-[320px] text-center justify-center">
          <CheckCircle2 size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">
            Opening <strong>{activeRedirectApp}</strong> with <strong>₹{queryParams.amount}</strong> &amp; <strong>{queryParams.orderId}</strong>
          </span>
          <ArrowUpRight size={10} className="shrink-0 opacity-70" />
        </div>
      )}
    </div>
  );
};
