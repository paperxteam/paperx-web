// src/utils/profanityFilter.ts

export const ONE_HOUR_BAN_MS = 60 * 60 * 1000; // 1 hour in milliseconds
export const MAX_WARNINGS_BEFORE_PERMANENT_BAN = 3;

const ABUSIVE_PATTERNS = [
  // English profanities and insults
  /\b(f+u+c+k+|f+u+k+|f+u+q+|f+c+k+|f+u+x+|f+u+c+k+i+n+g+|f+u+c+k+e+r+)\b/i,
  /\b(b+i+t+c+h+|b+i+a+t+c+h+|b+i+t+c+h+e+s+)\b/i,
  /\b(b+a+s+t+a+r+d+|b+a+s+t+a+r+d+s+)\b/i,
  /\b(a+s+s+h+o+l+e+|a+s+s+h+o+l+|a+r+s+e+h+o+l+e+)\b/i,
  /\b(c+u+n+t+|c+u+n+t+s+)\b/i,
  /\b(d+i+c+k+|d+i+c+k+h+e+a+d+|d+i+c+k+s+)\b/i,
  /\b(p+u+s+s+y+|p+u+s+s+i+e+s+)\b/i,
  /\b(s+l+u+t+|s+l+u+t+s+|w+h+o+r+e+|w+h+o+r+e+s+)\b/i,
  /\b(s+h+i+t+|b+u+l+l+s+h+i+t+|d+i+p+s+h+i+t+)\b/i,
  /\b(m+o+t+h+e+r+f+u+c+k+e+r+|m+f+e+r+)\b/i,
  /\b(d+o+u+c+h+e+b+a+g+|d+o+u+c+h+e+)\b/i,
  /\b(n+i+g+g+a+|n+i+g+g+e+r+)\b/i,
  /\b(s+c+a+m+m+e+r+|f+r+a+u+d+s+t+e+r+)\b/i,
  // Hate and abusive targeting of PaperX app
  /\b(hate\s+paperx|hate\s+this\s+app|worst\s+app|scam\s+app|fraud\s+app|trash\s+app|rubbish\s+app|dogshit\s+app|shit\s+app|chor\s+app|bakwas\s+app|chutiya\s+app|fraud\s+hai|scam\s+hai|scammers)\b/i,
  /\b(f+u+c+k+\s+paperx|f+u+c+k+\s+this\s+app|f+u+c+k+\s+u|f+u+c+k+\s+you)\b/i,
  // Hindi / Hinglish / Bengali slangs and curses
  /\b(c+h+u+d+a+|c+h+u+d+i+|c+h+u+d+|c+h+u+d+a+i+|c+h+o+d+u+|c+h+u+d+n+a+|c+h+u+d+w+a+|c+h+u+d+a+k+k+a+d+)\b/i,
  /\b(m+a+d+a+r+c+h+o+d+|m+a+d+a+r+c+h+o+t+|m+c+|m+k+c+)\b/i,
  /\b(b+h+e+n+c+h+o+d+|b+e+h+e+n+c+h+o+d+|b+c+|b+h+e+n+c+h+o+t+)\b/i,
  /\b(c+h+u+t+i+y+a+|c+h+u+t+i+y+e+|c+h+u+t+i+y+o+n+|c+h+u+t+)\b/i,
  /\b(b+h+o+s+d+i+k+e+|b+h+o+s+d+i+|b+h+o+s+a+d+i+k+e+|b+s+d+k+|b+h+o+s+d+a+)\b/i,
  /\b(g+a+a+n+d+|g+a+n+d+u+|g+a+a+n+d+u+|g+a+n+d+|g+a+n+d+m+a+s+t+i+)\b/i,
  /\b(h+a+r+a+m+i+|h+a+r+a+m+z+a+a+d+a+|h+a+r+a+m+k+h+o+r+)\b/i,
  /\b(l+o+d+u+|l+a+u+d+a+|l+o+u+d+a+|l+a+u+n+d+a+|l+u+n+d+)\b/i,
  /\b(k+a+m+i+n+a+|k+a+m+e+e+n+a+|k+a+m+i+n+e+)\b/i,
  /\b(s+u+a+r+|k+u+t+t+a+|k+u+t+t+e+)\b/i,
  /\b(r+a+n+d+i+|r+u+n+d+i+|r+a+n+d+w+a+)\b/i,
  /\b(t+a+t+t+e+|t+a+t+t+i+|h+a+g+g+u+)\b/i
];

export function containsProfanityOrBadWords(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const cleaned = text.toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(cleaned)) {
      return true;
    }
  }
  return false;
}

export function setStoredUserStrikes(strikes: number, userIdentifier?: string): void {
  try {
    const sStr = String(strikes);
    localStorage.setItem('paperx_user_abuse_strikes', sStr);
    localStorage.setItem('paperx_user_ban_strikes', sStr);
    if (userIdentifier) {
      localStorage.setItem(`paperx_abuse_strikes_${userIdentifier.toLowerCase()}`, sStr);
    }
  } catch (_) {}
}

export function getUserStrikes(userIdentifier?: string): number {
  try {
    let strikes = 0;
    // 1. Direct key for user
    if (userIdentifier) {
      const key = `paperx_abuse_strikes_${userIdentifier.toLowerCase()}`;
      const val = localStorage.getItem(key);
      if (val) strikes = Math.max(strikes, parseInt(val, 10) || 0);
    }
    // 2. Global device strikes
    const genVal = localStorage.getItem('paperx_user_abuse_strikes');
    if (genVal) strikes = Math.max(strikes, parseInt(genVal, 10) || 0);

    const banStrikes = localStorage.getItem('paperx_user_ban_strikes');
    if (banStrikes) strikes = Math.max(strikes, parseInt(banStrikes, 10) || 0);

    // 3. Fallback to parsing Warning X/3 from ban reason
    const reason = localStorage.getItem('paperx_user_ban_reason');
    if (reason) {
      const match = reason.match(/Warning\s+(\d+)\s*\/\s*3/i);
      if (match) {
        strikes = Math.max(strikes, parseInt(match[1], 10) || 0);
      }
    }

    // 4. If user is currently banned, strikes must be at least 1!
    const rawBan = localStorage.getItem('paperx_user_ban_until');
    if (rawBan) {
      const banUntil = parseInt(rawBan, 10);
      if (!isNaN(banUntil) && banUntil > Date.now()) {
        strikes = Math.max(1, strikes);
      }
    }

    return strikes;
  } catch (_) {
    return 0;
  }
}

export function recordUserStrike(userIdentifier?: string): number {
  try {
    const current = getUserStrikes(userIdentifier);
    const updated = current + 1;
    setStoredUserStrikes(updated, userIdentifier);
    return updated;
  } catch (_) {
    return 1;
  }
}

export function checkPermanentSuspendedStatus(userEmailOrId?: string): boolean {
  try {
    if (!userEmailOrId || typeof userEmailOrId !== 'string') {
      return false;
    }
    const clean = userEmailOrId.trim().toLowerCase();
    if (!clean) return false;

    // 1. Account-specific key
    if (localStorage.getItem(`paperx_permanent_banned_${clean}`) === 'true') {
      return true;
    }

    // 2. Check stored banned email
    const storedBannedEmail = localStorage.getItem('paperx_permanent_banned_email');
    if (storedBannedEmail && storedBannedEmail.trim().toLowerCase() === clean) {
      return true;
    }

    // 3. Check banned accounts array
    const listRaw = localStorage.getItem('paperx_banned_accounts_list');
    if (listRaw) {
      try {
        const list = JSON.parse(listRaw);
        if (Array.isArray(list) && list.some((item: string) => (item || '').trim().toLowerCase() === clean)) {
          return true;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return false;
}

export function applyPermanentBan(reason?: string, userEmail?: string, userId?: string): void {
  try {
    const banReason = reason || 'Giving hate and slangs to PaperX after receiving 3 warnings. Strictly prohibited by PaperX App Rules.';
    localStorage.setItem('paperx_permanent_banned_reason', banReason);
    setStoredUserStrikes(4, userEmail || userId);

    let list: string[] = [];
    try {
      const listRaw = localStorage.getItem('paperx_banned_accounts_list');
      list = listRaw ? JSON.parse(listRaw) : [];
      if (!Array.isArray(list)) list = [];
    } catch (_) {
      list = [];
    }

    if (userEmail) {
      const cleanEmail = userEmail.trim().toLowerCase();
      localStorage.setItem(`paperx_permanent_banned_${cleanEmail}`, 'true');
      localStorage.setItem('paperx_permanent_banned_email', userEmail);
      if (!list.includes(cleanEmail)) list.push(cleanEmail);
    }
    if (userId) {
      const cleanId = userId.trim();
      localStorage.setItem(`paperx_permanent_banned_${cleanId}`, 'true');
      if (!list.includes(cleanId)) list.push(cleanId);
    }
    localStorage.setItem('paperx_banned_accounts_list', JSON.stringify(list));

    window.dispatchEvent(new Event('paperx_permanent_ban_updated'));
    window.dispatchEvent(new Event('paperx_ban_updated'));
  } catch (_) {}
}

export function checkUserBanStatus(userEmailOrId?: string): { 
  isBanned: boolean; 
  isPermanent: boolean; 
  banUntil: number; 
  timeRemainingMs: number;
  strikes: number;
} {
  const isPermanent = checkPermanentSuspendedStatus(userEmailOrId);
  if (isPermanent) {
    return { isBanned: true, isPermanent: true, banUntil: -1, timeRemainingMs: Infinity, strikes: 4 };
  }

  try {
    let strikes = getUserStrikes(userEmailOrId);
    const raw = localStorage.getItem('paperx_user_ban_until');
    if (raw) {
      const banUntil = parseInt(raw, 10);
      const now = Date.now();
      if (!isNaN(banUntil) && banUntil > now) {
        strikes = Math.max(1, strikes); // Guarantee at least 1 when ban is active
        return { isBanned: true, isPermanent: false, banUntil, timeRemainingMs: banUntil - now, strikes };
      }
      localStorage.removeItem('paperx_user_ban_until');
      localStorage.removeItem('paperx_user_ban_reason');
    }
    return { isBanned: false, isPermanent: false, banUntil: 0, timeRemainingMs: 0, strikes };
  } catch (_) {
    return { isBanned: false, isPermanent: false, banUntil: 0, timeRemainingMs: 0, strikes: 0 };
  }
}

export function applyUserBanFor1Hour(
  reason?: string, 
  userIdentifier?: string, 
  targetBanUntil?: number,
  strikesCount?: number
): { banUntil: number; strikes: number; isPermanent: boolean } {
  try {
    let strikes = 1;
    if (strikesCount !== undefined && strikesCount > 0) {
      strikes = strikesCount;
      setStoredUserStrikes(strikes, userIdentifier);
    } else {
      strikes = recordUserStrike(userIdentifier);
    }
    
    // If strikes exceed 3 warnings, trigger permanent suspension
    if (strikes > MAX_WARNINGS_BEFORE_PERMANENT_BAN) {
      applyPermanentBan(reason, userIdentifier);
      return { banUntil: -1, strikes, isPermanent: true };
    }

    const banUntil = targetBanUntil || (Date.now() + ONE_HOUR_BAN_MS);
    localStorage.setItem('paperx_user_ban_until', String(banUntil));
    localStorage.setItem('paperx_user_ban_reason', reason || `Warning ${strikes}/3: Abusive language or hate against app`);
    setStoredUserStrikes(strikes, userIdentifier);
    window.dispatchEvent(new Event('paperx_ban_updated'));
    return { banUntil, strikes, isPermanent: false };
  } catch (_) {
    return { banUntil: Date.now() + ONE_HOUR_BAN_MS, strikes: 1, isPermanent: false };
  }
}


