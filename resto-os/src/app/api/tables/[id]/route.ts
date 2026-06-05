import { Table } from "@/lib/db/models/Table"
import { withAuth, apiSuccess, apiError, createAuditLog, requireRole } from "@/lib/db/helpers"

const ALLOWED_TABLE_FIELDS = new Set(["number", "name", "capacity", "status", "section"])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const table = await Table.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!table) return apiError("Table not found", 404)
  return apiSuccess(table)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_TABLE_FIELDS.has(key)) {
      update[key] = body[key]
    }
  }

  const table = await Table.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: Object.keys(update).length > 0 ? update : { _id: id } },
    { new: true }
  ).lean()

  if (!table) return apiError("Table not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "table.updated",
    userId: session.user.id,
    resource: "table",
    resourceId: id,
    details: { updatedFields: Object.keys(update) },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(table)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params

  const table = await Table.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: { isActive: false } },
    { new: true }
  ).lean()

  if (!table) return apiError("Table not found", 404)

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "table.deleted",
    userId: session.user.id,
    resource: "table",
    resourceId: id,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess({ message: "Table deleted" })
})
