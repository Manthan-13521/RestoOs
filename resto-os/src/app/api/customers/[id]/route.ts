import { Customer } from "@/lib/db/models/Customer"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_CUSTOMER_FIELDS = new Set(["name", "phone", "email", "notes"])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const customer = await Customer.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }).lean()

  if (!customer) return apiError("Customer not found", 404)
  return apiSuccess(customer)
})

export const PUT = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_CUSTOMER_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).lean()

  if (!customer) return apiError("Customer not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "customer.updated",
    userId: session.user.id,
    resource: "customer",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(customer)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const customer = await Customer.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: { isActive: false } },
    { new: true }
  )

  if (!customer) return apiError("Customer not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "customer.deactivated",
    userId: session.user.id,
    resource: "customer",
    resourceId: id,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({ message: "Deactivated" })
})
