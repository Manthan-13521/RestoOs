import { withAuth, apiSuccess, apiError, requirePermission } from "@/lib/db/helpers"
import { createRazorpayOrder } from "@/lib/payments/razorpay"

export const POST = withAuth(async (req, context, session) => {
  requirePermission(session, "billing:manage")
  const body = await req.json()
  const { amount, receipt, billId } = body

  if (!amount || amount <= 0) {
    return apiError("Invalid amount", 400)
  }

  const order = await createRazorpayOrder({
    amount,
    receipt: receipt || `receipt_${Date.now()}`,
    notes: {
      organizationId: session.user.organizationId,
      restaurantId: session.user.restaurantId,
      userId: session.user.id,
      ...(billId ? { billId } : {}),
    },
  })

  return apiSuccess({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
    key_id: process.env.RAZORPAY_KEY_ID,
  })
})
