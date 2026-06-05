"use client"

import { useEffect, useRef, useCallback } from "react"
import { useOrderStore } from "@/store/order-store"
import { useTableStore } from "@/store/table-store"
import { useNotificationStore } from "@/store/notification-store"
import { useAuthStore } from "@/store/auth-store"
import { subscribeToChannel, buildChannelName } from "@/lib/realtime/ably"

type RealtimeEvent = {
  type: "order_created" | "order_updated" | "item_status_changed" | "table_status_changed" | "payment_received" | "waiter_call" | "notification"
  data: any
}

const POLL_INTERVAL = 10000

export function useRealtimeSync(restaurantId?: string) {
  const userRestaurantId = useAuthStore((s) => s.user?.restaurantId)
  const rid = restaurantId || userRestaurantId
  const { setOrders, setKitchenOrders } = useOrderStore()
  const { setTables } = useTableStore()
  const { addNotification } = useNotificationStore()
  const subsRef = useRef<(() => void)[]>([])

  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case "order_created":
      case "order_updated":
      case "item_status_changed":
        syncOrders()
        break
      case "table_status_changed":
        syncTables()
        break
      case "notification":
        addNotification(event.data)
        break
    }
  }, [])

  const syncOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : data.data || [])
      }
    } catch {}
  }, [setOrders])

  const syncKitchenOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=confirmed,preparing,ready")
      if (res.ok) {
        const data = await res.json()
        setKitchenOrders(Array.isArray(data) ? data : data.data || [])
      }
    } catch {}
  }, [setKitchenOrders])

  const syncTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables")
      if (res.ok) {
        const data = await res.json()
        setTables(Array.isArray(data) ? data : data.data || [])
      }
    } catch {}
  }, [setTables])

  const syncAll = useCallback(async () => {
    await Promise.all([syncOrders(), syncKitchenOrders(), syncTables()])
  }, [syncOrders, syncKitchenOrders, syncTables])

  useEffect(() => {
    if (!rid) return
    const channelName = buildChannelName(rid, "orders")
    const unsub = subscribeToChannel(channelName, "order_update", (data: any) => {
      try {
        const event = typeof data === "string" ? JSON.parse(data) : data
        handleEvent(event)
      } catch {
        syncOrders()
      }
    })
    subsRef.current.push(unsub)
    return () => { unsub() }
  }, [rid, handleEvent, syncOrders])

  useEffect(() => {
    syncAll()
    const interval = setInterval(syncAll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [syncAll])

  return { syncAll, syncOrders, syncTables }
}
