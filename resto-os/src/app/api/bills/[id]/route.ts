import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import { withAuth, apiSuccess, apiError, createAuditLog, requirePermission } from "@/lib/db/helpers"

const ALLOWED_BILL_FIELDS = new Set(["notes", "status", "payments", "paidAmount", "remainingAmount", "total", "discount", "serviceCharge"])
const VALID_STATUSES = new Set(["pending", "paid", "partial", "cancelled"])
const VALID_PAYMENT_METHODS = new Set(["cash", "card", "upi", "online"])

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const bill = await Bill.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!bill) return apiError("Bill not found", 404)
  return apiSuccess(bill)
})

export const PUT = withAuth(async (req, context, session) => {
  requirePermission(session, "billing:manage")
  const { id } = await context.params
  const body = await req.json()

  const existing = await Bill.findOne({ _id: id, restaurantId: session.user.restaurantId }).lean()
  if (!existing) return apiError("Bill not found", 404)

  const update: Record<string, any> = {}

  if (body.notes !== undefined) update.notes = body.notes
  if (body.discount !== undefined) update.discount = Math.max(0, body.discount)
  if (body.serviceCharge !== undefined) update.serviceCharge = Math.max(0, body.serviceCharge)
  if (body.total !== undefined) update.total = Math.max(0, body.total)

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) return apiError(`Invalid status "${body.status}"`, 400)
    update.status = body.status
  }

  if (body.paidAmount !== undefined) update.paidAmount = Math.max(0, body.paidAmount)
  if (body.remainingAmount !== undefined) update.remainingAmount = Math.max(0, body.remainingAmount)

  if (body.payments !== undefined && Array.isArray(body.payments)) {
    const validPayments = body.payments.filter((p: any) =>
      p.method && VALID_PAYMENT_METHODS.has(p.method) && typeof p.amount === "number" && p.amount > 0
    )
    if (body.payments.length > 0 && validPayments.length === 0) {
      return apiError("Invalid payment data", 400)
    }
    update.payments = validPayments

    const paymentTotal = validPayments.reduce((s: number, p: any) => s + p.amount, 0)
    const newPaidAmount = (existing.paidAmount || 0) + paymentTotal
    update.paidAmount = Math.min(newPaidAmount, update.total ?? existing.total)
    update.remainingAmount = Math.max(0, (update.total ?? existing.total) - update.paidAmount)
    if (update.remainingAmount <= 0) update.status = "paid"
    else if (update.paidAmount > 0) update.status = "partial"

    if (update.status === "paid" && existing.orderId) {
      await Order.findByIdAndUpdate(existing.orderId, { isPaid: true })
    }
  }

  if (Object.keys(update).length === 0) return apiSuccess(existing)

  const bill = await Bill.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()

  await createAuditLog({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    action: "bill.updated",
    userId: session.user.id,
    resource: "bill",
    resourceId: id,
    details: { updatedFields: Object.keys(update), previousTotal: existing.total, newTotal: bill?.total },
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  return apiSuccess(bill)
})
