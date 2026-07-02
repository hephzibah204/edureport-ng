/**
 * Email Notification Service for ReportSheet
 * Handles templates and sending via Resend API
 * 
 * Premium email templates with modern design
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(env: any) {
    this.apiKey = env.RESEND_API_KEY || "";
    this.fromEmail = env.SMTP_FROM_EMAIL || "notifications@reportsheet.com.ng";
    this.fromName = env.SMTP_FROM_NAME || "ReportSheet NG";
  }

  async send(options: EmailOptions) {
    if (!this.apiKey) {
      console.warn("Email skipped: RESEND_API_KEY is not set.");
      return { success: false, message: "API key missing" };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      console.error("Email send failed:", err);
      return { success: false, error: err };
    }
  }

  // ─── Design Tokens ─────────────────────────────────────────
  private static colors = {
    brand: '#4f46e5',       // Indigo
    brandDark: '#3730a3',
    brandLight: '#eef2ff',
    success: '#059669',
    successLight: '#ecfdf5',
    warning: '#d97706',
    warningLight: '#fffbeb',
    danger: '#dc2626',
    dangerLight: '#fef2f2',
    info: '#0284c7',
    infoLight: '#f0f9ff',
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    divider: '#f1f5f9',
  };

  // ─── Base Template ─────────────────────────────────────────
  static getBaseTemplate(content: string, accentColor: string = '#4f46e5', preheader: string = '') {
    const c = this.colors;
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ReportSheet NG</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 12px !important; }
      .content-cell { padding: 28px 20px !important; }
      .header-cell { padding: 24px 20px !important; }
      .btn-cell a { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${c.bg};font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader || 'ReportSheet NG Notification'}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" style="background-color:${c.bg};padding:24px 0 40px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="580" style="max-width:580px;width:100%;margin:0 auto;">

          <!-- Logo Bar -->
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <table role="presentation">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:36px;height:36px;background:${accentColor};border-radius:10px;display:inline-block;text-align:center;line-height:36px;">
                      <span style="color:#ffffff;font-size:16px;font-weight:800;font-family:'Inter',sans-serif;">R</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:18px;font-weight:800;color:${c.text};font-family:'Inter',sans-serif;letter-spacing:-0.5px;">Report<span style="color:${accentColor};">Sheet</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" style="background:${c.cardBg};border-radius:16px;overflow:hidden;border:1px solid ${c.border};box-shadow:0 1px 3px rgba(0,0,0,0.04),0 6px 16px rgba(0,0,0,0.04);">

                <!-- Accent top border -->
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg, ${accentColor}, ${accentColor}cc);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Content -->
                <tr>
                  <td class="content-cell" style="padding:40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 16px 0;text-align:center;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="border-top:1px solid ${c.divider};padding-top:20px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:12px;color:${c.textMuted};font-family:'Inter',sans-serif;">
                      &copy; ${new Date().getFullYear()} ReportSheet NG &mdash; Smart School Management
                    </p>
                    <p style="margin:0;font-size:11px;color:${c.textMuted};font-family:'Inter',sans-serif;">
                      Built with ❤️ by Hephtech Innovations
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ─── Reusable Components ───────────────────────────────────

  private static badge(label: string, bgColor: string, textColor: string) {
    return `<span style="display:inline-block;background:${bgColor};color:${textColor};font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;font-family:'Inter',sans-serif;">${label}</span>`;
  }

  private static button(text: string, url: string, color: string = '#4f46e5') {
    return `
    <table role="presentation" width="100%" style="margin:28px 0 8px;">
      <tr>
        <td class="btn-cell" align="center">
          <a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.2px;box-shadow:0 2px 8px ${color}44;">
            ${text} &rarr;
          </a>
        </td>
      </tr>
    </table>`;
  }

  private static infoCard(title: string, body: string, bgColor: string, borderColor: string, iconEmoji: string = '📋') {
    return `
    <table role="presentation" width="100%" style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid ${borderColor};">
      <tr>
        <td style="background:${bgColor};padding:20px 24px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="vertical-align:top;width:28px;padding-right:12px;">
                <span style="font-size:18px;">${iconEmoji}</span>
              </td>
              <td>
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${borderColor};font-family:'Inter',sans-serif;">${title}</p>
                <div style="font-size:14px;color:#1e293b;line-height:1.6;font-family:'Inter',sans-serif;">${body}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  }

  private static credentialRow(label: string, value: string) {
    return `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;width:120px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:700;font-family:'Inter',sans-serif;word-break:break-all;">${value}</td>
    </tr>`;
  }

  private static credentialTable(rows: string) {
    return `
    <table role="presentation" width="100%" style="margin:4px 0;">
      ${rows}
    </table>`;
  }

  private static heading(text: string, color: string = '#1e293b') {
    return `<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${color};font-family:'Inter',sans-serif;letter-spacing:-0.5px;line-height:1.3;">${text}</h2>`;
  }

  private static subtext(text: string) {
    return `<p style="margin:0 0 24px;font-size:15px;color:#64748b;font-family:'Inter',sans-serif;line-height:1.6;">${text}</p>`;
  }

  private static paragraph(text: string) {
    return `<p style="margin:0 0 16px;font-size:15px;color:#334155;font-family:'Inter',sans-serif;line-height:1.7;">${text}</p>`;
  }

  private static divider() {
    return `<hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;">`;
  }

  private static footnote(text: string) {
    return `<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;font-family:'Inter',sans-serif;line-height:1.5;">${text}</p>`;
  }

  private static featureList(items: string[]) {
    return items.map(item =>
      `<tr>
        <td style="padding:6px 0;font-size:14px;color:#334155;font-family:'Inter',sans-serif;">
          <span style="color:#059669;font-weight:700;margin-right:8px;">✓</span> ${item}
        </td>
      </tr>`
    ).join('');
  }

  // ─── Email Templates ──────────────────────────────────────

  static getWelcomeAdminTemplate(schoolName: string, loginUrl: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Welcome Aboard', c.brandLight, c.brand)}
      <div style="height:16px;"></div>
      ${this.heading('Your school is live! 🎉')}
      ${this.subtext(`Everything is set up and ready for <strong style="color:${c.text};">${schoolName}</strong>.`)}

      ${this.paragraph('Congratulations on taking a bold step towards digital school management. ReportSheet NG gives you everything you need to run your school efficiently.')}

      ${this.infoCard('What you can do now', `
        <table role="presentation" width="100%">
          ${this.featureList([
            'Add teachers & assign classes',
            'Register students & guardians',
            'Record CA & exam scores with auto-computation',
            'Generate stunning report cards in seconds',
            'Track attendance & behavioral traits'
          ])}
        </table>
      `, c.brandLight, c.brand, '🚀')}

      ${this.button('Open Your Dashboard', loginUrl, c.brand)}

      ${this.footnote('Need help getting started? Simply reply to this email and our team will guide you through the setup process.')}
    `, c.brand, `Welcome to ReportSheet NG - ${schoolName} is now live!`);
  }

  static getStaffInviteTemplate(schoolName: string, name: string, email: string, password: string, loginUrl: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Staff Invitation', c.brandLight, c.brand)}
      <div style="height:16px;"></div>
      ${this.heading(`Hello ${name} 👋`)}
      ${this.subtext(`You've been added as a staff member at <strong style="color:${c.text};">${schoolName}</strong>.`)}

      ${this.paragraph('The school administration has created your portal account. You can now access your classes, enter student scores, and manage academic records digitally.')}

      ${this.infoCard('Your Login Credentials', this.credentialTable(
        this.credentialRow('Email', email) +
        this.credentialRow('Password', `<code style="background:#f1f5f9;padding:3px 8px;border-radius:6px;font-size:14px;color:${c.brand};font-family:monospace;">${password}</code>`)
      ), c.brandLight, c.brand, '🔑')}

      ${this.button('Login to Staff Portal', loginUrl, c.brand)}

      ${this.divider()}
      ${this.footnote('⚠️ For security, please change your password immediately after your first login. Do not share these credentials with anyone.')}
    `, c.brand, `${schoolName} has invited you to join their staff portal`);
  }

  static getParentInviteTemplate(schoolName: string, parentName: string, studentName: string, email: string, password: string, loginUrl: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Parent Portal Access', c.warningLight, c.warning)}
      <div style="height:16px;"></div>
      ${this.heading(`Dear ${parentName}`)}
      ${this.subtext(`Stay connected to <strong style="color:${c.text};">${studentName}'s</strong> academic progress.`)}

      ${this.paragraph(`<strong>${schoolName}</strong> has activated your parent portal. You can now view your child's term results, attendance records, and teacher comments from the comfort of your phone or computer.`)}

      ${this.infoCard('Your Access Details', this.credentialTable(
        this.credentialRow('Student', `<strong>${studentName}</strong>`) +
        this.credentialRow('Login Email', email) +
        this.credentialRow('Password', `<code style="background:#fef3c7;padding:3px 8px;border-radius:6px;font-size:14px;color:${c.warning};font-family:monospace;">${password}</code>`)
      ), c.warningLight, c.warning, '👨‍👩‍👧')}

      ${this.button('View Your Child\'s Results', loginUrl, c.warning)}

      ${this.divider()}
      ${this.footnote('🔒 Keep your password safe. Do not share it with anyone. If you have questions, please contact the school administration.')}
    `, c.warning, `Access ${studentName}'s results on ${schoolName}'s portal`);
  }

  static getPaymentSuccessTemplate(schoolName: string, planName: string, amount: string, reference: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Payment Successful', c.successLight, c.success)}
      <div style="height:16px;"></div>
      ${this.heading('Payment Confirmed ✅')}
      ${this.subtext(`Thank you! <strong style="color:${c.text};">${schoolName}</strong> is now on the <strong style="color:${c.success};">${planName}</strong> plan.`)}

      ${this.infoCard('Transaction Receipt', `
        <table role="presentation" width="100%" style="margin:4px 0;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #d1fae5;">
              <span style="font-size:12px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">School</span><br>
              <span style="font-size:15px;color:#1e293b;font-weight:700;font-family:'Inter',sans-serif;">${schoolName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #d1fae5;">
              <span style="font-size:12px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">Plan</span><br>
              <span style="font-size:15px;color:#059669;font-weight:800;font-family:'Inter',sans-serif;">${planName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #d1fae5;">
              <span style="font-size:12px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">Amount Paid</span><br>
              <span style="font-size:20px;color:#1e293b;font-weight:800;font-family:'Inter',sans-serif;">${amount}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <span style="font-size:12px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">Reference</span><br>
              <code style="font-size:13px;color:#64748b;font-family:monospace;background:#ecfdf5;padding:2px 6px;border-radius:4px;">${reference}</code>
            </td>
          </tr>
        </table>
      `, c.successLight, c.success, '🧾')}

      ${this.paragraph('All premium features are now unlocked. Your school can continue generating report cards, managing students, and tracking performance without limits.')}

      ${this.footnote('This is an automated receipt. Please keep this email for your records. If you have any billing questions, contact us at support@reportsheet.com.ng.')}
    `, c.success, `Payment confirmed - ${schoolName} upgraded to ${planName}`);
  }

  static getPasswordResetTemplate(name: string, resetUrl: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Security Alert', c.dangerLight, c.danger)}
      <div style="height:16px;"></div>
      ${this.heading('Reset Your Password 🔐')}
      ${this.subtext(`Hi <strong style="color:${c.text};">${name}</strong>, we received a request to reset your password.`)}

      ${this.paragraph('Click the button below to set a new password. This link is valid for <strong>1 hour</strong> and can only be used once.')}

      ${this.button('Reset My Password', resetUrl, c.danger)}

      ${this.infoCard('Didn\'t request this?', `
        <p style="margin:0;font-size:13px;color:#334155;font-family:'Inter',sans-serif;line-height:1.6;">
          If you didn't make this request, you can safely ignore this email. Your password will remain unchanged and your account is secure.
        </p>
      `, c.dangerLight, c.danger, '🛡️')}

      ${this.footnote('For security, never share this link with anyone. ReportSheet will never ask for your password via email.')}
    `, c.danger, 'Password reset request for your ReportSheet account');
  }

  static getUpgradeReminderTemplate(schoolName: string, daysLeft: number, upgradeUrl: string) {
    const c = this.colors;
    const isExpired = daysLeft <= 0;
    const accent = isExpired ? c.danger : c.warning;
    const accentLight = isExpired ? c.dangerLight : c.warningLight;
    const title = isExpired ? 'Your Trial Has Expired' : `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left in Your Trial`;
    const emoji = isExpired ? '⏰' : '⏳';
    const badgeLabel = isExpired ? 'Action Required' : 'Trial Reminder';

    const message = isExpired
      ? `The free trial for <strong>${schoolName}</strong> has ended. Your data is safe, but access to features is now restricted. Upgrade today to continue managing your school seamlessly.`
      : `We hope you're enjoying ReportSheet NG! Just a friendly reminder that your free trial for <strong>${schoolName}</strong> will end in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.`;

    return this.getBaseTemplate(`
      ${this.badge(badgeLabel, accentLight, accent)}
      <div style="height:16px;"></div>
      ${this.heading(`${title} ${emoji}`)}
      ${this.subtext('Don\'t lose access to your school management tools.')}

      ${this.paragraph(message)}

      ${this.infoCard('Subscription Status', `
        <table role="presentation" width="100%">
          <tr>
            <td style="padding:4px 0;">
              <span style="font-size:13px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">Status:</span>
              <span style="font-size:13px;color:${accent};font-weight:800;font-family:'Inter',sans-serif;margin-left:8px;">${isExpired ? '🔴 EXPIRED' : '🟡 FREE TRIAL'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;">
              <span style="font-size:13px;color:#64748b;font-weight:600;font-family:'Inter',sans-serif;">School:</span>
              <span style="font-size:13px;color:#1e293b;font-weight:700;font-family:'Inter',sans-serif;margin-left:8px;">${schoolName}</span>
            </td>
          </tr>
        </table>
      `, accentLight, accent, '📊')}

      <table role="presentation" width="100%" style="margin:20px 0;border-radius:12px;overflow:hidden;background:linear-gradient(135deg, ${accent}11, ${accent}08);">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:${accent};font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Pricing starts from</p>
            <p style="margin:0;font-size:28px;font-weight:800;color:${c.text};font-family:'Inter',sans-serif;">₦5,000<span style="font-size:14px;color:${c.textSecondary};font-weight:500;"> /term</span></p>
          </td>
        </tr>
      </table>

      ${this.button(isExpired ? 'Upgrade Now' : 'View Plans & Upgrade', upgradeUrl, accent)}

      ${this.footnote('Need more time or have questions? Reply to this email and we\'ll be happy to help.')}
    `, accent, `${isExpired ? 'Your trial has expired' : `${daysLeft} days left`} - ${schoolName}`);
  }

  static getStudentInviteTemplate(schoolName: string, studentName: string, email: string, password: string, loginUrl: string) {
    const c = this.colors;
    return this.getBaseTemplate(`
      ${this.badge('Student Portal', c.infoLight, c.info)}
      <div style="height:16px;"></div>
      ${this.heading(`Hey ${studentName}! 🎓`)}
      ${this.subtext(`Your student portal at <strong style="color:${c.text};">${schoolName}</strong> is ready.`)}

      ${this.paragraph('Your school has set up a personal portal for you. You can now check your exam results, track your attendance, and stay on top of your academic performance.')}

      ${this.infoCard('Your Portal Access', this.credentialTable(
        this.credentialRow('Email', email) +
        this.credentialRow('Password', `<code style="background:#e0f2fe;padding:3px 8px;border-radius:6px;font-size:14px;color:${c.info};font-family:monospace;">${password}</code>`)
      ), c.infoLight, c.info, '🎒')}

      ${this.button('Login to Student Portal', loginUrl, c.info)}

      ${this.divider()}
      ${this.footnote('🔐 Please change your password after your first login. Keep your credentials private and do not share them with classmates.')}
    `, c.info, `${studentName}, your student portal is ready at ${schoolName}`);
  }
}
