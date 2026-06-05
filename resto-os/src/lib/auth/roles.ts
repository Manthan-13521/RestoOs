export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MANAGER: "manager",
  CASHIER: "cashier",
  WAITER: "waiter",
  KITCHEN_STAFF: "kitchen_staff",
} as const

export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100,
  admin: 80,
  manager: 60,
  cashier: 40,
  waiter: 20,
  kitchen_staff: 10,
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ["*"],
  admin: [
    "dashboard:read",
    "staff:manage",
    "finance:read",
    "customers:read",
    "tables:manage",
    "menu:manage",
    "orders:read",
    "billing:manage",
    "reports:read",
    "settings:manage",
    "emergency:manage",
  ],
  manager: [
    "dashboard:read",
    "staff:read",
    "finance:read",
    "customers:read",
    "tables:manage",
    "menu:manage",
    "orders:read",
    "billing:manage",
    "reports:read",
  ],
  cashier: ["orders:read", "billing:manage", "payments:manage"],
  waiter: ["tables:read", "orders:create", "orders:edit", "menu:read"],
  kitchen_staff: ["orders:read", "kitchen:manage"],
}

export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  if (!permissions) return false
  if (permissions.includes("*")) return true
  return permissions.includes(requiredPermission)
}

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0)
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    superadmin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    cashier: "Cashier",
    waiter: "Waiter",
    kitchen_staff: "Kitchen Staff",
  }
  return labels[role] ?? role
}
