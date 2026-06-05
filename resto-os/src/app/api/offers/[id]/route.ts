import { Offer } from "@/lib/db/models/Offer"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_OFFER_FIELDS = new Set([
  "title", "description", "type", "value", "minOrder",
  "validFrom", "validTill", "maxDiscount", "usageLimit",
  "isActive",
])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const offer = await Offer.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }).lean()

  if (!offer) return apiError("Offer not found", 404)
  return apiSuccess(offer)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_OFFER_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }

  const offer = await Offer.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).lean()

  if (!offer) return apiError("Offer not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "offer.updated",
    userId: session.user.id,
    resource: "offer",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(offer)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { id } = await context.params
  const offer = await Offer.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: { isActive: false } },
    { new: true }
  )

  if (!offer) return apiError("Offer not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "offer.deactivated",
    userId: session.user.id,
    resource: "offer",
    resourceId: id,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({ message: "Deactivated" })
})
