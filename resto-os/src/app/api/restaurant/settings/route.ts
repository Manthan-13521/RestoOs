import { Restaurant } from "@/lib/db/models/Restaurant"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const restaurant = await Restaurant.findOne({
    _id: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }).lean()

  if (!restaurant) return apiError("Restaurant not found", 404)

  return apiSuccess({
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    slug: restaurant.slug,
    settings: restaurant.settings,
  })
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const { name, address, phone, email, settings } = body

  const update: Record<string, any> = {}
  if (name) update.name = name
  if (address) update.address = address
  if (phone) update.phone = phone
  if (email) update.email = email
  if (settings) update.settings = settings

  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: session.user.restaurantId, organizationId: session.user.organizationId },
    { $set: update },
    { new: true }
  ).lean()

  if (!restaurant) return apiError("Restaurant not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "settings.updated",
    userId: session.user.id,
    resource: "restaurant",
    resourceId: session.user.restaurantId,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    settings: restaurant.settings,
  })
})
