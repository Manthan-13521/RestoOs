import { Expense } from "@/lib/db/models/Expense"
import { withAuth, apiSuccess, apiError, parsePagination, requireRole } from "@/lib/db/helpers"
import { expenseSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, context, session) => {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const pageParam = searchParams.get("page")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  if (category) filter.category = category

  if (pageParam) {
    const { page, limit, skip } = parsePagination(searchParams)
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments(filter),
    ])
    return apiSuccess({ data: expenses, total, page, limit })
  }

  const expenses = await Expense.find(filter).sort({ date: -1 }).limit(100).lean()
  return apiSuccess(expenses)
})

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "admin")
  const body = await req.json()
  const result = validateBody(expenseSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { title, amount, category, date, description } = result.data

  const expense = await Expense.create({
    title,
    amount,
    category,
    date: new Date(date),
    description: description || "",
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
    createdBy: session.user.id,
  })

  return apiSuccess(expense, 201)
})
