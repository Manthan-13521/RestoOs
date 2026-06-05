import { MenuItem } from "@/lib/db/models/MenuItem"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_MENU_FIELDS = new Set([
  "name", "price", "description", "categoryId", "type",
  "image", "isActive", "sortOrder", "variants", "addons", "available",
])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const item = await MenuItem.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!item) return apiError("Menu item not found", 404)
  return apiSuccess(item)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_MENU_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }

  const item = await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).lean()

  if (!item) return apiError("Menu item not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "menu.updated",
    userId: session.user.id,
    resource: "menu_item",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(item)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params

  await MenuItem.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: { isActive: false } }
  ).lean()

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "menu.deleted",
    userId: session.user.id,
    resource: "menu_item",
    resourceId: id,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({ message: "Menu item deleted" })
})
