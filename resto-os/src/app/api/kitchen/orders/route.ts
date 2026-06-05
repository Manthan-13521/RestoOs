import { Order } from "@/lib/db/models/Order"
import { withAuth, apiSuccess } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const orders = await Order.find({
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    status: { $in: ["confirmed", "preparing", "ready"] },
  })
    .sort({ createdAt: -1 })
    .lean()

  return apiSuccess(orders)
})
