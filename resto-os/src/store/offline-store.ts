import { create } from "zustand"
import {
  cacheMenuItems,
  getCachedMenuItems,
  queuePendingOrder,
  queuePendingPayment,
  queueWaiterCall,
  getPendingOrders,
  getPendingPayments,
  getPendingWaiterCalls,
  syncAll,
} from "@/lib/offline/db"

interface OfflineStore {
  caching: boolean
  cacheMenu: (items: any[], restaurantId: string) => Promise<void>
  getCachedMenu: (restaurantId: string) => Promise<any[]>
  queueOrder: (params: { restaurantId: string; tableId: string; items: any[]; notes?: string; type: string }) => Promise<void>
  queuePayment: (params: { restaurantId: string; billId: string; amount: number; method: string }) => Promise<void>
  queueWaiterCall: (params: { restaurantId: string; tableId: string }) => Promise<void>
  syncAll: (restaurantId: string) => Promise<void>
  getPendingCount: (restaurantId: string) => Promise<number>
}

export const useOfflineStore = create<OfflineStore>((set) => ({
  caching: false,
  cacheMenu: async (items, restaurantId) => {
    set({ caching: true })
    try {
      await cacheMenuItems(items, restaurantId)
    } finally {
      set({ caching: false })
    }
  },
  getCachedMenu: async (restaurantId) => {
    return getCachedMenuItems(restaurantId)
  },
  queueOrder: async (params) => {
    await queuePendingOrder(params)
  },
  queuePayment: async (params) => {
    await queuePendingPayment(params)
  },
  queueWaiterCall: async (params) => {
    await queueWaiterCall(params)
  },
  syncAll: async (restaurantId) => {
    set({ caching: true })
    try {
      await syncAll(restaurantId)
    } finally {
      set({ caching: false })
    }
  },
  getPendingCount: async (restaurantId) => {
    const orders = await getPendingOrders(restaurantId)
    const payments = await getPendingPayments(restaurantId)
    const calls = await getPendingWaiterCalls(restaurantId)
    return orders.length + payments.length + calls.length
  },
}))
