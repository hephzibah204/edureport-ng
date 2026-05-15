<?php

final class MailService
{
    /**
     * Send an email using PHP mail() with SMTP-compatible headers
     */
    public static function send(string $to, string $subject, string $htmlContent): bool
    {
        $fromName = Config::env('SMTP_FROM_NAME', 'EduReport NG');
        $fromEmail = Config::env('SMTP_FROM_EMAIL', 'notifications@edureport.ng');

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            "From: {$fromName} <{$fromEmail}>",
            "Reply-To: {$fromEmail}",
            'X-Mailer: PHP/' . phpversion()
        ];

        // Note: For real SMTP with authentication without external libs, 
        // the server's php.ini must be configured to use a tool like msmtp or postfix.
        // If the user wants a native PHP SMTP client implementation, it would be much larger.
        return @mail($to, $subject, self::wrapTemplate($subject, $htmlContent), implode("\r\n", $headers));
    }

    /**
     * Wrap content in a professional HTML layout
     */
    private static function wrapTemplate(string $title, string $content): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background: #1a6b3c; padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .body { padding: 40px 30px; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 12px 24px; background: #1a6b3c; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .accent { color: #1a6b3c; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EduReport <span>NG</span></h1>
        </div>
        <div class="body">
            <h2 style="margin-top: 0; color: #111;">{$title}</h2>
            {$content}
        </div>
        <div class="footer">
            &copy; 2026 EduReport NG Platform. All rights reserved.<br>
            Professional Nigerian School Management System.
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Welcome Email Template
     */
    public static function sendWelcome(string $email, string $schoolName): bool
    {
        $subject = "Welcome to EduReport NG — {$schoolName}";
        $content = <<<HTML
            <p>Hello <span class="accent">{$schoolName}</span>,</p>
            <p>Welcome to the future of school reporting! We are thrilled to have you onboard.</p>
            <p>Your school account has been successfully created. You can now start setting up your classes, adding students, and generating professional report cards in minutes.</p>
            <div style="text-align: center;">
                <a href="https://edureport.ng/login" class="btn">Access Your Dashboard</a>
            </div>
            <p style="margin-top: 30px;">If you have any questions, simply reply to this email. Our support team is here to help you excel.</p>
HTML;
        return self::send($email, $subject, $content);
    }

    /**
     * Report Ready Template
     */
    public static function sendReportReady(string $email, string $studentName, string $term): bool
    {
        $subject = "Term Report Card Ready: {$studentName}";
        $content = <<<HTML
            <p>Dear Parent,</p>
            <p>We are pleased to inform you that the report card for <span class="accent">{$studentName}</span> for the <span class="accent">{$term}</span> has been processed and is now available for viewing.</p>
            <p>You can log in to the parent portal to view, download, or print the report card.</p>
            <div style="text-align: center;">
                <a href="https://edureport.ng/portal" class="btn">View Report Card</a>
            </div>
            <p style="margin-top: 30px;">Thank you for your continued partnership in your child's education.</p>
HTML;
        return self::send($email, $subject, $content);
    }

    /**
     * Password Reset Template
     */
    public static function sendPasswordReset(string $email, string $resetLink): bool
    {
        $subject = "Reset Your EduReport Password";
        $content = <<<HTML
            <p>Hello,</p>
            <p>We received a request to reset the password for your EduReport NG account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center;">
                <a href="{$resetLink}" class="btn">Reset Password</a>
            </div>
            <p style="margin-top: 30px;">This link will expire in 1 hour for security reasons.</p>
HTML;
        return self::send($email, $subject, $content);
    }
}
