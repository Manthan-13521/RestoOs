import { auth } from "@/lib/auth/auth"
import Ably from "ably"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientId = session.user.id
  const restaurantId = session.user.restaurantId
  const apiKey = process.env.ABLY_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Ably not configured" }, { status: 500 })
  }

  const client = new Ably.Rest(apiKey)
  const tokenRequestData = await client.auth.createTokenRequest({
    clientId,
    capability: {
      [`restaurant:${restaurantId}:*`]: ["publish", "subscribe", "presence"],
    },
  })

  return NextResponse.json(tokenRequestData)
}
