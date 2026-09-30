import nodemailer from "nodemailer";

// Create a transporter – uses Ethereal (fake SMTP) when credentials are not set
const createTransporter = () => {
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    // Fallback: log to console (dev mode)
    return null;
};

/**
 * Send an email.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
export const sendEmail = async ({ to, subject, html }) => {
    const transporter = createTransporter();

    if (!transporter) {
        // In dev, just log the email instead of sending
        console.log("\n========== EMAIL (dev mode) ==========");
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`BODY: ${html}`);
        console.log("======================================\n");
        return;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@projectcamp.com",
        to,
        subject,
        html,
    });
};

// Email templates
export const emailVerificationTemplate = (username, verificationLink) => ({
    subject: "Verify your email – Project Camp",
    html: `
    <h2>Hello ${username},</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}" style="padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">Verify Email</a>
    <p>This link expires in 20 minutes.</p>
  `,
});

export const forgotPasswordTemplate = (username, resetLink) => ({
    subject: "Reset your password – Project Camp",
    html: `
    <h2>Hello ${username},</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
    <p>This link expires in 20 minutes. If you didn't request this, ignore this email.</p>
  `,
});
