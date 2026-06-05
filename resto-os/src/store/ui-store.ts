import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"
type OnlineStatus = "online" | "offline" | "syncing"

interface UIStore {
  theme: Theme
  sidebarOpen: boolean
  onlineStatus: OnlineStatus
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setOnlineStatus: (status: OnlineStatus) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarOpen: true,
      onlineStatus: "online",
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setOnlineStatus: (onlineStatus) => set({ onlineStatus }),
    }),
    { name: "restoos-ui" }
  )
)
