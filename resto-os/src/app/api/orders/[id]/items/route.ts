import { Order } from "@/lib/db/models/Order"
import { withAuth, apiSuccess, apiError, requirePermission } from "@/lib/db/helpers"
import mongoose from "mongoose"

export const PUT = withAuth(async (req, context, session) => {
  requirePermission(session, "kitchen:manage")
  const { id } = await context.params
  const body = await req.json()
  const { itemId, status } = body

  if (!itemId || !status) {
    return apiError("itemId and status are required", 400)
  }

  const updateField: Record<string, any> = {}
  updateField["items.$[item].status"] = status

  if (status === "preparing") {
    updateField["items.$[item].startedAt"] = new Date()
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: id,
      restaurantId: session.user.restaurantId,
      "items._id": new mongoose.Types.ObjectId(itemId),
    },
    { $set: updateField },
    {
      arrayFilters: [{ "item._id": new mongoose.Types.ObjectId(itemId) }],
      new: true,
    }
  ).lean()

  if (!order) return apiError("Order or item not found", 404)

  const allDone = order.items.every((i: any) => i.status === "served" || i.status === "cancelled")
  const allPrepared = order.items.every(
    (i: any) => i.status === "ready" || i.status === "served" || i.status === "cancelled"
  )

  if (allDone) {
    await Order.findByIdAndUpdate(id, { status: "completed" })
  } else if (allPrepared) {
    await Order.findByIdAndUpdate(id, { status: "ready" })
  } else if (status === "preparing") {
    await Order.findByIdAndUpdate(id, { status: "preparing" })
  }

  const updated = await Order.findById(id).lean()
  return apiSuccess(updated)
})
