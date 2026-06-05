import { create } from "zustand"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  priority: string
  createdAt: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAllRead: () => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.length }),
  addNotification: (notification) =>
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + 1,
    }),
  markAllRead: () => set({ unreadCount: 0 }),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))
