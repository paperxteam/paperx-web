import express from 'express';
import { getServerDoc, setServerDoc, updateServerDoc } from './serverDb';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();

// Persistent storage for device-based usage (prevents bypass via incognito or local storage clearing)
const DEVICE_USAGE_FILE = path.join(process.cwd(), 'server', 'cache_device_usage.json');
let deviceUsageMap: Record<string, { operationsUsed: number; completedOperations: string[]; lastActive: string }> = {};

try {
  if (fs.existsSync(DEVICE_USAGE_FILE)) {
    const raw = fs.readFileSync(DEVICE_USAGE_FILE, 'utf-8');
    deviceUsageMap = JSON.parse(raw);
  }
} catch (e) {
  deviceUsageMap = {};
}

function saveDeviceUsage() {
  try {
    fs.writeFileSync(DEVICE_USAGE_FILE, JSON.stringify(deviceUsageMap, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Usage] Failed to save device usage to disk:', e);
  }
}

// Plan limits definition
export const PLAN_LIMITS = {
  Free: {
    maxOperations: 5,
    maxFileSizeMb: 50,
    canBatchProcess: false,
    priorityProcessing: false,
    name: 'Free'
  },
  Plus: {
    maxOperations: 100,
    maxFileSizeMb: 100,
    canBatchProcess: true,
    priorityProcessing: true,
    name: 'Pro Plan'
  },
  Max: {
    maxOperations: 1000,
    maxFileSizeMb: 500,
    canBatchProcess: true,
    priorityProcessing: true,
    name: 'Max'
  }
} as const;

export function resolveUserTier(user: any): 'Free' | 'Plus' | 'Max' {
  if (!user) return 'Free';
  if (user.isRefunded || user.subscriptionStatus === 'refunded' || user.refundStatus === 'COMPLETED') {
    return 'Free';
  }
  const plan = String(user.purchasedPlan || user.activePlanMode || user.plan || '').toLowerCase();
  if (plan.includes('max')) return 'Max';
  if (plan.includes('plus') || plan.includes('pro')) return 'Plus';
  return 'Free';
}

function getClientIdentifier(req: express.Request, deviceId?: string): string {
  if (deviceId && typeof deviceId === 'string' && deviceId.trim().length > 3) {
    return deviceId.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown-client';
  return `ip_${ip.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

// 1. GET Current Usage Status
router.get('/status', async (req, res) => {
  try {
    const uid = typeof req.query.uid === 'string' ? req.query.uid : null;
    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;
    const clientId = getClientIdentifier(req, deviceId);

    if (uid) {
      const user = await getServerDoc('users', uid);
      if (user) {
        const tier = resolveUserTier(user);
        const limits = PLAN_LIMITS[tier];
        const operationsUsed = Number(user.projectsUsed ?? user.featureUsageCount ?? 0);
        const operationsRemaining = Math.max(0, limits.maxOperations - operationsUsed);
        const isLimitReached = operationsUsed >= limits.maxOperations;

        return res.json({
          success: true,
          tier,
          planName: limits.name,
          operationsUsed,
          maxOperations: limits.maxOperations,
          operationsRemaining,
          isLimitReached,
          maxFileSizeMb: limits.maxFileSizeMb,
          canBatchProcess: limits.canBatchProcess,
          canProcess: !isLimitReached
        });
      }
    }

    // Guest / Anonymous fallback
    const deviceRecord = deviceUsageMap[clientId] || { operationsUsed: 0, completedOperations: [], lastActive: new Date().toISOString() };
    const tier = 'Free';
    const limits = PLAN_LIMITS.Free;
    const operationsUsed = Number(deviceRecord.operationsUsed || 0);
    const operationsRemaining = Math.max(0, limits.maxOperations - operationsUsed);
    const isLimitReached = operationsUsed >= limits.maxOperations;

    return res.json({
      success: true,
      tier,
      planName: limits.name,
      operationsUsed,
      maxOperations: limits.maxOperations,
      operationsRemaining,
      isLimitReached,
      maxFileSizeMb: limits.maxFileSizeMb,
      canBatchProcess: limits.canBatchProcess,
      canProcess: !isLimitReached
    });
  } catch (error: any) {
    console.error('[Usage status error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error checking usage status' });
  }
});

// 2. POST Verify Quota & Tool Permissions BEFORE Processing
router.post('/verify', async (req, res) => {
  try {
    const { uid, deviceId, toolId, fileCount = 1, totalSizeMb = 0 } = req.body;
    const clientId = getClientIdentifier(req, deviceId);

    let tier: 'Free' | 'Plus' | 'Max' = 'Free';
    let operationsUsed = 0;
    let completedOps: string[] = [];

    if (uid) {
      const user = await getServerDoc('users', uid);
      if (user) {
        tier = resolveUserTier(user);
        operationsUsed = Number(user.projectsUsed ?? user.featureUsageCount ?? 0);
        completedOps = Array.isArray(user.completedOperationIds) ? user.completedOperationIds : [];
      } else {
        const deviceRecord = deviceUsageMap[clientId] || { operationsUsed: 0, completedOperations: [], lastActive: new Date().toISOString() };
        operationsUsed = deviceRecord.operationsUsed || 0;
        completedOps = deviceRecord.completedOperations || [];
      }
    } else {
      const deviceRecord = deviceUsageMap[clientId] || { operationsUsed: 0, completedOperations: [], lastActive: new Date().toISOString() };
      operationsUsed = deviceRecord.operationsUsed || 0;
      completedOps = deviceRecord.completedOperations || [];
    }

    const limits = PLAN_LIMITS[tier];

    // Check 1: Global Free Limit (5 operations) or paid limit
    if (operationsUsed >= limits.maxOperations) {
      return res.status(403).json({
        allowed: false,
        reason: 'LIMIT_REACHED',
        tier,
        planName: limits.name,
        operationsUsed,
        maxOperations: limits.maxOperations,
        message: tier === 'Free'
          ? 'Free limit reached. You have used all 5 free PaperX operations. Upgrade your plan to continue processing documents.'
          : `${limits.name} operation limit reached (${limits.maxOperations} operations). Upgrade to continue processing documents.`
      });
    }

    // Check 2: File size limit check
    if (totalSizeMb > limits.maxFileSizeMb) {
      return res.status(403).json({
        allowed: false,
        reason: 'FILE_SIZE_EXCEEDED',
        tier,
        maxFileSizeMb: limits.maxFileSizeMb,
        message: `File size exceeds the ${limits.maxFileSizeMb}MB limit for your ${limits.name} plan. Upgrade to increase file size limits.`
      });
    }

    // Check 3: Batch processing check
    if (fileCount > 1 && !limits.canBatchProcess && toolId !== 'merge-pdf') {
      return res.status(403).json({
        allowed: false,
        reason: 'BATCH_LOCKED',
        tier,
        message: 'Batch processing multiple files simultaneously is available on Pro and Max plans.'
      });
    }

    return res.json({
      allowed: true,
      tier,
      planName: limits.name,
      operationsUsed,
      maxOperations: limits.maxOperations,
      operationsRemaining: Math.max(0, limits.maxOperations - operationsUsed)
    });
  } catch (error: any) {
    console.error('[Usage verify error]:', error);
    res.status(500).json({ error: error.message || 'Error verifying quota' });
  }
});

// 3. POST Record Successful Operation (Idempotent & Atomic)
router.post('/record-success', async (req, res) => {
  try {
    const { uid, deviceId, operationId, toolId, fileCount = 1 } = req.body;
    if (!operationId) {
      return res.status(400).json({ error: 'Missing operationId for idempotency validation' });
    }

    const clientId = getClientIdentifier(req, deviceId);
    const nowIso = new Date().toISOString();

    if (uid) {
      const user = await getServerDoc('users', uid);
      if (user) {
        const tier = resolveUserTier(user);
        const limits = PLAN_LIMITS[tier];
        const existingCompleted: string[] = Array.isArray(user.completedOperationIds) ? user.completedOperationIds : [];

        // Idempotency: If this operationId has already been recorded, do not double count
        if (existingCompleted.includes(operationId)) {
          const currentCount = Number(user.projectsUsed ?? user.featureUsageCount ?? 0);
          return res.json({
            success: true,
            alreadyCounted: true,
            tier,
            planName: limits.name,
            operationsUsed: currentCount,
            maxOperations: limits.maxOperations,
            operationsRemaining: Math.max(0, limits.maxOperations - currentCount),
            isLimitReached: currentCount >= limits.maxOperations
          });
        }

        const newUsed = (Number(user.projectsUsed || 0) + 1);
        const updatedCompleted = [...existingCompleted.slice(-50), operationId]; // keep last 50 IDs

        const updatePayload: Record<string, any> = {
          projectsUsed: newUsed,
          featureUsageCount: (Number(user.featureUsageCount || 0) + 1),
          completedOperationIds: updatedCompleted,
          lastOperationAt: nowIso,
          updatedAt: nowIso
        };

        await updateServerDoc('users', uid, updatePayload);

        // Also update local device map to keep them synced
        deviceUsageMap[clientId] = {
          operationsUsed: Math.max(newUsed, (deviceUsageMap[clientId]?.operationsUsed || 0)),
          completedOperations: [...(deviceUsageMap[clientId]?.completedOperations || []).slice(-50), operationId],
          lastActive: nowIso
        };
        saveDeviceUsage();

        return res.json({
          success: true,
          operationsUsed: newUsed,
          maxOperations: limits.maxOperations,
          operationsRemaining: Math.max(0, limits.maxOperations - newUsed),
          isLimitReached: newUsed >= limits.maxOperations,
          tier,
          planName: limits.name
        });
      }
    }

    // Guest / Device-based operation count
    const deviceRecord = deviceUsageMap[clientId] || { operationsUsed: 0, completedOperations: [], lastActive: nowIso };
    const limits = PLAN_LIMITS.Free;

    if (deviceRecord.completedOperations.includes(operationId)) {
      return res.json({
        success: true,
        alreadyCounted: true,
        tier: 'Free',
        planName: limits.name,
        operationsUsed: deviceRecord.operationsUsed,
        maxOperations: limits.maxOperations,
        operationsRemaining: Math.max(0, limits.maxOperations - deviceRecord.operationsUsed),
        isLimitReached: deviceRecord.operationsUsed >= limits.maxOperations
      });
    }

    const newDeviceUsed = deviceRecord.operationsUsed + 1;
    deviceUsageMap[clientId] = {
      operationsUsed: newDeviceUsed,
      completedOperations: [...deviceRecord.completedOperations.slice(-50), operationId],
      lastActive: nowIso
    };
    saveDeviceUsage();

    return res.json({
      success: true,
      operationsUsed: newDeviceUsed,
      maxOperations: limits.maxOperations,
      operationsRemaining: Math.max(0, limits.maxOperations - newDeviceUsed),
      isLimitReached: newDeviceUsed >= limits.maxOperations,
      tier: 'Free',
      planName: limits.name
    });
  } catch (error: any) {
    console.error('[Usage record-success error]:', error);
    res.status(500).json({ error: error.message || 'Error recording successful operation' });
  }
});

export default router;
