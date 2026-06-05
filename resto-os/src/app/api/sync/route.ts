import { withAuth, apiSuccess, apiError } from "@/lib/db/helpers"

const ALLOWED_RESOURCES = new Set([
  "orders",
  "orders/[id]/items",
  "bills",
  "bills/[id]",
  "payments/verify",
  "notifications/waiter-call",
  "feedback",
  "customers",
])

const ACTION_METHODS: Record<string, "POST" | "PUT" | "DELETE"> = {
  create: "POST",
  update: "PUT",
  delete: "DELETE",
}

interface SyncAction {
  action: "create" | "update" | "delete"
  resource: string
  data: any
}

export const POST = withAuth(async (req, context, session) => {
  const body = await req.json()
  const { actions }: { actions: SyncAction[] } = body

  if (!actions || !Array.isArray(actions)) {
    return apiSuccess({ processed: 0, errors: [] })
  }

  const results = await Promise.allSettled(
    actions.map(async (action) => {
      if (!ALLOWED_RESOURCES.has(action.resource)) {
        return { action: action.action, resource: action.resource, status: 403, error: "Resource not allowed" }
      }

      const method = ACTION_METHODS[action.action]
      if (!method) {
        return { action: action.action, resource: action.resource, status: 400, error: "Invalid action" }
      }

      const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/${action.resource}`

      const res = await fetch(baseUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") || "",
        },
        body: ["POST", "PUT"].includes(method) ? JSON.stringify(action.data) : undefined,
      })

      return { action: action.action, resource: action.resource, status: res.status }
    })
  )

  const successful = results.filter((r) => r.status === "fulfilled").length
  const errors = results.filter((r) => r.status === "rejected")

  return apiSuccess({
    processed: successful,
    errors: errors.map((e: any) => e.reason?.message || "Unknown"),
  })
})
