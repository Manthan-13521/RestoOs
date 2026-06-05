import { NextResponse } from "next/server"
import { WhatsAppLog } from "@/lib/db/models/WhatsAppLog"
import { connectDB } from "@/lib/db/connection"
import crypto from "crypto"

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) return false
  const expected = crypto.createHmac("sha256", appSecret).update(body).digest("hex")
  return signature.startsWith("sha256=") && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.slice(7)))
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

export const POST = async (req: Request) => {
  const rawBody = await req.text()
  const signature = req.headers.get("x-hub-signature-256")

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)

  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ok" })
  }

  await connectDB()

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue

      for (const statusUpdate of change.value?.statuses || []) {
        const messageId = statusUpdate.id
        const status = statusUpdate.status

        const statusMap: Record<string, string> = {
          sent: "sent",
          delivered: "delivered",
          read: "read",
          failed: "failed",
        }

        const mappedStatus = statusMap[status]
        if (!mappedStatus) continue

        const update: Record<string, any> = { status: mappedStatus }
        if (status === "failed") {
          update.error = statusUpdate.errors?.map((e: any) => e.title).join("; ") || "Unknown error"
        }

        await WhatsAppLog.findOneAndUpdate({ messageId }, update)
      }
    }
  }

  return NextResponse.json({ status: "ok" })
}
