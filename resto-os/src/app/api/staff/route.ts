import { User } from "@/lib/db/models/User"
import { Staff } from "@/lib/db/models/Staff"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"
import bcrypt from "bcryptjs"
import { staffSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, context, session) => {
  const staff = await Staff.find({
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    isActive: true,
  })
    .populate("userId", "name email phone role isActive")
    .limit(100)
    .lean()

  return apiSuccess(staff)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const result = validateBody(staffSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { name, email, phone, role, password, salary } = result.data

  if (!password) {
    return apiError("Password is required", 400)
  }

  const existing = await User.findOne({ email, restaurantId: session.user.restaurantId })
  if (existing) return apiError("Email already in use", 409)

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await User.create({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    name,
    email,
    phone,
    password: hashedPassword,
    role,
    permissions: [],
  })

  if (salary) {
    await Staff.create({
      organizationId: session.user.organizationId,
      restaurantId: session.user.restaurantId,
      userId: user._id,
      employeeId: `EMP${String(await User.countDocuments({ restaurantId: session.user.restaurantId })).padStart(4, "0")}`,
      salary,
      joiningDate: new Date(),
    })
  }

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "staff.created",
    userId: session.user.id,
    resource: "user",
    resourceId: user._id.toString(),
    details: { email, role },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  const { password: _, ...userWithoutPassword } = user.toObject()
  return apiSuccess(userWithoutPassword, 201)
})
