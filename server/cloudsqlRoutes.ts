import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../src/middleware/auth.ts';
import { getOrCreateUser, logUserOperation } from '../src/db/users.ts';

const router = Router();

// Health/Status check for Cloud SQL
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    database: 'Cloud SQL (PostgreSQL)',
    region: 'asia-south1',
    timestamp: new Date().toISOString()
  });
});

// Securely sync logged-in Firebase user into Cloud SQL
router.post('/sync-user', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const uid = authReq.user?.uid;
    const email = authReq.user?.email;
    const name = req.body?.name || authReq.user?.name;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Invalid user credentials token' });
    }

    const dbUser = await getOrCreateUser(uid, email, name);
    return res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Cloud SQL sync-user error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync user to Cloud SQL' });
  }
});

// Securely log user document operation to Cloud SQL
router.post('/log-operation', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const uid = authReq.user?.uid;
    const email = authReq.user?.email;
    const { operationType, details } = req.body;

    if (!uid || !email || !operationType) {
      return res.status(400).json({ error: 'Missing required operation parameters' });
    }

    const dbUser = await getOrCreateUser(uid, email);
    const operation = await logUserOperation(dbUser.id, operationType, details);

    return res.json({ success: true, operation });
  } catch (error: any) {
    console.error('Cloud SQL log-operation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to log operation in Cloud SQL' });
  }
});

export default router;
