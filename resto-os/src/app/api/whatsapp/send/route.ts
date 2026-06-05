import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"
import { WhatsAppLog } from "@/lib/db/models/WhatsAppLog"
import { Customer } from "@/lib/db/models/Customer"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { whatsappSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

const TEMPLATES: Record<string, (v: Record<string, string>) => string> = {
  order_placed: (v) => `Order *${v.orderNumber}* has been received at *${v.restaurant}*. We'll start preparing shortly.`,
  preparing: (v) => `Your order *${v.orderNumber}* at *${v.restaurant}* is now being prepared. Estimated wait: 15-20 mins.`,
  ready: (v) => `Your order *${v.orderNumber}* at *${v.restaurant}* is on its way to your table. Enjoy!`,
  payment_complete: (v) => `Thank you for visiting *${v.restaurant}*. Payment of ${v.amount} received. We hope to see you again!`,
  reservation_confirmed: (v) => `Your reservation at *${v.restaurant}* on ${v.date} at ${v.time} for ${v.guests} guests is confirmed.`,
  feedback_request: (v) => `How was your experience at *${v.restaurant}*? Share your feedback and help us improve!`,
}

export const POST = withAuth(async (req, context, session) => {
  const body = await req.json()
  const result = validateBody(whatsappSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { to, template, variables = {} } = result.data

  const templateFn = TEMPLATES[template]
  if (!templateFn) {
    return apiError("Invalid template", 400)
  }

  const bypassOptIn = session.user.role === "admin" || session.user.role === "superadmin" || session.user.role === "manager"

  const restaurantName = variables.restaurant || session.user.restaurantId
  const messageBody = templateFn({ ...variables, restaurant: restaurantName })

  if (!bypassOptIn) {
    const customer = await Customer.findOne({
      restaurantId: session.user.restaurantId,
      phone: to,
    })
    if (customer && !customer.whatsappOptIn) {
      return apiError("Customer has not opted in for WhatsApp messages", 403)
    }
  }

  const log = await WhatsAppLog.create({
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    to,
    template,
    variables,
    status: "pending",
  })

  try {
    const { messageId } = await sendWhatsAppMessage({ to, body: messageBody })
    log.messageId = messageId
    log.status = "sent"
    await log.save()
    return apiSuccess({ messageId: log.messageId, message: messageBody })
  } catch (err: any) {
    log.status = "failed"
    log.error = err.message
    await log.save()
    return apiError("Failed to send WhatsApp message. Will retry.", 502)
  }
})
