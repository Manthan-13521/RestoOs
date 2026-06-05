import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import { Restaurant } from "@/lib/db/models/Restaurant"
import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params

  const bill = await Bill.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!bill) return apiError("Bill not found", 404)

  const order = await Order.findById(bill.orderId).populate("tableId", "number name").lean()
  if (!order) return apiError("Order not found", 404)

  const restaurant = await Restaurant.findById(session.user.restaurantId)
    .select("name address phone email gstin settings")
    .lean()

  return apiSuccess({ bill, order, restaurant })
})
