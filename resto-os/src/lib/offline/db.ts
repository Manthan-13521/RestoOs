import Dexie, { type Table } from "dexie"

interface CachedMenuItem {
  id: string
  restaurantId: string
  name: string
  price: number
  type: string
  categoryId: string
  status: string
  data: any
}

interface CachedOrder {
  id: string
  restaurantId: string
  tableId: string
  status: string
  data: any
  synced: boolean
}

interface PendingOrder {
  id?: number
  restaurantId: string
  tableId: string
  items: any[]
  notes?: string
  type: string
  timestamp: number
}

interface PendingPayment {
  id?: number
  restaurantId: string
  billId: string
  amount: number
  method: string
  timestamp: number
}

interface PendingWaiterCall {
  id?: number
  restaurantId: string
  tableId: string
  timestamp: number
}

interface PendingSync {
  id?: number
  action: "create" | "update" | "delete"
  resource: string
  data: any
  timestamp: number
  restaurantId: string
}

class RestoOSDB extends Dexie {
  menuItems!: Table<CachedMenuItem, string>
  orders!: Table<CachedOrder, string>
  pendingSync!: Table<PendingSync, number>
  pendingOrders!: Table<PendingOrder, number>
  pendingPayments!: Table<PendingPayment, number>
  waiterCalls!: Table<PendingWaiterCall, number>

  constructor() {
    super("RestoOS")
    this.version(2).stores({
      menuItems: "id, restaurantId, categoryId",
      orders: "id, restaurantId, tableId, status",
      pendingSync: "++id, restaurantId, timestamp",
      pendingOrders: "++id, restaurantId, timestamp",
      pendingPayments: "++id, restaurantId, timestamp",
      waiterCalls: "++id, restaurantId, timestamp",
    })
  }
}

export const db = new RestoOSDB()

export async function cacheMenuItems(items: any[], restaurantId: string) {
  await db.menuItems.bulkPut(
    items.map((item) => ({
      id: item._id,
      restaurantId,
      name: item.name,
      price: item.price,
      type: item.type,
      categoryId: item.categoryId,
      status: item.status,
      data: item,
    }))
  )
}

export async function getCachedMenuItems(restaurantId: string) {
  return db.menuItems.where("restaurantId").equals(restaurantId).toArray()
}

export async function queuePendingOrder(params: {
  restaurantId: string
  tableId: string
  items: any[]
  notes?: string
  type: string
}) {
  return db.pendingOrders.add({ ...params, timestamp: Date.now() })
}

export async function getPendingOrders(restaurantId: string) {
  return db.pendingOrders.where("restaurantId").equals(restaurantId).sortBy("timestamp")
}

export async function removePendingOrder(id: number) {
  return db.pendingOrders.delete(id)
}

export async function queuePendingPayment(params: {
  restaurantId: string
  billId: string
  amount: number
  method: string
}) {
  return db.pendingPayments.add({ ...params, timestamp: Date.now() })
}

export async function getPendingPayments(restaurantId: string) {
  return db.pendingPayments.where("restaurantId").equals(restaurantId).sortBy("timestamp")
}

export async function removePendingPayment(id: number) {
  return db.pendingPayments.delete(id)
}

export async function queueWaiterCall(params: {
  restaurantId: string
  tableId: string
}) {
  return db.waiterCalls.add({ ...params, timestamp: Date.now() })
}

export async function getPendingWaiterCalls(restaurantId: string) {
  return db.waiterCalls.where("restaurantId").equals(restaurantId).sortBy("timestamp")
}

export async function removeWaiterCall(id: number) {
  return db.waiterCalls.delete(id)
}

export async function queueSync(
  action: "create" | "update" | "delete",
  resource: string,
  data: any,
  restaurantId: string
) {
  await db.pendingSync.add({
    action,
    resource,
    data,
    timestamp: Date.now(),
    restaurantId,
  })
}

function syncFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
}

export async function processSyncQueue(restaurantId: string) {
  const items = await db.pendingSync
    .where("restaurantId")
    .equals(restaurantId)
    .sortBy("timestamp")

  for (const item of items) {
    try {
      const method = item.action === "create" ? "POST" : item.action === "update" ? "PUT" : "DELETE"
      const res = await syncFetch(`/api/${item.resource}`, {
        method,
        body: method !== "DELETE" ? JSON.stringify(item.data) : undefined,
      })

      if (res.ok) {
        await db.pendingSync.delete(item.id!)
      }
    } catch {
      console.warn("Sync failed for", item.resource, "- will retry")
    }
  }
}

export async function processPendingOrders(restaurantId: string) {
  const orders = await getPendingOrders(restaurantId)
  for (const order of orders) {
    try {
      const res = await syncFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          tableId: order.tableId,
          items: order.items,
          notes: order.notes,
          type: order.type,
        }),
      })
      if (res.ok) {
        await removePendingOrder(order.id!)
      }
    } catch {
      console.warn("Order sync failed - will retry")
    }
  }
}

export async function processPendingPayments(restaurantId: string) {
  const payments = await getPendingPayments(restaurantId)
  for (const payment of payments) {
    try {
      const res = await syncFetch(`/api/bills/${payment.billId}`, {
        method: "PUT",
        body: JSON.stringify({
          payments: [{ method: payment.method, amount: payment.amount, status: "completed" }],
        }),
      })
      if (res.ok) {
        await removePendingPayment(payment.id!)
      }
    } catch {
      console.warn("Payment sync failed - will retry")
    }
  }
}

export async function processWaiterCalls(restaurantId: string) {
  const calls = await getPendingWaiterCalls(restaurantId)
  for (const call of calls) {
    try {
      const res = await fetch("/api/public/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: call.tableId,
        }),
      })
      if (res.ok) {
        await removeWaiterCall(call.id!)
      }
    } catch {
      console.warn("Waiter call sync failed - will retry")
    }
  }
}

export async function syncAll(restaurantId: string) {
  await Promise.allSettled([
    processSyncQueue(restaurantId),
    processPendingOrders(restaurantId),
    processPendingPayments(restaurantId),
    processWaiterCalls(restaurantId),
  ])
}

export async function getSyncStatus(restaurantId: string) {
  const [syncCount, orderCount, paymentCount, callCount] = await Promise.all([
    db.pendingSync.where("restaurantId").equals(restaurantId).count(),
    db.pendingOrders.where("restaurantId").equals(restaurantId).count(),
    db.pendingPayments.where("restaurantId").equals(restaurantId).count(),
    db.waiterCalls.where("restaurantId").equals(restaurantId).count(),
  ])
  return {
    pendingCount: syncCount + orderCount + paymentCount + callCount,
    isSyncing: syncCount + orderCount + paymentCount + callCount > 0,
  }
}
