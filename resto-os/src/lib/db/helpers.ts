import { NextResponse } from "next/server"
import { connectDB } from "./connection"
import { auth } from "@/lib/auth/auth"
import mongoose from "mongoose"
import { getTenantContext } from "./tenant"
import { AuditLog } from "./models/AuditLog"
import { hasMinRole, hasPermission } from "@/lib/auth/roles"

export type ApiHandler = (
  req: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export async function getAuthSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error("UNAUTHORIZED")
  }
  return session as any
}

export function getUserId(session: any): string {
  return session?.user?.id ?? ""
}

export function requireRole(session: any, minRole: string): void {
  if (!session?.user?.role) {
    throw new Error("FORBIDDEN")
  }
  if (!hasMinRole(session.user.role, minRole)) {
    throw new Error("FORBIDDEN")
  }
}

export function requirePermission(session: any, requiredPermission: string): void {
  if (!session?.user?.role) {
    throw new Error("FORBIDDEN")
  }
  if (!hasPermission(session.user.role, requiredPermission)) {
    throw new Error("FORBIDDEN")
  }
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function withAuth(
  handler: (req: Request, context: any, session: any) => Promise<NextResponse>
) {
  return async (req: Request, context: any) => {
    const start = Date.now()
    const requestId = crypto.randomUUID().slice(0, 8)
    const method = req.method
    const url = new URL(req.url)
    const path = url.pathname

    try {
      await connectDB()
      const session = await requireAuth()
      const response = await handler(req, context, session)
      const duration = Date.now() - start
      logRequest({ requestId, method, path, status: response.status, duration })
      response.headers.set("X-Request-Id", requestId)
      response.headers.set("X-Duration-Ms", String(duration))
      return response
    } catch (error: any) {
      const duration = Date.now() - start
      if (error.message === "UNAUTHORIZED") {
        logRequest({ requestId, method, path, status: 401, duration })
        return apiError("Unauthorized", 401)
      }
      if (error.message === "FORBIDDEN") {
        logRequest({ requestId, method, path, status: 403, duration })
        return apiError("Forbidden", 403)
      }
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        logRequest({ requestId, method, path, status: 429, duration })
        return apiError("Too many requests", 429)
      }
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", error)
      }
      logRequest({ requestId, method, path, status: 500, duration })
      return apiError(error.message || "Internal server error", 500)
    }
  }
}

function logRequest(params: { requestId: string; method: string; path: string; status: number; duration: number }) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${params.requestId}] ${params.method} ${params.path} → ${params.status} (${params.duration}ms)`)
  } else {
    console.log(JSON.stringify({ ...params, timestamp: new Date().toISOString(), type: "api_request" }))
  }
}

export function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

export async function getTenantFilter(additional: Record<string, any> = {}) {
  const tenant = await getTenantContext()
  return {
    ...(tenant ? { organizationId: tenant.organizationId, restaurantId: tenant.restaurantId } : {}),
    ...additional,
  }
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export async function createAuditLog(params: {
  organizationId: string
  restaurantId?: string
  action: string
  userId: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
}) {
  try {
    await AuditLog.create({
      organizationId: new mongoose.Types.ObjectId(params.organizationId),
      restaurantId: params.restaurantId ? new mongoose.Types.ObjectId(params.restaurantId) : undefined,
      action: params.action,
      userId: new mongoose.Types.ObjectId(params.userId),
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip: params.ip,
      userAgent: params.userAgent,
    })
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to create audit log:", err)
    }
  }
}
