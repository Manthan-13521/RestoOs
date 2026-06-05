import { Notification } from "@/lib/db/models/Notification"
import { User } from "@/lib/db/models/User"
import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"

export const POST = withAuth(async (req, context, session) => {
  const body = await req.json()
  const { tableNumber, tableName, message } = body

  if (!tableNumber) return apiError("tableNumber is required", 400)

  const waiters = await User.find({
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    role: "waiter",
    isActive: true,
  }).select("_id").lean()

  const notification = await Notification.create({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    type: "waiter_call",
    title: `Waiter call — Table ${tableNumber}`,
    message: message || `Customer needs assistance at Table ${tableNumber}${tableName ? ` (${tableName})` : ""}`,
    recipients: waiters.map(w => w._id),
    priority: "high",
  })

  return apiSuccess(notification, 201)
})
