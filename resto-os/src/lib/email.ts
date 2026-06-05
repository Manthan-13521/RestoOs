import nodemailer from "nodemailer"

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  }

  return null
}

const APP_NAME = "RestoOS"
const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@restoos.com"

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const transport = createTransport()

  if (!transport) {
    console.log(`[Password Reset] No SMTP configured. Reset link for ${email}: ${resetLink}`)
    return
  }

  await transport.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}
