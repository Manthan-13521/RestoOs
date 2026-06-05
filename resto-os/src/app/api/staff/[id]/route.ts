import { Staff } from "@/lib/db/models/Staff"
import { User } from "@/lib/db/models/User"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_STAFF_FIELDS = new Set(["name", "email", "phone", "role", "salary", "isActive"])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const staff = await Staff.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).populate("userId", "name email phone role isActive").lean()

  if (!staff) return apiError("Staff not found", 404)
  return apiSuccess(staff)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_STAFF_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }

  const staff = await Staff.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: update },
    { new: true }
  ).lean()

  if (!staff) return apiError("Staff not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "staff.updated",
    userId: session.user.id,
    resource: "staff",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(staff)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { id } = await context.params
  const staff = await Staff.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  })
  if (!staff) return apiError("Staff not found", 404)

  await User.findByIdAndUpdate(staff.userId, { isActive: false })
  await Staff.findByIdAndUpdate(id, { isActive: false })

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "staff.deactivated",
    userId: session.user.id,
    resource: "staff",
    resourceId: id,
    details: { userId: staff.userId.toString() },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({ message: "Staff deactivated" })
})
