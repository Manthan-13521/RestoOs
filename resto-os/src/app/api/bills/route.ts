import { NextResponse } from "next/server"
import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import { Restaurant } from "@/lib/db/models/Restaurant"
import { withAuth, apiSuccess, apiError, parsePagination, requirePermission } from "@/lib/db/helpers"
import { billSchema, validateBody } from "@/lib/validations"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")
  const status = searchParams.get("status")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (orderId) filter.orderId = orderId
  if (status) filter.status = status

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Bill.countDocuments(filter),
    ])
    return apiSuccess({ data: bills, total, page, limit })
  }

  const bills = await Bill.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  return apiSuccess(bills)
})

export const POST = withAuth(async (req, context, session) => {
  requirePermission(session, "billing:manage")
  const body = await req.json()
  const result = validateBody(billSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { orderId, payments } = result.data

  const order = await Order.findOne({
    _id: orderId,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!order) return apiError("Order not found", 404)

  const restaurant = await Restaurant.findOne({
    _id: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }).lean()

  const taxRate = restaurant?.settings?.taxRate ?? 5
  const billNumber = `BILL-${Date.now().toString(36).toUpperCase().slice(-8)}`
  const subtotal = order.subtotal || order.total || 0
  const tax = Math.round((subtotal * taxRate) / 100)

  const bill = await Bill.create({
    orderId,
    billNumber,
    subtotal,
    taxRate,
    tax,
    total: subtotal + tax,
    paidAmount: 0,
    remainingAmount: subtotal + tax,
    status: "pending",
    payments: payments || [],
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(bill, 201)
})
