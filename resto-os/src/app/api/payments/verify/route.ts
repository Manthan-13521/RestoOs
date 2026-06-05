import { withAuth, apiSuccess, apiError, requirePermission } from "@/lib/db/helpers"
import { verifyPaymentSignature } from "@/lib/payments/razorpay"
import { Payment } from "@/lib/db/models/Payment"
import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import mongoose from "mongoose"

export const POST = withAuth(async (req, context, session) => {
  requirePermission(session, "billing:manage")
  const body = await req.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = body

  if (!razorpay_order_id || !razorpay_payment_id) {
    return apiError("Missing payment details", 400)
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

  if (!isValid) {
    await Payment.create({
      organizationId: new mongoose.Types.ObjectId(session.user.organizationId),
      restaurantId: new mongoose.Types.ObjectId(session.user.restaurantId),
      billId: billId ? new mongoose.Types.ObjectId(billId) : undefined,
      orderId: undefined,
      method: "online",
      amount: 0,
      status: "failed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    })
    return apiError("Payment verification failed", 400)
  }

  const paymentAmount: number = billId ? await (async () => {
    const bill = await Bill.findOne({
      _id: billId,
      restaurantId: session.user.restaurantId,
      organizationId: session.user.organizationId,
    })
    if (!bill) return 0

    const amount = bill.remainingAmount || bill.total
    bill.payments.push({
      method: "online",
      amount,
      reference: razorpay_payment_id,
      status: "completed",
    })
    bill.paidAmount = (bill.paidAmount || 0) + amount
    bill.remainingAmount = Math.max(0, bill.total - bill.paidAmount)
    bill.status = bill.remainingAmount <= 0 ? "paid" : "partial"
    await bill.save()

    if (bill.status === "paid") {
      await Order.findByIdAndUpdate(bill.orderId, { isPaid: true })
    }

    return amount
  })() : 0

  await Payment.create({
    organizationId: new mongoose.Types.ObjectId(session.user.organizationId),
    restaurantId: new mongoose.Types.ObjectId(session.user.restaurantId),
    billId: billId ? new mongoose.Types.ObjectId(billId) : undefined,
    orderId: undefined,
    method: "online",
    amount: paymentAmount,
    status: "completed",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  })

  return apiSuccess({
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  })
})
