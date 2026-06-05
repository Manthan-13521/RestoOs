import { headers } from "next/headers"

export interface TenantContext {
  organizationId: string
  restaurantId: string
}

export function getTenantFromHeaders(headersList: Headers): TenantContext | null {
  const orgId = headersList.get("x-organization-id")
  const restId = headersList.get("x-restaurant-id")
  if (!orgId || !restId) return null
  return { organizationId: orgId, restaurantId: restId }
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = await headers()
  return getTenantFromHeaders(headersList)
}

export function tenantQuery(tenant: TenantContext) {
  return {
    organizationId: tenant.organizationId,
    restaurantId: tenant.restaurantId,
  }
}

export function tenantQueryOptional(tenant?: TenantContext | null) {
  if (!tenant) return {}
  return tenantQuery(tenant)
}
