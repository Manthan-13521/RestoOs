import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/staff") || pathname.startsWith("/kitchen")

  if (!isProtected) {
    return NextResponse.next()
  }

  return auth(request as any) as any
}

export const config = {
  matcher: ["/(admin|staff|kitchen)/:path*"],
}
