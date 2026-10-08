import { User } from '../types';

export interface UsageState {
  tier: 'Free' | 'Plus' | 'Max';
  planName: string;
  operationsUsed: number;
  maxOperations: number;
  operationsRemaining: number;
  isLimitReached: boolean;
  maxFileSizeMb: number;
  canBatchProcess: boolean;
  canProcess: boolean;
}

const DEVICE_ID_KEY = 'paperx_device_identity_v1';

export function getClientDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id || id.length < 8) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return 'dev_fallback_' + Date.now().toString(36);
  }
}

// Global event for instantaneous UI re-renders across all components
const USAGE_UPDATE_EVENT = 'paperx_usage_updated';

export const UsageService = {
  getDeviceId: getClientDeviceId,

  async fetchUsageStatus(user?: User | null): Promise<UsageState> {
    const deviceId = getClientDeviceId();
    const uid = user?.uid || (user as any)?.id || '';
    const query = new URLSearchParams({
      deviceId,
      ...(uid ? { uid } : {})
    });

    try {
      const res = await fetch(`/api/usage/status?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const state: UsageState = {
            tier: data.tier,
            planName: data.planName,
            operationsUsed: data.operationsUsed,
            maxOperations: data.maxOperations,
            operationsRemaining: data.operationsRemaining,
            isLimitReached: data.isLimitReached,
            maxFileSizeMb: data.maxFileSizeMb,
            canBatchProcess: data.canBatchProcess,
            canProcess: data.canProcess
          };
          this.broadcastUsageUpdate(state);
          return state;
        }
      }
    } catch (e) {
      console.warn('[UsageService] Failed to fetch usage from server, using local calculation:', e);
    }

    // Client fallback if network offline
    const isMax = Boolean(user?.plan?.toLowerCase().includes('max') || user?.purchasedPlan?.toLowerCase().includes('max'));
    const isPlus = !isMax && Boolean(user?.plan?.toLowerCase().includes('plus') || user?.plan?.toLowerCase().includes('pro'));
    const tier: 'Free' | 'Plus' | 'Max' = isMax ? 'Max' : (isPlus ? 'Plus' : 'Free');
    const maxOps = tier === 'Free' ? 5 : (tier === 'Plus' ? 100 : 1000);
    const used = Number(user?.projectsUsed ?? user?.featureUsageCount ?? 0);

    return {
      tier,
      planName: tier === 'Free' ? 'Free' : (tier === 'Plus' ? 'Plus Plus' : 'Max'),
      operationsUsed: used,
      maxOperations: maxOps,
      operationsRemaining: Math.max(0, maxOps - used),
      isLimitReached: used >= maxOps,
      maxFileSizeMb: tier === 'Free' ? 50 : (tier === 'Plus' ? 100 : 500),
      canBatchProcess: tier !== 'Free',
      canProcess: used < maxOps
    };
  },

  async verifyOperationAllowed(
    toolId: string,
    fileCount: number = 1,
    totalSizeMb: number = 0,
    user?: User | null
  ): Promise<{ allowed: boolean; reason?: string; message?: string; isLimitReached?: boolean }> {
    const deviceId = getClientDeviceId();
    const uid = user?.uid || (user as any)?.id || '';

    try {
      const res = await fetch('/api/usage/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          deviceId,
          toolId,
          fileCount,
          totalSizeMb
        })
      });

      const data = await res.json();
      if (!res.ok || !data.allowed) {
        return {
          allowed: false,
          reason: data.reason || 'DISALLOWED',
          message: data.message || 'Operation not allowed on current plan.',
          isLimitReached: data.reason === 'LIMIT_REACHED'
        };
      }

      return { allowed: true };
    } catch (e) {
      // Local client check fallback
      const isMax = Boolean(user?.plan?.toLowerCase().includes('max'));
      const isPlus = !isMax && Boolean(user?.plan?.toLowerCase().includes('plus'));
      const tier: 'Free' | 'Plus' | 'Max' = isMax ? 'Max' : (isPlus ? 'Plus' : 'Free');
      const maxOps = tier === 'Free' ? 5 : (tier === 'Plus' ? 100 : 1000);
      const used = Number(user?.projectsUsed ?? user?.featureUsageCount ?? 0);

      if (used >= maxOps) {
        return {
          allowed: false,
          reason: 'LIMIT_REACHED',
          message: tier === 'Free'
            ? 'Free limit reached. You have used all 5 free PaperX operations. Upgrade your plan to continue processing documents.'
            : `${tier} operation limit reached.`,
          isLimitReached: true
        };
      }
      return { allowed: true };
    }
  },

  async recordOperationSuccess(
    toolId: string,
    operationId: string,
    fileCount: number = 1,
    user?: User | null
  ): Promise<{ success: boolean; operationsUsed: number; maxOperations: number; operationsRemaining: number; isLimitReached: boolean }> {
    const deviceId = getClientDeviceId();
    const uid = user?.uid || (user as any)?.id || '';

    try {
      const res = await fetch('/api/usage/record-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          deviceId,
          operationId,
          toolId,
          fileCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const state: UsageState = {
            tier: data.tier,
            planName: data.planName,
            operationsUsed: data.operationsUsed,
            maxOperations: data.maxOperations,
            operationsRemaining: data.operationsRemaining,
            isLimitReached: data.isLimitReached,
            maxFileSizeMb: data.tier === 'Free' ? 50 : (data.tier === 'Plus' ? 100 : 500),
            canBatchProcess: data.tier !== 'Free',
            canProcess: !data.isLimitReached
          };
          this.broadcastUsageUpdate(state);
          return data;
        }
      }
    } catch (e) {
      console.warn('[UsageService] Error syncing record success with backend:', e);
    }

    // Local increment fallback
    const isMax = Boolean(user?.plan?.toLowerCase().includes('max'));
    const isPlus = !isMax && Boolean(user?.plan?.toLowerCase().includes('plus'));
    const tier: 'Free' | 'Plus' | 'Max' = isMax ? 'Max' : (isPlus ? 'Plus' : 'Free');
    const maxOps = tier === 'Free' ? 5 : (tier === 'Plus' ? 100 : 1000);
    const newUsed = Math.min(maxOps, Number(user?.projectsUsed ?? user?.featureUsageCount ?? 0) + 1);

    const fallbackState: UsageState = {
      tier,
      planName: tier === 'Free' ? 'Free' : (tier === 'Plus' ? 'Plus Plus' : 'Max'),
      operationsUsed: newUsed,
      maxOperations: maxOps,
      operationsRemaining: Math.max(0, maxOps - newUsed),
      isLimitReached: newUsed >= maxOps,
      maxFileSizeMb: tier === 'Free' ? 50 : (tier === 'Plus' ? 100 : 500),
      canBatchProcess: tier !== 'Free',
      canProcess: newUsed < maxOps
    };
    this.broadcastUsageUpdate(fallbackState);

    return {
      success: true,
      operationsUsed: newUsed,
      maxOperations: maxOps,
      operationsRemaining: Math.max(0, maxOps - newUsed),
      isLimitReached: newUsed >= maxOps
    };
  },

  broadcastUsageUpdate(state: UsageState) {
    try {
      window.dispatchEvent(new CustomEvent(USAGE_UPDATE_EVENT, { detail: state }));
    } catch (_) {}
  },

  onUsageUpdate(callback: (state: UsageState) => void): () => void {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<UsageState>;
      if (custom.detail) {
        callback(custom.detail);
      }
    };
    window.addEventListener(USAGE_UPDATE_EVENT, handler);
    return () => window.removeEventListener(USAGE_UPDATE_EVENT, handler);
  }
};
