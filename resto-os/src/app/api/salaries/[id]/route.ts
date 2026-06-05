import { Salary } from "@/lib/db/models/Salary"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_SALARY_FIELDS = new Set(["amount", "bonus", "deduction", "status", "period", "notes"])

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_SALARY_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }
  if (update.amount !== undefined) update.netAmount = (update.amount || 0) + (update.bonus || 0) - (update.deduction || 0)

  const salary = await Salary.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).populate("staffId", "name email").lean()

  if (!salary) return apiError("Salary record not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "salary.updated",
    userId: session.user.id,
    resource: "salary",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(salary)
})

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const salary = await Salary.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }).populate("staffId", "name email").lean()

  if (!salary) return apiError("Salary record not found", 404)
  return apiSuccess(salary)
})
