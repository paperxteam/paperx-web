/**
 * Real RFC 6238 TOTP (Time-based One-Time Password) Engine
 * Fully compatible with Google Authenticator, Authy, 1Password, Bitwarden, Apple Passwords, etc.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a Base32 string into a Uint8Array
 */
function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=/g, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Generates a random 16-character Base32 secret key
 */
export function generateBase32Secret(): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

/**
 * Calculates RFC 6238 HMAC-SHA1 TOTP 6-digit code for a given secret and window offset
 */
export async function generateTOTPCode(secretBase32: string, windowOffset: number = 0): Promise<string> {
  try {
    const keyBytes = base32ToBytes(secretBase32);
    if (keyBytes.length === 0) return '000000';

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const epochStep = Math.floor(Date.now() / 1000 / 30) + windowOffset;
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, epochStep, false); // Big-Endian 64-bit integer

    const hmacResult = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hmacBytes = new Uint8Array(hmacResult);

    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (err) {
    console.error('Error computing TOTP:', err);
    return '000000';
  }
}

/**
 * Verifies if user provided 6-digit TOTP code matches current, previous, or next 30-second window
 */
export async function verifyTOTPCode(secretBase32: string, userCode: string): Promise<boolean> {
  const cleanInput = userCode.trim().replace(/\D/g, '');
  if (cleanInput.length !== 6) return false;

  // Check current window, -1 window, +1 window (allows for clock drift)
  for (const offset of [0, -1, 1]) {
    const validCode = await generateTOTPCode(secretBase32, offset);
    if (validCode === cleanInput) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an actual scannable QR Code image URL for authenticator apps
 */
export function getAuthenticatorQRCodeURL(secretBase32: string, accountEmail: string): string {
  const label = encodeURIComponent(`PaperX:${accountEmail || 'user@paperx.app'}`);
  const issuer = encodeURIComponent('PaperX');
  const otpauth = `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauth)}`;
}

/**
 * Returns seconds remaining in current 30-second TOTP cycle
 */
export function getSecondsUntilNextTOTP(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}
