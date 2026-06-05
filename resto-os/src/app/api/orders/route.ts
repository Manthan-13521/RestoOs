import { NextResponse } from "next/server"
import { Order } from "@/lib/db/models/Order"
import { Table } from "@/lib/db/models/Table"
import { MenuItem } from "@/lib/db/models/MenuItem"
import { withAuth, apiSuccess, apiError, parsePagination, requirePermission } from "@/lib/db/helpers"
import { orderSchema, validateBody } from "@/lib/validations"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const tableId = searchParams.get("tableId")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (status) filter.status = { $in: status.split(",") }
  if (tableId) filter.tableId = tableId

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ])
    return apiSuccess({ data: orders, total, page, limit })
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  return apiSuccess(orders)
})

export const POST = withAuth(async (req, context, session) => {
  requirePermission(session, "orders:create")
  const body = await req.json()
  const result = validateBody(orderSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { type, tableId, items, notes } = result.data

  if (type === "dinein") {
    const table = await Table.findOne({
      _id: tableId,
      restaurantId: session.user.restaurantId,
    }).lean()
    if (!table) return apiError("Table not found", 404)
    if (table.status === "reserved") return apiError("Table is reserved", 400)
  }

  const now = new Date()
  const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase().slice(-6)}`

  const menuItemIds = items.map((i: any) => i.menuItemId)
  const menuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurantId: session.user.restaurantId,
  }).lean()

  const menuItemMap = new Map(menuItems.map((m: any) => [m._id.toString(), m]))

  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId)
    if (!menuItem) {
      return apiError(`Menu item ${item.menuItemId} not found`, 404)
    }
    if (!item.quantity || item.quantity < 1) {
      return apiError(`Invalid quantity for "${menuItem.name}"`, 400)
    }
  }

  const order = await Order.create({
    orderNumber,
    type,
    tableId: type === "dinein" ? tableId : undefined,
    staffId: session.user.id,
    items: items.map((i: any) => {
      const menuItem = menuItemMap.get(i.menuItemId)
      return {
        menuItemId: i.menuItemId,
        name: menuItem.name,
        quantity: i.quantity,
        price: menuItem.price,
        instructions: i.instructions || "",
      }
    }),
    notes: notes || "",
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  if (type === "dinein") {
    await Table.findByIdAndUpdate(tableId, { status: "occupied", currentOrderId: order._id })
  }

  return apiSuccess(order, 201)
})
