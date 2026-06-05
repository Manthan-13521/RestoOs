import { Offer } from "@/lib/db/models/Offer"
import { withAuth, apiSuccess, apiError, parsePagination, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get("page")

  const filter = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [offers, total] = await Promise.all([
      Offer.find(filter).sort({ validTill: -1 }).skip(skip).limit(limit).lean(),
      Offer.countDocuments(filter),
    ])
    return apiSuccess({ data: offers, total, page, limit })
  }

  const offers = await Offer.find(filter).sort({ validTill: -1 }).limit(100).lean()
  return apiSuccess(offers)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const { title, type, value, validFrom, validTill } = body

  if (!title || !title.trim()) return apiError("Title is required", 400)
  if (!type || !["percent", "fixed"].includes(type)) return apiError("Type must be percent or fixed", 400)
  if (!value || value <= 0) return apiError("Valid value is required", 400)
  if (!validFrom || !validTill) return apiError("Valid from and till dates are required", 400)

  const offer = await Offer.create({
    ...body,
    title: title.trim(),
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(offer, 201)
})
