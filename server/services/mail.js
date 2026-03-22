const nodemailer = require('nodemailer');

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
 * True when we can send mail (Gmail app password OR full SMTP).
 */
function isMailConfigured() {
  return isGmailConfigured() || isSmtpConfigured();
}

function getGmailAppPassword() {
  const raw =
    process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '';
  return raw.replace(/\s/g, '');
}

function getTransporter() {
  // 1) Gmail + App Password — uses Nodemailer's built-in Gmail transport (no SMTP_* in .env)
  if (isGmailConfigured()) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER.trim(),
        pass: getGmailAppPassword(),
      },
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
    });
  }

  return null;
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
  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      error:
        'Email not configured. Add GMAIL_USER + GMAIL_APP_PASSWORD (Gmail) or SMTP_HOST + SMTP_USER + SMTP_PASS in server .env.',
    };
  }

  const fromName = process.env.MAIL_FROM_NAME || 'RevoraX';
  const fromAddr =
    process.env.MAIL_FROM ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER;
  const from = `"${fromName.replace(/"/g, '')}" <${fromAddr}>`;

  const subject = `${companyName ? `${companyName} · ` : ''}You're invited to RevoraX`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: buildInviteEmailText({
        recipientName,
        companyName,
        role,
        inviteUrl,
        expiresInHours,
      }),
      html: buildInviteEmailHtml({
        recipientName,
        companyName,
        role,
        inviteUrl,
        expiresInHours,
      }),
    });
    return { sent: true };
  } catch (err) {
    console.error('[mail] sendInviteEmail failed:', err.message);
    return {
      sent: false,
      error:
        'Email could not be sent. Copy the invite link below or check GMAIL_APP_PASSWORD / mail settings on the server.',
    };
  }
}

/**
 * Simple transactional email (ECO notifications, etc.)
 */
async function sendPlainEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false };
  }
  const fromName = process.env.MAIL_FROM_NAME || 'RevoraX';
  const fromAddr =
    process.env.MAIL_FROM ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER;
  const from = `"${fromName.replace(/"/g, '')}" <${fromAddr}>`;
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
