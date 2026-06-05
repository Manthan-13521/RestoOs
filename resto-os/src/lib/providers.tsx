"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"
import { useUIStore } from "@/store/ui-store"

function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const setOnlineStatus = useUIStore((s) => s.setOnlineStatus)

  useEffect(() => {
    setOnlineStatus(navigator.onLine ? "online" : "offline")
  }, [setOnlineStatus])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <OnlineStatusProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "8px",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </OnlineStatusProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
