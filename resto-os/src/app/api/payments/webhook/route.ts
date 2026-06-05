import { NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/payments/razorpay"
import { Payment } from "@/lib/db/models/Payment"
import { Bill } from "@/lib/db/models/Bill"
import { Order } from "@/lib/db/models/Order"
import { connectDB } from "@/lib/db/connection"
import mongoose from "mongoose"

export const POST = async (req: Request) => {
  const body = await req.text()
  const signature = req.headers.get("x-razorpay-signature")
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!webhookSecret || !signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  await connectDB()

  const event = JSON.parse(body)

  if (event.event === "payment.captured") {
    const entity = event.payload.payment.entity
    const { billId } = entity.notes || {}

    if (!billId) {
      return NextResponse.json({ status: "skipped_no_notes" })
    }

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return NextResponse.json({ error: "Invalid billId" }, { status: 400 })
    }

    const exists = await Payment.findOne({ razorpayPaymentId: entity.id })
    if (exists) {
      return NextResponse.json({ status: "already_processed" })
    }

    const bill = await Bill.findById(billId)
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    const amount = entity.amount / 100

    await Payment.create({
      organizationId: bill.organizationId,
      restaurantId: bill.restaurantId,
      billId: bill._id,
      orderId: bill.orderId,
      method: "online",
      amount,
      reference: entity.id,
      status: "completed",
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
    })

    const newPaid = (bill.paidAmount || 0) + amount
    const newRemaining = Math.max(0, bill.total - newPaid)

    await Bill.findByIdAndUpdate(billId, {
      $set: {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? "paid" : "partial",
      },
      $push: {
        payments: {
          method: "online",
          amount,
          reference: entity.id,
          status: "completed",
        },
      },
    })

    if (newRemaining <= 0 && bill.orderId) {
      await Order.findByIdAndUpdate(bill.orderId, { isPaid: true })
    }
  }

  if (event.event === "payment.failed") {
    const entity = event.payload.payment.entity
    const { billId } = entity.notes || {}

    if (!billId) {
      return NextResponse.json({ status: "skipped_no_notes" })
    }

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return NextResponse.json({ error: "Invalid billId" }, { status: 400 })
    }

    const exists = await Payment.findOne({ razorpayPaymentId: entity.id })
    if (exists) {
      return NextResponse.json({ status: "already_processed" })
    }

    const bill = await Bill.findById(billId)
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 })
    }

    await Payment.create({
      organizationId: bill.organizationId,
      restaurantId: bill.restaurantId,
      billId: bill._id,
      method: "online",
      amount: 0,
      status: "failed",
      razorpayOrderId: entity.order_id,
      razorpayPaymentId: entity.id,
    })
  }

  return NextResponse.json({ status: "ok" })
}
