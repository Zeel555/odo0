const nodemailer = require('nodemailer');

/**
 * Optional: Resend (HTTPS API — works reliably on Render/Vercel backends; no SMTP firewall issues).
 * https://resend.com — create API key, verify a sending domain (or use onboarding@resend.dev for tests).
 */
function isResendConfigured() {
  return !!(process.env.RESEND_API_KEY && String(process.env.RESEND_API_KEY).trim());
}

/** Gmail App Password (recommended): only GMAIL_USER + GMAIL_APP_PASSWORD — no host/port needed. */
function isGmailConfigured() {
  const pass =
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_APP_PASS ||
    '';
  return !!(process.env.GMAIL_USER && pass.replace(/\s/g, ''));
}

/** Generic SMTP (other providers). */
function isSmtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

/**
 * True when we can send mail (Resend, Gmail app password, or full SMTP).
 */
function isMailConfigured() {
  return isResendConfigured() || isGmailConfigured() || isSmtpConfigured();
}

function getGmailAppPassword() {
  const raw =
    process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '';
  return raw.replace(/\s/g, '');
}

/** Nodemailer timeouts + IPv4 — fixes "Connection timeout" on many cloud hosts (Render, Railway, etc.). */
const SMTP_POOL_OPTIONS = {
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 60000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 30000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 60000),
  /** Prefer IPv4 — some regions hang on IPv6 to smtp.gmail.com */
  family: 4,
};

function getTransporter() {
  // 1) Gmail + App Password — explicit host/port (more reliable than service:'gmail' on PaaS)
  if (isGmailConfigured()) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER.trim(),
        pass: getGmailAppPassword(),
      },
      ...SMTP_POOL_OPTIONS,
      tls: { servername: 'smtp.gmail.com' },
    });
  }

  // 2) Explicit SMTP (SendGrid, Outlook, etc.)
  if (isSmtpConfigured()) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      ...SMTP_POOL_OPTIONS,
    });
  }

  return null;
}

function getResendFrom() {
  const name = (process.env.MAIL_FROM_NAME || 'RevoraX').replace(/"/g, '');
  const addr =
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    'onboarding@resend.dev';
  return `${name} <${addr}>`;
}

/**
 * @param {{ to: string, subject: string, html?: string, text?: string }} opts
 */
async function sendViaResend({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY.trim();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getResendFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.message ||
      (typeof data === 'object' && data.error?.message) ||
      JSON.stringify(data) ||
      res.statusText;
    throw new Error(msg);
  }
  return data;
}

function formatRole(role) {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * RevoraX-branded HTML invite (table layout for email clients).
 */
function buildInviteEmailHtml({
  recipientName,
  companyName,
  role,
  inviteUrl,
  expiresInHours = 24,
}) {
  const safeName = escapeHtml(recipientName || 'there');
  const safeCompany = escapeHtml(companyName || 'your team');
  const safeRole = escapeHtml(formatRole(role));
  const safeUrl = escapeHtml(inviteUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to RevoraX</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F9FF;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #CAF0F8;">
          <tr>
            <td style="background-color:#0077B6;padding:28px 32px;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em;">RevoraX</p>
                    <p style="margin:6px 0 0;font-size:12px;color:#CAF0F8;font-weight:500;">Product lifecycle & change management</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#03045E;line-height:1.35;">You're invited, ${safeName}</p>
              <p style="margin:14px 0 0;font-size:15px;color:#0077B6;line-height:1.55;">
                <strong style="color:#03045E;">${safeCompany}</strong> has invited you to join their workspace on <strong style="color:#03045E;">RevoraX</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#EAF6FB;border-radius:10px;border:1px solid #90E0EF;width:100%;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#0077B6;text-transform:uppercase;letter-spacing:0.08em;">Your role</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#03045E;">${safeRole}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a href="${safeUrl}" style="display:inline-block;background-color:#0077B6;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;border:1px solid #0077B6;">Accept invitation</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0;font-size:12px;color:#90E0EF;line-height:1.6;">
                Or paste this link into your browser:<br>
                <span style="color:#0077B6;word-break:break-all;">${safeUrl}</span>
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#90E0EF;">
                This link expires in <strong style="color:#03045E;">${expiresInHours} hours</strong>. If you didn't expect this email, you can ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F0F9FF;padding:20px 32px;border-top:1px solid #CAF0F8;">
              <p style="margin:0;font-size:11px;color:#90E0EF;text-align:center;line-height:1.5;">
                Sent by RevoraX · Engineering change & master data in one place
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildInviteEmailText({
  recipientName,
  companyName,
  role,
  inviteUrl,
  expiresInHours = 24,
}) {
  const name = recipientName || 'there';
  const co = companyName || 'your team';
  return [
    `Hi ${name},`,
    '',
    `${co} has invited you to join their workspace on RevoraX (product lifecycle & change management).`,
    '',
    `Role: ${formatRole(role)}`,
    '',
    `Accept your invitation (expires in ${expiresInHours} hours):`,
    inviteUrl,
    '',
    "If you didn't expect this email, you can ignore it.",
    '',
    '— RevoraX',
  ].join('\n');
}

function nodemailerFromHeader() {
  const fromName = process.env.MAIL_FROM_NAME || 'RevoraX';
  const fromAddr =
    process.env.MAIL_FROM ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER;
  const from = `"${fromName.replace(/"/g, '')}" <${fromAddr}>`;
  return from;
}

/**
 * Sends team invite email. Returns { sent: boolean, error?: string }.
 * When SMTP is not configured, returns { sent: false, error: '...' } without throwing.
 */
async function sendInviteEmail({
  to,
  recipientName,
  companyName,
  role,
  inviteUrl,
  expiresInHours = 24,
}) {
  const subject = `${companyName ? `${companyName} · ` : ''}You're invited to RevoraX`;
  const text = buildInviteEmailText({
    recipientName,
    companyName,
    role,
    inviteUrl,
    expiresInHours,
  });
  const html = buildInviteEmailHtml({
    recipientName,
    companyName,
    role,
    inviteUrl,
    expiresInHours,
  });

  if (isResendConfigured()) {
    try {
      await sendViaResend({ to, subject, text, html });
      return { sent: true };
    } catch (err) {
      console.error('[mail] sendInviteEmail (Resend) failed:', err.message);
      return {
        sent: false,
        error:
          'Email could not be sent (Resend). Check RESEND_API_KEY and verified sender domain, or copy the invite link from the UI.',
      };
    }
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      error:
        'Email not configured. Add RESEND_API_KEY (recommended for Render) or GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_* in server env.',
    };
  }

  const from = nodemailerFromHeader();

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] sendInviteEmail failed:', err.message);
    return {
      sent: false,
      error:
        'Email could not be sent. On cloud hosts, use Resend (RESEND_API_KEY) or verify SMTP reaches the internet. Copy the invite link below or check mail env vars.',
    };
  }
}

/**
 * Simple transactional email (ECO notifications, etc.)
 */
async function sendPlainEmail({ to, subject, text, html }) {
  if (isResendConfigured()) {
    try {
      await sendViaResend({
        to,
        subject,
        text: text || '',
        html: html || text || '',
      });
      return { sent: true };
    } catch (err) {
      console.error('[mail] sendPlainEmail (Resend) failed:', err.message);
      return { sent: false };
    }
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false };
  }
  const from = nodemailerFromHeader();
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: text || '',
      html: html || text || '',
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] sendPlainEmail failed:', err.message);
    return { sent: false };
  }
}

module.exports = {
  isMailConfigured,
  sendInviteEmail,
  sendPlainEmail,
};
