"use client"

import { useEffect, useCallback } from "react"
import { useUIStore } from "@/store/ui-store"
import { syncAll } from "@/lib/offline/db"

export function useOfflineSync(restaurantId?: string) {
  const { onlineStatus, setOnlineStatus } = useUIStore()

  const sync = useCallback(async () => {
    if (!restaurantId) return
    setOnlineStatus("syncing")
    try {
      await syncAll(restaurantId)
      setOnlineStatus("online")
    } catch {
      setOnlineStatus("offline")
    }
  }, [restaurantId, setOnlineStatus])

  useEffect(() => {
    const handleOnline = async () => {
      setOnlineStatus("syncing")
      await sync()
    }

    const handleOffline = () => {
      setOnlineStatus("offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [sync, setOnlineStatus])

  return { sync, onlineStatus }
}
