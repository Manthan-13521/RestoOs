import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    const role = session.user.role
    if (role === "admin" || role === "manager" || role === "superadmin") redirect("/admin/dashboard")
    else if (role === "kitchen_staff") redirect("/kitchen")
    else redirect("/staff/home")
  }
  redirect("/auth/login")
}
