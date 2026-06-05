import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/",
]

const publicPrefixes = [
  "/api/auth",
  "/api/restaurants/register",
  "/_next/static",
  "/_next/image",
  "/favicon",
  "/sw.js",
  "/manifest.json",
  "/offline.html",
]

const adminRoles = ["admin", "manager", "superadmin"]
const staffRoles = ["admin", "manager", "cashier", "waiter", "superadmin"]
const kitchenRoles = ["kitchen_staff", "admin", "manager", "superadmin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (publicRoutes.some(r => pathname === r) || publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/menu") || pathname === "/menu") {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/public")) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  const role = req.auth!.user?.role

  if (!role || (pathname.startsWith("/admin") && !adminRoles.includes(role))) {
    return Response.redirect(new URL("/auth/login", req.url))
  }

  if (pathname.startsWith("/staff") && !staffRoles.includes(role)) {
    return Response.redirect(new URL("/auth/login", req.url))
  }

  if (pathname.startsWith("/kitchen") && !kitchenRoles.includes(role)) {
    return Response.redirect(new URL("/auth/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|icon-).*)"],
}
