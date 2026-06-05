import { Bill } from "@/lib/db/models/Bill"
import { Expense } from "@/lib/db/models/Expense"
import { withAuth, apiSuccess, requireRole } from "@/lib/db/helpers"
import { startOfMonth } from "date-fns"

export const GET = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const now = new Date()
  const monthStart = startOfMonth(now)

  const baseFilter = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  const [allBills, monthBills, totalExpenses] = await Promise.all([
    Bill.find({ ...baseFilter, status: { $in: ["paid", "partial"] }, createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } }).lean(),
    Bill.find({ ...baseFilter, createdAt: { $gte: monthStart } }).lean(),
    Expense.find({ ...baseFilter, createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } }).lean(),
  ])

  let totalRevenue = 0
  let cashTotal = 0
  let cardTotal = 0
  let upiTotal = 0

  for (const bill of allBills) {
    totalRevenue += bill.paidAmount || 0
    for (const payment of bill.payments) {
      if (payment.method === "cash") cashTotal += payment.amount
      else if (payment.method === "card") cardTotal += payment.amount
      else if (payment.method === "upi") upiTotal += payment.amount
    }
  }

  const totalTax = allBills.reduce((sum, b) => sum + (b.tax || 0), 0)

  const recentBills = await Bill.find(baseFilter)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  const expenseTotal = totalExpenses.reduce((sum, e) => sum + e.amount, 0)

  const paymentMethods: Record<string, number> = {}
  if (cashTotal > 0) paymentMethods.cash = cashTotal
  if (cardTotal > 0) paymentMethods.card = cardTotal
  if (upiTotal > 0) paymentMethods.upi = upiTotal

  const orderCount = allBills.length
  const averageOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

  return apiSuccess({
    totalRevenue,
    totalTax,
    gstCollected: totalTax,
    averageOrder,
    paymentMethods,
    recentBills,
  })
})
