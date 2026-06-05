import { Feedback } from "@/lib/db/models/Feedback"
import { Order } from "@/lib/db/models/Order"
import { apiSuccess, apiError } from "@/lib/db/helpers"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"
import { feedbackSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const POST = withPublicRateLimit(async (req: Request, context: any) => {
  const body = await req.json()
  const result = validateBody(feedbackSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { orderId, foodRating, serviceRating, experience, complaint } = result.data

  const { connectDB } = await import("@/lib/db/connection")
  await connectDB()

  const order = await Order.findById(orderId).lean()
  if (!order) return apiError("Order not found", 404)

  const existingFeedback = await Feedback.findOne({ orderId }).lean()
  if (existingFeedback) return apiError("Feedback already submitted for this order", 409)

  const feedback = await Feedback.create({
    organizationId: order.organizationId,
    restaurantId: order.restaurantId,
    orderId,
    customerId: order.customerId,
    foodRating,
    serviceRating,
    experience,
    complaint,
  })

  return apiSuccess(feedback, 201)
})
