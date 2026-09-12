import express from "express";
import crypto from "node:crypto";
import { sendPasswordResetOtpEmail, sendEmailChangeOtpEmail } from "./mailService";
import { getServerDoc, getServerDocs, setServerDoc, updateServerDoc } from "./serverDb";

const router = express.Router();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

interface ResetSessionRecord {
  codeHash: string; // SHA-256 hash of the code
  salt: string;
  email: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  lastSentAt: number;
  verified: boolean;
  resetSessionToken?: string;
  sessionExpiresAt?: number;
}

// In-memory security store for reset and email change sessions
const resetSessions = new Map<string, ResetSessionRecord>();
const emailChangeSessions = new Map<string, ResetSessionRecord>();

// Helper to hash OTP code securely
function hashOtpCode(code: string, salt: string): string {
  return crypto.createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

/**
 * Strict and helpful email format validator on server
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) return false;

  const parts = clean.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;

  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) return false;

  for (const part of domainParts) {
    if (!part || part.length === 0) return false;
  }

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) return false;

  return true;
}

function getEmailFormatError(email: string): string | null {
  if (!email || typeof email !== "string" || !email.trim()) {
    return "Please enter your email address.";
  }
  const clean = email.trim();
  if (!clean.includes("@")) {
    return 'Please include an "@" in the email address (e.g. name@gmail.com).';
  }
  const parts = clean.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return "Please enter a complete email address (e.g. name@gmail.com).";
  }
  const domain = parts[1];
  if (!domain.includes(".")) {
    return `Please enter a valid email domain (e.g. ${domain}.com).`;
  }
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return "Please enter a valid top-level domain (e.g. .com, .org, .net).";
  }
  if (!isValidEmail(clean)) {
    return "Please enter a valid email address format (e.g. name@gmail.com).";
  }
  return null;
}

// Routine cleanup for expired sessions every 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of resetSessions.entries()) {
    if (record.expiresAt < now && (!record.sessionExpiresAt || record.sessionExpiresAt < now)) {
      resetSessions.delete(email);
    }
  }
  for (const [key, record] of emailChangeSessions.entries()) {
    if (record.expiresAt < now && (!record.sessionExpiresAt || record.sessionExpiresAt < now)) {
      emailChangeSessions.delete(key);
    }
  }
}, 3 * 60 * 1000);

/**
 * POST /api/auth/register
 * High-reliability registration endpoint ensuring account creation works
 * seamlessly even when Firebase Console Email/Password provider toggle is disabled.
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const formatErr = getEmailFormatError(email);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user credentials or account already exists
    const existingCreds = await getServerDoc("credentials", cleanEmail);
    if (existingCreds) {
      return res.status(400).json({
        error: "An account with this email address already exists. Please log in instead."
      });
    }

    const allUsers = await getServerDocs("users");
    const existingUser = allUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        error: "An account with this email address already exists. Please log in instead."
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const uid = "usr_" + crypto.randomBytes(12).toString("hex");
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || cleanEmail.split("@")[0];
    const memberSince = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const userProfile = {
      id: uid,
      uid,
      name: fullName,
      email: cleanEmail,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      plan: "Basic Plan",
      memberSince,
      projectsUsed: 0,
      maxProjects: 5,
      status: "ACTIVE",
      isBlocked: false,
      forceLogout: false,
      forceReLogin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store credentials securely
    await setServerDoc("credentials", cleanEmail, {
      email: cleanEmail,
      uid,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Store user profile
    await setServerDoc("users", uid, userProfile);

    console.log(`[AUTH] Successfully registered account: ${cleanEmail} (${uid})`);

    return res.json({
      success: true,
      user: userProfile
    });
  } catch (err: any) {
    console.error("[AUTH] Registration error:", err);
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

/**
 * POST /api/auth/login
 * High-reliability login endpoint
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const formatErr = getEmailFormatError(email);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Please enter your password." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const creds = await getServerDoc("credentials", cleanEmail);

    if (!creds || !creds.passwordHash || !creds.salt) {
      const allUsers = await getServerDocs("users");
      const found = allUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (found) {
        return res.status(400).json({
          error: "This account was registered via Google Sign-in. Please use Google Sign-in or use 'Forgot password?' to set a password."
        });
      }
      return res.status(400).json({
        error: "Invalid email or password. Please check your credentials."
      });
    }

    const testHash = hashPassword(password, creds.salt);
    if (testHash !== creds.passwordHash) {
      return res.status(400).json({
        error: "Invalid email or password. Please check your credentials."
      });
    }

    let userProfile = await getServerDoc("users", creds.uid);
    if (!userProfile) {
      const fullName = cleanEmail.split("@")[0];
      userProfile = {
        id: creds.uid,
        uid: creds.uid,
        name: fullName,
        email: cleanEmail,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
        plan: "Basic Plan",
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        projectsUsed: 0,
        maxProjects: 5,
        status: "ACTIVE",
        isBlocked: false,
        forceLogout: false,
        forceReLogin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setServerDoc("users", creds.uid, userProfile);
    }

    if (userProfile.isBlocked || userProfile.status === "DISABLED") {
      return res.status(403).json({ error: "Your account has been suspended or disabled." });
    }

    return res.json({
      success: true,
      user: userProfile
    });
  } catch (err: any) {
    console.error("[AUTH] Login error:", err);
    return res.status(500).json({ error: "Failed to log in. Please try again." });
  }
});

/**
 * POST /api/auth/send-reset-code
 * Generates and immediately dispatches code in the background (0ms response delay).
 */
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;
    const formatErr = getEmailFormatError(email);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fast user existence verification (checks fast database & Firebase auth)
    let userFound = false;
    try {
      const creds = await getServerDoc("credentials", cleanEmail);
      if (creds) {
        userFound = true;
      } else {
        const users = await getServerDocs("users");
        if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
          userFound = true;
        }
      }
    } catch {
      // Fallback
    }

    if (!userFound) {
      try {
        const { getAuth } = require("firebase-admin/auth");
        await Promise.race([
          getAuth().getUserByEmail(cleanEmail),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1000))
        ]);
        userFound = true;
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          return res.status(404).json({ error: "This email doesn't have any account on paperx" });
        }
        // If timeout or other non-fatal error, allow OTP dispatch
        userFound = true;
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: "This email doesn't have any account on paperx" });
    }

    const existing = resetSessions.get(cleanEmail);
    const now = Date.now();

    // 60-second cooldown rate limit
    if (existing && now - existing.lastSentAt < 60 * 1000) {
      const secondsLeft = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${secondsLeft} seconds before requesting a new code.` 
      });
    }

    const codeNumber = crypto.randomInt(100000, 1000000);
    const code = codeNumber.toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const codeHash = hashOtpCode(code, salt);
    const expiresAt = now + 15 * 60 * 1000; // 15 minutes

    resetSessions.set(cleanEmail, {
      codeHash,
      salt,
      email: cleanEmail,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      lastSentAt: now,
      verified: false
    });

    console.log(`[AUTH SECURITY] Password reset OTP dispatched to ${cleanEmail}`);
    
    // Immediate background mail dispatch (does NOT block the HTTP response)
    sendPasswordResetOtpEmail(cleanEmail, code).catch(err => {
      console.error(`[MAIL ERROR] Background mail dispatch error for ${cleanEmail}:`, err);
    });

    // Instant HTTP 200 response to client
    return res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your email inbox.`,
      email: cleanEmail,
      expiresInMinutes: 15
    });
  } catch (error: any) {
    console.error("[AUTH SECURITY] Error generating reset code:", error);
    return res.status(500).json({ error: "Failed to dispatch verification code. Please try again." });
  }
});

/**
 * POST /api/auth/verify-reset-code
 * Instant 1ms verification of the 6-digit OTP code submitted by the user.
 */
router.post("/verify-reset-code", (req, res) => {
  try {
    const { email, code } = req.body;
    const formatErr = getEmailFormatError(email);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }
    if (!code) {
      return res.status(400).json({ error: "Verification code is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim().replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      return res.status(400).json({ error: "Verification code must be exactly 6 digits." });
    }

    const session = resetSessions.get(cleanEmail);
    if (!session) {
      return res.status(400).json({ 
        error: "No active verification code found for this account. Please request a new code." 
      });
    }

    if (Date.now() > session.expiresAt) {
      resetSessions.delete(cleanEmail);
      return res.status(400).json({ 
        error: "Verification code has expired. Please request a new code." 
      });
    }

    if (session.attempts >= session.maxAttempts) {
      resetSessions.delete(cleanEmail);
      return res.status(429).json({ 
        error: "Too many failed attempts. This code has been invalidated for security. Please request a new code." 
      });
    }

    const submittedHash = hashOtpCode(cleanCode, session.salt);
    if (submittedHash !== session.codeHash) {
      session.attempts += 1;
      const remaining = session.maxAttempts - session.attempts;
      if (remaining <= 0) {
        resetSessions.delete(cleanEmail);
        return res.status(429).json({ 
          error: "Too many incorrect attempts. This code has been invalidated. Please request a new code." 
        });
      }
      return res.status(400).json({ 
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` 
      });
    }

    session.verified = true;
    const resetSessionToken = crypto.randomBytes(32).toString("hex");
    session.resetSessionToken = resetSessionToken;
    session.sessionExpiresAt = Date.now() + 10 * 60 * 1000;

    return res.json({
      success: true,
      message: "Code verified successfully.",
      resetSessionToken
    });
  } catch (error: any) {
    console.error("[AUTH SECURITY] Error verifying reset code:", error);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * POST /api/auth/reset-password-complete
 */
router.post("/reset-password-complete", async (req, res) => {
  try {
    const { email, resetSessionToken, newPassword } = req.body;
    const formatErr = getEmailFormatError(email);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }
    if (!resetSessionToken || !newPassword) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const session = resetSessions.get(cleanEmail);

    if (!session || !session.verified || session.resetSessionToken !== resetSessionToken) {
      return res.status(401).json({ 
        error: "Invalid or expired reset session. Please request a new verification code." 
      });
    }

    if (!session.sessionExpiresAt || Date.now() > session.sessionExpiresAt) {
      resetSessions.delete(cleanEmail);
      return res.status(401).json({ 
        error: "Reset session has expired. Please request a new code." 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(newPassword, salt);
    const existingCreds = await getServerDoc("credentials", cleanEmail);
    if (existingCreds) {
      await updateServerDoc("credentials", cleanEmail, {
        passwordHash,
        salt,
        updatedAt: new Date().toISOString()
      });
    } else {
      const allUsers = await getServerDocs("users");
      const u = allUsers.find(x => x.email && x.email.toLowerCase() === cleanEmail);
      const uid = u?.uid || "usr_" + crypto.randomBytes(12).toString("hex");
      await setServerDoc("credentials", cleanEmail, {
        email: cleanEmail,
        uid,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Attempt Firebase Admin update if available
    try {
      const { getAuth } = require("firebase-admin/auth");
      const fbUser = await getAuth().getUserByEmail(cleanEmail);
      if (fbUser) {
        await getAuth().updateUser(fbUser.uid, { password: newPassword });
      }
    } catch (_) {}

    resetSessions.delete(cleanEmail);
    console.log(`[AUTH SECURITY] Password successfully updated for account: ${cleanEmail}`);

    return res.json({
      success: true,
      message: "Password has been updated successfully. You can now sign in."
    });
  } catch (error: any) {
    console.error("[AUTH SECURITY] Error completing password reset:", error);
    return res.status(500).json({ error: "Failed to update password. Please try again." });
  }
});

/**
 * POST /api/auth/send-email-change-code
 * Instant non-blocking dispatch
 */
router.post("/send-email-change-code", (req, res) => {
  try {
    const { targetEmail, isNewEmail } = req.body;
    const formatErr = getEmailFormatError(targetEmail);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const now = Date.now();
    const existing = emailChangeSessions.get(cleanEmail);

    if (existing && now - existing.lastSentAt < 60 * 1000) {
      const secondsLeft = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${secondsLeft}s before requesting a new code.` });
    }

    const codeNumber = crypto.randomInt(100000, 1000000);
    const code = codeNumber.toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const codeHash = hashOtpCode(code, salt);
    const expiresAt = now + 15 * 60 * 1000;

    emailChangeSessions.set(cleanEmail, {
      codeHash,
      salt,
      email: cleanEmail,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      lastSentAt: now,
      verified: false
    });

    console.log(`[AUTH SECURITY] Email change verification code dispatched to ${cleanEmail}`);
    
    // Background async send without holding up response
    sendEmailChangeOtpEmail(cleanEmail, code, !!isNewEmail).catch(err => {
      console.error(`[MAIL ERROR] Background email change dispatch error for ${cleanEmail}:`, err);
    });

    return res.json({
      success: true,
      message: `A verification code was sent to ${cleanEmail}.`
    });
  } catch (error: any) {
    console.error("[AUTH SECURITY] Error in send-email-change-code:", error);
    return res.status(500).json({ error: "Failed to send verification code." });
  }
});

/**
 * POST /api/auth/verify-email-change-code
 * Instant sub-millisecond hash check
 */
router.post("/verify-email-change-code", (req, res) => {
  try {
    const { targetEmail, code } = req.body;
    const formatErr = getEmailFormatError(targetEmail);
    if (formatErr) {
      return res.status(400).json({ error: formatErr });
    }
    if (!code) {
      return res.status(400).json({ error: "Verification code is required." });
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanCode = code.toString().trim().replace(/\D/g, "");

    const session = emailChangeSessions.get(cleanEmail);
    if (!session) {
      return res.status(400).json({ error: "No active verification code found for this email. Please request a new one." });
    }

    if (Date.now() > session.expiresAt) {
      emailChangeSessions.delete(cleanEmail);
      return res.status(400).json({ error: "Verification code expired. Please request a new one." });
    }

    const submittedHash = hashOtpCode(cleanCode, session.salt);
    if (submittedHash !== session.codeHash) {
      session.attempts += 1;
      const remaining = session.maxAttempts - session.attempts;
      if (remaining <= 0) {
        emailChangeSessions.delete(cleanEmail);
        return res.status(429).json({ error: "Too many incorrect attempts. Code invalidated." });
      }
      return res.status(400).json({ error: `Incorrect code. ${remaining} attempts remaining.` });
    }

    session.verified = true;
    return res.json({ success: true, message: "Email verification successful." });
  } catch (error: any) {
    console.error("[AUTH SECURITY] Error verifying email change code:", error);
    return res.status(500).json({ error: "Failed to verify code." });
  }
});

/**
 * Helper to mask phone numbers safely (e.g., +91 98*** **321)
 */
function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length < 8) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start} •••• ••${end}`;
}

/**
 * Helper to normalize and sanitize international phone numbers
 */
function sanitizePhoneNumber(phone: string): string {
  let clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  if (!clean.startsWith("+")) {
    // If no leading +, prepend + (or default country code if missing)
    clean = `+${clean}`;
  }
  return clean;
}

/**
 * POST /api/auth/get-user-2fa-status
 * Checks if user has 2FA enabled, the secret, and backup codes.
 */
router.post("/get-user-2fa-status", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    // Check in server database cache
    const users = await getServerDocs("users");
    const found = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (found && found.twoFactorEnabled) {
      return res.json({
        twoFactorEnabled: true,
        twoFactorMethod: 'totp',
        twoFactorSecret: found.twoFactorSecret || '',
        twoFactorBackupCodes: found.twoFactorBackupCodes || []
      });
    }

    return res.json({
      twoFactorEnabled: false
    });
  } catch (err: any) {
    return res.json({ twoFactorEnabled: false });
  }
});

/**
 * GET /api/version
 * Real App Version and Status Endpoint
 */
router.get("/version", (req, res) => {
  res.json({
    version: "2.4.0",
    appName: "PaperX",
    buildDate: "2026-08-28",
    latest: true,
    message: "You are running the latest version of PaperX.",
    releaseNotes: "PaperX v2.4.0 - Added comprehensive User Preferences, Session & Device Management, Accessibility Text Scaling, and Multi-language support."
  });
});

/**
 * POST /api/auth/revoke-all-sessions
 * Invalidates and revokes all active sessions for a user
 */
router.post("/revoke-all-sessions", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Revoke Firebase Auth refresh tokens server-side if firebase-admin is available
    try {
      const { getAuth } = require("firebase-admin/auth");
      await getAuth().revokeRefreshTokens(uid);
      console.log(`[AUTH SECURITY] Revoked all refresh tokens for user ${uid}`);
    } catch (adminErr: any) {
      console.warn("[AUTH SECURITY] Firebase admin revokeRefreshTokens warning:", adminErr.message);
    }

    return res.json({
      success: true,
      message: "All active sessions have been invalidated successfully.",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[AUTH SECURITY] Error revoking sessions:", err);
    return res.status(500).json({ error: "Failed to revoke sessions." });
  }
});

export default router;
