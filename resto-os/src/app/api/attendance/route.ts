import { Attendance } from "@/lib/db/models/Attendance"
import { withAuth, apiSuccess, apiError, parsePagination, requireRole } from "@/lib/db/helpers"
import { startOfDay, endOfDay } from "date-fns"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const staffId = searchParams.get("staffId")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (date) {
    const d = new Date(date)
    filter.date = { $gte: startOfDay(d), $lt: endOfDay(d) }
  }
  if (staffId) filter.staffId = staffId

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [records, total] = await Promise.all([
      Attendance.find(filter).populate("staffId", "name email").sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ])
    return apiSuccess({ data: records, total, page, limit })
  }

  const records = await Attendance.find(filter).populate("staffId", "name email").sort({ date: -1 }).limit(100).lean()
  return apiSuccess(records)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const { staffId, date, status, checkIn } = body

  if (!staffId) return apiError("Staff ID is required", 400)
  if (!date) return apiError("Date is required", 400)

  const existing = await Attendance.findOne({
    restaurantId: session.user.restaurantId,
    staffId,
    date: { $gte: startOfDay(new Date(date)), $lt: endOfDay(new Date(date)) },
  })
  if (existing) return apiError("Attendance already recorded for this date", 409)

  const record = await Attendance.create({
    staffId,
    date: new Date(date),
    checkIn: checkIn ? new Date(checkIn) : undefined,
    status: status || "present",
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(record, 201)
})
