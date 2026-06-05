import { Notification } from "@/lib/db/models/Notification"
import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"

export const PUT = withAuth(async (req, context, session) => {
  const body = await req.json()
  const { ids } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return apiError("Notification IDs are required", 400)
  }

  await Notification.updateMany(
    { _id: { $in: ids }, restaurantId: session.user.restaurantId },
    { $addToSet: { readBy: session.user.id } }
  )

  return apiSuccess({ message: "Marked as read" })
})
