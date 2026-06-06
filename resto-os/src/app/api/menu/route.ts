import { MenuItem } from "@/lib/db/models/MenuItem"
import { withAuth, apiSuccess, apiError, parsePagination, requirePermission } from "@/lib/db/helpers"
import { menuItemSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const type = searchParams.get("type")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    isActive: true,
  }

  if (categoryId) filter.categoryId = categoryId
  if (type) filter.type = type

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [items, total] = await Promise.all([
      MenuItem.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
      MenuItem.countDocuments(filter),
    ])
    return apiSuccess({ data: items, total, page, limit })
  }

  const items = await MenuItem.find(filter).sort({ sortOrder: 1, name: 1 }).limit(100).lean()
  return apiSuccess(items)
})

export const POST = withAuth(async (req, context, session) => {
  requirePermission(session, "menu:manage")
  const body = await req.json()
  const result = validateBody(menuItemSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }

  const item = await MenuItem.create({
    ...result.data,
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(item, 201)
})
