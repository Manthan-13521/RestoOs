import { NextResponse } from "next/server"
import { createRateLimiter } from "@/lib/rate-limit"

const publicLimiter = createRateLimiter({ max: 10, windowMs: 60 * 1000 })
const authLimiter = createRateLimiter({ max: 5, windowMs: 60 * 1000 })
const apiLimiter = createRateLimiter({ max: 100, windowMs: 60 * 1000 })

export function withPublicRateLimit(
  handler: (req: Request, context: any) => Promise<NextResponse>,
  tier: "auth" | "public" | "api" = "public"
) {
  const limiter = tier === "auth" ? authLimiter : tier === "api" ? apiLimiter : publicLimiter

  return async (req: Request, context: any) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const key = `${ip}:${tier}`

    try {
      limiter.check(key)
      return handler(req, context)
    } catch (error: any) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
  }
}
