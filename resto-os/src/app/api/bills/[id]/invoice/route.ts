import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import { Restaurant } from "@/lib/db/models/Restaurant"
import { User } from "@/lib/db/models/User"
import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params

  const bill = await Bill.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!bill) return apiError("Bill not found", 404)

  const [order, restaurant, cashier] = await Promise.all([
    Order.findById(bill.orderId).lean(),
    Restaurant.findById(session.user.restaurantId)
      .select("name address phone email gstin settings logo")
      .lean(),
    bill.staffId
      ? User.findById(bill.staffId).select("name email").lean()
      : null,
  ])

  let tableInfo = null
  if (order?.tableId) {
    const { Table } = await import("@/lib/db/models/Table")
    tableInfo = await Table.findById(order.tableId).select("number name").lean()
  }

  return apiSuccess({ bill, order, restaurant, cashier, tableInfo })
})
