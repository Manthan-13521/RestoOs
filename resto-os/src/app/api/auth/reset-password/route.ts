import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { User } from "@/lib/db/models/User"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"
import bcrypt from "bcryptjs"

export const POST = withPublicRateLimit(async (req: Request) => {
  try {
    await connectDB()
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: { resetToken: "", resetTokenExpiry: "" },
    })

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}, "auth")
