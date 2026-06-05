"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        if (process.env.NODE_ENV === "development") console.warn("SW registration failed", e)
      })
    }
  }, [])

  return null
}
