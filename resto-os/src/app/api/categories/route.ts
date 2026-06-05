import { Category } from "@/lib/db/models/Category"
import { withAuth, apiSuccess, apiError, parsePagination, requireRole } from "@/lib/db/helpers"
import { categorySchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const pageParam = searchParams.get("page")
  const all = searchParams.get("all") === "true"

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }
  if (!all) filter.isActive = true

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [categories, total] = await Promise.all([
      Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ])
    return apiSuccess({ data: categories, total, page, limit })
  }

  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).limit(100).lean()
  return apiSuccess(categories)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const body = await req.json()
  const result = validateBody(categorySchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { name, description, sortOrder } = result.data

  const category = await Category.create({
    name,
    description: description || "",
    sortOrder: sortOrder || 0,
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(category, 201)
})
