/**
 * Email Notification Service for ReportSheet
 * Handles templates and sending via Resend API
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

  // --- Templates ---

  static getBaseTemplate(content: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #141412; margin: 0; padding: 0; background-color: #faf8f3; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e0d8; }
          .header { background: #1a6b3c; color: #ffffff; padding: 30px; text-align: center; }
          .content { padding: 40px; }
          .footer { background: #f5f3ee; color: #7c7a76; padding: 20px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #1a6b3c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .info-box { background: #fdecea; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(192, 57, 43, 0.1); }
          h1 { margin: 0; font-size: 24px; }
          p { margin: 0 0 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ReportSheet<span style="font-weight: normal; opacity: 0.7;">NG</span></h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ReportSheet Nigerian School Portal. All rights reserved.<br>
            Hephtech Innovations
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getWelcomeAdminTemplate(schoolName: string, loginUrl: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Welcome to the future of school management!</h2>
      <p>Hello Administrator,</p>
      <p>Congratulations! Your school, <strong>${schoolName}</strong>, has been successfully registered on ReportSheet NG.</p>
      <p>You can now start adding your teachers, registering students, and recording academic results with zero arithmetic errors.</p>
      <a href="${loginUrl}" class="btn">Access Your Dashboard</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Need help? Reply to this email or visit our documentation.</p>
    `);
  }

  static getStaffInviteTemplate(schoolName: string, name: string, email: string, password: string, loginUrl: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">You've been invited!</h2>
      <p>Hello ${name},</p>
      <p>The management of <strong>${schoolName}</strong> has created a staff account for you on their official portal.</p>
      <div class="info-box" style="background: #e8f5ee; border-color: #1a6b3c; color: #0d4526;">
        <p style="margin-bottom: 5px;"><strong>Your Login Credentials:</strong></p>
        <p>Email: ${email}<br>Password: ${password}</p>
      </div>
      <p>Please log in and change your password immediately to ensure your account is secure.</p>
      <a href="${loginUrl}" class="btn">Login to Staff Portal</a>
    `);
  }

  static getParentInviteTemplate(schoolName: string, parentName: string, studentName: string, email: string, password: string, loginUrl: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Access Your Child's Results Online</h2>
      <p>Hello ${parentName},</p>
      <p><strong>${schoolName}</strong> has activated your parent portal access. You can now view academic reports and attendance records for <strong>${studentName}</strong> from your phone or computer.</p>
      <div class="info-box" style="background: #fff8e8; border-color: #c8902a; color: #3d3b38;">
        <p style="margin-bottom: 5px;"><strong>Your Access Details:</strong></p>
        <p>Login Email: ${email}<br>Temporary Password: ${password}</p>
      </div>
      <a href="${loginUrl}" class="btn" style="background-color: #c8902a;">Open Result Portal</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Keep your password safe. Do not share it with anyone.</p>
    `);
  }

  static getPaymentSuccessTemplate(schoolName: string, planName: string, amount: string, reference: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Payment Confirmed!</h2>
      <p>Thank you for your payment.</p>
      <p>The subscription for <strong>${schoolName}</strong> has been successfully upgraded to the <strong>${planName}</strong> plan.</p>
      <div class="info-box" style="background: #e8f5ee; border-color: #1a6b3c; color: #0d4526;">
        <p><strong>Transaction Details:</strong></p>
        <p>Amount: ${amount}<br>Reference: ${reference}<br>Status: Success</p>
      </div>
      <p>Your new features are now active. Thank you for choosing ReportSheet!</p>
    `);
  }

  static getPasswordResetTemplate(name: string, resetUrl: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your ReportSheet account password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
    `);
  }

  static getUpgradeReminderTemplate(schoolName: string, daysLeft: number, upgradeUrl: string) {
    const isExpired = daysLeft <= 0;
    const title = isExpired ? "Your Trial has Expired" : `Only ${daysLeft} Days Left in Your Trial`;
    const message = isExpired 
      ? `Your free trial for <strong>${schoolName}</strong> has ended. To continue managing your school and accessing student records, please upgrade to a premium plan.`
      : `We hope you're enjoying your experience with ReportSheet NG! This is a friendly reminder that your free trial for <strong>${schoolName}</strong> will end in ${daysLeft} days.`;

    return this.getBaseTemplate(`
      <h2 style="color: ${isExpired ? '#c0392b' : '#1a6b3c'};">${title}</h2>
      <p>Hello Administrator,</p>
      <p>${message}</p>
      <div class="info-box" style="background: ${isExpired ? '#fdecea' : '#e8f5ee'}; border-color: ${isExpired ? '#c0392b' : '#1a6b3c'}; color: ${isExpired ? '#c0392b' : '#0d4526'};">
        <p><strong>Subscription Status:</strong> ${isExpired ? 'EXPIRED' : 'FREE TRIAL'}</p>
        <p>Keep your data safe and unlock unlimited report generation by upgrading today.</p>
      </div>
      <a href="${upgradeUrl}" class="btn" style="background-color: ${isExpired ? '#c0392b' : '#1a6b3c'};">Upgrade to Premium</a>
      <p style="margin-top: 30px; font-size: 13px; color: #7c7a76;">Need more time? Contact our support team to discuss your needs.</p>
    `);
  }

  static getStudentInviteTemplate(schoolName: string, studentName: string, email: string, password: string, loginUrl: string) {
    return this.getBaseTemplate(`
      <h2 style="color: #1a6b3c;">Your Student Portal is Ready!</h2>
      <p>Hello ${studentName},</p>
      <p><strong>${schoolName}</strong> has created your personal student portal. You can now log in to track your attendance, view your term results, and access study materials.</p>
      <div class="info-box" style="background: #e8eef7; border-color: #1a4f8c; color: #1a4f8c;">
        <p style="margin-bottom: 5px;"><strong>Your Portal Access:</strong></p>
        <p>Email: ${email}<br>Temporary Password: ${password}</p>
      </div>
      <p>Log in using the button below and change your password to something you'll remember.</p>
      <a href="${loginUrl}" class="btn" style="background-color: #1a4f8c;">Login to Student Portal</a>
    `);
  }
}
