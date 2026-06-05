import { AuditLog } from "@/lib/db/models/AuditLog"
import { withAuth, apiSuccess, parsePagination, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    organizationId: session.user.organizationId,
  }

  if (session.user.restaurantId) {
    filter.restaurantId = session.user.restaurantId
  }

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ])
    return apiSuccess({ data: logs, total, page, limit })
  }

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(50).lean()
  return apiSuccess(logs)
})
