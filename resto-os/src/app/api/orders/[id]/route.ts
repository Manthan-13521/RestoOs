import { Order } from "@/lib/db/models/Order"
import { MenuItem } from "@/lib/db/models/MenuItem"
import { withAuth, apiSuccess, apiError, createAuditLog, requirePermission } from "@/lib/db/helpers"

const ALLOWED_ORDER_FIELDS = new Set(["status", "notes", "type"])
const VALID_STATUSES = new Set(["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"])
const ITEM_ALLOWED = new Set(["status", "instructions"])
const VALID_ITEM_STATUSES = new Set(["new", "preparing", "ready", "served", "cancelled"])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const order = await Order.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!order) return apiError("Order not found", 404)
  return apiSuccess(order)
})

export const PUT = withAuth(async (req, context, session) => {
  requirePermission(session, "orders:edit")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return apiError(`Invalid status "${body.status}"`, 400)
    }
    update.status = body.status
  }
  if (body.notes !== undefined) update.notes = body.notes
  if (body.type !== undefined) update.type = body.type

  if (body.items !== undefined && Array.isArray(body.items)) {
    update.items = body.items.map((item: any) => {
      const filtered: Record<string, any> = {}
      for (const key of Object.keys(item)) {
        if (ITEM_ALLOWED.has(key)) {
          if (key === "status" && !VALID_ITEM_STATUSES.has(item.status)) continue
          filtered[key] = item[key]
        }
      }
      return filtered
    })
  }

  const order = await Order.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).lean()

  if (!order) return apiError("Order not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "order.updated",
    userId: session.user.id,
    resource: "order",
    resourceId: id,
    details: { updatedFields: Object.keys(body) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(order)
})
