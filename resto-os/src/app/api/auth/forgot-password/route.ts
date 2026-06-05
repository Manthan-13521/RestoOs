import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { User } from "@/lib/db/models/User"
import { sendPasswordResetEmail } from "@/lib/email"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"
import crypto from "crypto"

export const POST = withPublicRateLimit(async (req: Request) => {
  try {
    await connectDB()
    const { email } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if (!user) {
      return NextResponse.json({ message: "If an account exists, a reset link has been sent" }, { status: 200 })
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await User.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry })

    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
    const resetLink = `${origin}/auth/reset-password?token=${resetToken}`

    await sendPasswordResetEmail(user.email, resetLink)

    return NextResponse.json({ message: "If an account exists, a reset link has been sent" }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}, "auth")
