import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"
import { Organization } from "@/lib/db/models/Organization"
import { Restaurant } from "@/lib/db/models/Restaurant"
import { User } from "@/lib/db/models/User"
import bcrypt from "bcryptjs"
import { slugify } from "@/lib/utils"
import { registerSchema, validateBody } from "@/lib/validations"

async function handler(req: Request, _context: any) {
  try {
    await connectDB()

    const body = await req.json()
    const result = validateBody(registerSchema, body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
    }
    const { organizationName, restaurantName, name, email, phone, password } = result.data

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const orgSlug = slugify(organizationName)
    const restSlug = slugify(restaurantName)

    const org = await Organization.create({
      name: organizationName,
      slug: orgSlug,
      ownerId: null,
    })

    const restaurant = await Restaurant.create({
      organizationId: org._id,
      name: restaurantName,
      slug: restSlug,
      address: "",
      phone,
      email,
    })

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      organizationId: org._id,
      restaurantId: restaurant._id,
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      permissions: [],
    })

    org.ownerId = user._id
    await org.save()

    return NextResponse.json(
      {
        message: "Registration successful",
        organizationId: org._id,
        restaurantId: restaurant._id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    )
  }
}

export const POST = withPublicRateLimit(handler, "auth")
