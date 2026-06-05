import Razorpay from "razorpay"
import crypto from "crypto"

let client: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_MISCONFIG")
    }
    client = new Razorpay({ key_id, key_secret })
  }
  return client
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  return expected === signature
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return expected === signature
}

export type RazorpayOrderParams = {
  amount: number
  receipt: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: RazorpayOrderParams) {
  const razorpay = getRazorpayClient()
  const order = await razorpay.orders.create({
    amount: Math.round(params.amount * 100),
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  })
  return order
}
