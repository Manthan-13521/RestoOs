import { Order } from "@/lib/db/models/Order"
import { Bill } from "@/lib/db/models/Bill"
import { Table } from "@/lib/db/models/Table"
import { Customer } from "@/lib/db/models/Customer"
import { withAuth, apiSuccess, requireRole } from "@/lib/db/helpers"
import { startOfDay, subDays, format } from "date-fns"

export const GET = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const now = new Date()
  const todayStart = startOfDay(now)

  const baseFilter = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
  }

  const [todayOrders, totalOrders, activeTables, recentBills] = await Promise.all([
    Order.find({ ...baseFilter, createdAt: { $gte: todayStart } }).sort({ createdAt: -1 }).lean(),
    Order.countDocuments(baseFilter),
    Table.countDocuments({ ...baseFilter, status: { $in: ["occupied", "billing_pending"] } }),
    Bill.find(baseFilter).sort({ createdAt: -1 }).limit(30).lean(),
  ])

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const todayOrdersCount = todayOrders.length
  const averageOrderValue = todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0

  const salesMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(now, i), "MMM dd")
    salesMap.set(d, 0)
  }

  for (const bill of recentBills) {
    const d = format(new Date(bill.createdAt), "MMM dd")
    if (salesMap.has(d)) {
      salesMap.set(d, (salesMap.get(d) || 0) + bill.total)
    }
  }

  const salesTrend = Array.from(salesMap.entries()).map(([date, revenue]) => ({
    date,
    revenue,
    orders: 0,
  }))

  const recentOrders = todayOrders.slice(0, 10)

  return apiSuccess({
    totalRevenue: todayRevenue,
    todayRevenue,
    todayOrders: todayOrdersCount,
    totalOrders,
    activeTables,
    averageOrderValue,
    recentOrders,
    salesTrend,
  })
})
