import { Notification } from "@/lib/db/models/Notification"
import { withAuth, apiSuccess, parsePagination } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get("page")

  const filter = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    recipients: session.user.id,
  }

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ])
    return apiSuccess({ data: notifications, total, page, limit })
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean()
  return apiSuccess(notifications)
})
