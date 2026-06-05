import { Salary } from "@/lib/db/models/Salary"
import { withAuth, apiSuccess, apiError, parsePagination, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get("staffId")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (staffId) filter.staffId = staffId

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [salaries, total] = await Promise.all([
      Salary.find(filter).sort({ period: -1 }).skip(skip).limit(limit).lean(),
      Salary.countDocuments(filter),
    ])
    return apiSuccess({ data: salaries, total, page, limit })
  }

  const salaries = await Salary.find(filter).sort({ period: -1 }).limit(100).lean()
  return apiSuccess(salaries)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const { staffId, amount, period } = body

  if (!staffId) return apiError("Staff ID is required", 400)
  if (!amount || amount <= 0) return apiError("Valid amount is required", 400)
  if (!period || !period.trim()) return apiError("Period is required", 400)

  const existing = await Salary.findOne({
    restaurantId: session.user.restaurantId,
    staffId,
    period: period.trim(),
  })
  if (existing) return apiError("Salary already recorded for this period", 409)

  const netAmount = amount + (body.bonus || 0) - (body.deduction || 0)

  const salary = await Salary.create({
    staffId,
    amount,
    bonus: body.bonus || 0,
    deduction: body.deduction || 0,
    netAmount,
    period: period.trim(),
    notes: body.notes || "",
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(salary, 201)
})
