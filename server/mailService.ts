import nodemailer from 'nodemailer';

/**
 * Mail service helper for sending real password reset, email change verification codes, and official receipts.
 *
 * Configured via standard SMTP environment variables:
 * - SMTP_HOST (default: smtp.gmail.com)
 * - SMTP_PORT (default: 465)
 * - SMTP_USER (e.g. paperx.assist@gmail.com)
 * - SMTP_PASS (App Password: 16 characters)
 * - SMTP_FROM (e.g. "PaperX Security" <paperx.assist@gmail.com> or "PaperX Billing" <paperx.assist@gmail.com>)
 */

let cachedTransporter: nodemailer.Transporter | null = null;

export function getSenderAddress(category: 'Security' | 'Billing' | 'Default' = 'Default'): string {
  const user = (process.env.SMTP_USER || 'paperx.assist@gmail.com').trim().replace(/\s+/g, '');
  const envFrom = (process.env.SMTP_FROM || '').trim();

  if (envFrom) {
    // If SMTP_FROM contains an email address in angle brackets, e.g. "Name" <email@domain.com>
    const match = envFrom.match(/<([^>]+)>/);
    const email = match ? match[1].trim() : (envFrom.includes('@') ? envFrom : user);
    
    if (category === 'Billing') {
      return `"PaperX Billing" <${email}>`;
    } else if (category === 'Security') {
      return `"PaperX Security" <${email}>`;
    }
    return envFrom;
  }

  const categoryName = category === 'Default' ? 'PaperX Cloud' : `PaperX ${category}`;
  return `"${categoryName}" <${user}>`;
}

export async function getMailTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = (process.env.SMTP_USER || 'paperx.assist@gmail.com').trim().replace(/\s+/g, '');
  const pass = (process.env.SMTP_PASS || 'hiuixelnwavcbdor').trim().replace(/\s+/g, '');

  if (user && pass) {
    if (host === 'smtp.gmail.com' || user.endsWith('@gmail.com')) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        pool: true,
        maxConnections: 5,
        maxMessages: Infinity,
        rateDelta: 1000,
        rateLimit: 10,
        socketTimeout: 20000,
        connectionTimeout: 10000,
        greetingTimeout: 5000
      });
    } else {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        pool: true,
        maxConnections: 5,
        maxMessages: Infinity,
        socketTimeout: 20000,
        connectionTimeout: 10000,
        auth: { user, pass }
      });
    }
    return cachedTransporter;
  }

  // Fallback safe transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    return cachedTransporter;
  } catch {
    cachedTransporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
    return cachedTransporter;
  }
}

/**
 * Pre-warms the SMTP transporter connection on server boot for instant delivery.
 */
export async function initMailService(): Promise<void> {
  try {
    const transporter = await getMailTransporter();
    await transporter.verify();
    console.log('[MAIL SERVICE] SMTP connection pre-warmed & ready for instant delivery.');
  } catch (err: any) {
    console.warn('[MAIL SERVICE] SMTP pre-warm notice:', err?.message || err);
  }
}

/**
 * Tests and verifies the current SMTP connection configuration.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string; user?: string }> {
  try {
    const transporter = await getMailTransporter();
    const isVerified = await transporter.verify();
    const user = (process.env.SMTP_USER || 'paperx.assist@gmail.com').trim();
    return {
      success: !!isVerified,
      message: 'SMTP credentials verified successfully with mail server.',
      user
    };
  } catch (err: any) {
    console.error('[SMTP VERIFY ERROR]:', err);
    return {
      success: false,
      message: err?.message || 'Failed to verify SMTP credentials.'
    };
  }
}

/**
 * Renders the PaperX brand header with the customized 𝕻𝖆𝖕𝖊𝖗𝖃 font mark.
 */
function getBrandLogoHtml(): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 auto 24px auto;">
      <tr>
        <td align="center">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; margin: 0; line-height: 1.2;">
            𝕻𝖆𝖕𝖊𝖗𝖃
          </div>
        </td>
      </tr>
    </table>
  `;
}

export async function sendPasswordResetOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; previewUrl?: string }> {
  try {
    const transporter = await getMailTransporter();
    const fromAddress = getSenderAddress('Security');
    const brandHtml = getBrandLogoHtml();

    const otpDigits = otpCode.split('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your PaperX Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
                
                <!-- Main Content Area -->
                <tr>
                  <td style="padding: 40px 36px 32px 36px; text-align: left;">
                    ${brandHtml}
                    
                    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: #0f172a; margin: 0 0 10px 0; line-height: 1.25; text-align: center;">
                      Password Reset Verification
                    </h1>
                    
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
                      We received a request to reset the password for your PaperX account. Use the one-time verification code below to proceed:
                    </p>

                    <!-- 6-Box Verification Display -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 32px auto;">
                      <tr>
                        ${otpDigits.map(d => `
                          <td style="padding: 0 4px;">
                            <div style="width: 44px; height: 52px; line-height: 52px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 26px; font-weight: 800; color: #0f172a; text-align: center;">
                              ${d}
                            </div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>

                    <!-- Step-by-Step Instructions -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 12px;">
                        How to complete your password reset:
                      </div>
                      <ol style="margin: 0; padding-left: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #334155; line-height: 1.65;">
                        <li style="margin-bottom: 6px;">
                          <strong>Return to PaperX:</strong> Open your active browser tab or app screen.
                        </li>
                        <li style="margin-bottom: 6px;">
                          <strong>Enter Code:</strong> Type or paste the 6-digit code into the verification boxes.
                        </li>
                        <li style="margin-bottom: 6px;">
                          <strong>Set New Password:</strong> Create a strong password with at least 8 characters including letters, numbers, and special symbols.
                        </li>
                        <li style="margin-bottom: 0;">
                          <strong>Sign In:</strong> Log in with your updated credentials across your devices.
                        </li>
                      </ol>
                    </div>

                    <!-- Security Details & Expiration -->
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 8px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5;">
                            • <strong>Validity:</strong> This single-use code will expire in <strong>15 minutes</strong>.<br>
                            • <strong>Security:</strong> PaperX staff will never ask for your verification code.<br>
                            • <strong>Didn't request this?</strong> If you did not initiate this reset, please ignore this email. Your current password remains completely secure.
                          </td>
                        </tr>
                      </table>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 18px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #475569; margin: 0 0 3px 0; letter-spacing: 0.5px; text-transform: uppercase;">
                      PaperX Security Desk
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #94a3b8; margin: 0;">
                      Automated security notification • PaperX Cloud Suite
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your PaperX Password Reset Code: ${otpCode}`,
      text: `Your PaperX password reset code is: ${otpCode}. Enter this 6-digit code on the PaperX verification screen. This code expires in 15 minutes. If you did not request this, you can safely ignore this email.`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'Priority': 'urgent',
        'Importance': 'high',
        'X-MSMail-Priority': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });

    console.log(`[MAIL SERVICE] Reset code email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[MAIL SERVICE] Failed to send email to ${toEmail}:`, error);
    return { success: false };
  }
}

export async function sendEmailChangeOtpEmail(toEmail: string, otpCode: string, isNewEmail: boolean): Promise<{ success: boolean }> {
  try {
    const transporter = await getMailTransporter();
    const fromAddress = getSenderAddress('Security');
    const brandHtml = getBrandLogoHtml();
    const title = isNewEmail ? "Verify Your New Email" : "Verify Email Change";
    const otpDigits = otpCode.split('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
                
                <!-- Main Content Area -->
                <tr>
                  <td style="padding: 40px 36px 32px 36px; text-align: left;">
                    ${brandHtml}
                    
                    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: #0f172a; margin: 0 0 10px 0; line-height: 1.25; text-align: center;">
                      ${title}
                    </h1>
                    
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
                      Enter the 6-digit verification code below on PaperX to confirm and verify your email address:
                    </p>

                    <!-- 6-Box Verification Display -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 32px auto;">
                      <tr>
                        ${otpDigits.map(d => `
                          <td style="padding: 0 4px;">
                            <div style="width: 44px; height: 52px; line-height: 52px; background-color: #f8fafc; border: 1.5px solid #0f172a; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 26px; font-weight: 800; color: #0f172a; text-align: center;">
                              ${d}
                            </div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>

                    <!-- Step-by-Step Instructions -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-bottom: 12px;">
                        Instructions:
                      </div>
                      <ol style="margin: 0; padding-left: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #334155; line-height: 1.65;">
                        <li style="margin-bottom: 6px;">
                          <strong>Return to PaperX:</strong> Switch back to your profile or verification screen.
                        </li>
                        <li style="margin-bottom: 6px;">
                          <strong>Enter Code:</strong> Type or paste the 6 digits into the input fields.
                        </li>
                        <li style="margin-bottom: 0;">
                          <strong>Confirm:</strong> Click confirm to save and activate your updated email address.
                        </li>
                      </ol>
                    </div>

                    <!-- Security Details & Expiration -->
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-bottom: 8px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5;">
                            • <strong>Validity:</strong> This code is valid for <strong>15 minutes</strong>.<br>
                            • <strong>Security:</strong> Never share this code with anyone.<br>
                            • <strong>Didn't request this?</strong> If you did not make this change, please check your account security immediately.
                          </td>
                        </tr>
                      </table>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 18px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #475569; margin: 0 0 3px 0; letter-spacing: 0.5px; text-transform: uppercase;">
                      PaperX Security Desk
                    </p>
                    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #94a3b8; margin: 0;">
                      Automated security notification • PaperX Cloud Suite
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `PaperX Email Verification Code: ${otpCode}`,
      text: `Your PaperX email verification code is: ${otpCode}. Copy ${otpCode} and paste it into PaperX. PaperX staff will NEVER ask for this code. Valid for 15 minutes.`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'Priority': 'urgent',
        'Importance': 'high',
        'X-MSMail-Priority': 'High',
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    });

    console.log(`[MAIL SERVICE] Email change OTP sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`[MAIL SERVICE] Failed to send email change OTP to ${toEmail}:`, error);
    return { success: false };
  }
}

