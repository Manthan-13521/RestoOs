import { Category } from "@/lib/db/models/Category"
import { withAuth, apiSuccess, apiError, requireRole } from "@/lib/db/helpers"

export const GET = withAuth(async (req, context, session) => {
  const { id } = await context.params
  const category = await Category.findOne({
    _id: id,
    restaurantId: session.user.restaurantId,
  }).lean()

  if (!category) return apiError("Category not found", 404)
  return apiSuccess(category)
})

export const PUT = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const body = await req.json()
  const { name, description, sortOrder, isActive } = body

  const existing = await Category.findOne({ _id: id, restaurantId: session.user.restaurantId })
  if (!existing) return apiError("Category not found", 404)

  const update: Record<string, any> = {}
  if (name !== undefined) {
    if (!name.trim()) return apiError("Category name is required", 400)
    update.name = name.trim()
  }
  if (description !== undefined) update.description = description
  if (sortOrder !== undefined) update.sortOrder = sortOrder
  if (isActive !== undefined) update.isActive = isActive

  const category = await Category.findByIdAndUpdate(id, { $set: update }, { new: true }).lean()
  return apiSuccess(category)
})

export const DELETE = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const { id } = await context.params
  const category = await Category.findOneAndUpdate(
    { _id: id, restaurantId: session.user.restaurantId },
    { $set: { isActive: false } },
    { new: true }
  )
  if (!category) return apiError("Category not found", 404)
  return apiSuccess({ message: "Category deleted" })
})
