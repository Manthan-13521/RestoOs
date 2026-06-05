import { Customer } from "@/lib/db/models/Customer"
import { withAuth, apiSuccess, apiError, parsePagination } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ]
  }

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ visitCount: -1, updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ])
    return apiSuccess({ data: customers, total, page, limit })
  }

  const customers = await Customer.find(filter).sort({ visitCount: -1, updatedAt: -1 }).limit(100).lean()
  return apiSuccess(customers)
})

export const POST = withAuth(async (req, context, session) => {
  const body = await req.json()
  const { name, phone } = body

  if (!name || !name.trim()) return apiError("Customer name is required", 400)
  if (!phone || typeof phone !== "string" || phone.length < 10) {
    return apiError("Valid phone number is required", 400)
  }

  let customer = await Customer.findOne({
    restaurantId: session.user.restaurantId,
    phone: phone.trim(),
  })

  if (customer) {
    customer = await Customer.findByIdAndUpdate(
      customer._id,
      { $inc: { visitCount: 1 }, lastVisit: new Date() },
      { new: true }
    ).lean()
    return apiSuccess(customer)
  }

  customer = await Customer.create({
    name: name.trim(),
    phone: phone.trim(),
    whatsappOptIn: body.whatsappOptIn || false,
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    visitCount: 1,
  })

  return apiSuccess(customer, 201)
})
