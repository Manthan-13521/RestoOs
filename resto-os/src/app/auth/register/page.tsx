"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UtensilsCrossed, Loader2, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

const strengthConfig = [
  { label: "Weak", color: "bg-red-500", textColor: "text-red-500" },
  { label: "Fair", color: "bg-orange-500", textColor: "text-orange-500" },
  { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-500" },
  { label: "Strong", color: "bg-green-500", textColor: "text-green-500" },
]

function getStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    organizationName: "", restaurantName: "", name: "", email: "", phone: "", password: "", confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    organizationName: "", restaurantName: "", name: "", email: "", phone: "", password: "", confirmPassword: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target
    setForm(p => ({ ...p, [id]: value }))
    setErrors(p => ({ ...p, [id]: "" }))
  }

  function validate(): boolean {
    const e = { organizationName: "", restaurantName: "", name: "", email: "", phone: "", password: "", confirmPassword: "" }
    if (!form.organizationName.trim()) e.organizationName = "Required"
    if (!form.restaurantName.trim()) e.restaurantName = "Required"
    if (!form.name.trim()) e.name = "Required"
    if (!form.email.trim()) e.email = "Required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email"
    if (!form.phone.trim()) e.phone = "Required"
    else if (!/^\+?[\d\s-]{7,}$/.test(form.phone)) e.phone = "Invalid phone number"
    if (!form.password) e.password = "Required"
    else if (form.password.length < 8) e.password = "At least 8 characters"
    if (!form.confirmPassword) e.confirmPassword = "Required"
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match"
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/restaurants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: form.organizationName,
          restaurantName: form.restaurantName,
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Registration failed"); return }
      toast.success("Registration successful! Please sign in.")
      router.push("/auth/login")
    } catch { toast.error("Something went wrong") }
    finally { setIsLoading(false) }
  }

  const strength = getStrength(form.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-background dark:via-background dark:to-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Your RestoOS</CardTitle>
          <CardDescription>Set up your restaurant in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input id="organizationName" placeholder="Your Restaurant Group" value={form.organizationName} onChange={handleChange} required disabled={isLoading} autoComplete="organization" className={errors.organizationName ? "border-destructive" : ""} />
              {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input id="restaurantName" placeholder="The Grand Kitchen" value={form.restaurantName} onChange={handleChange} required disabled={isLoading} autoComplete="off" className={errors.restaurantName ? "border-destructive" : ""} />
              {errors.restaurantName && <p className="text-xs text-destructive">{errors.restaurantName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" placeholder="John Doe" value={form.name} onChange={handleChange} required disabled={isLoading} autoComplete="name" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} required disabled={isLoading} autoComplete="tel" inputMode="tel" className={errors.phone ? "border-destructive" : ""} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@restaurant.com" value={form.email} onChange={handleChange} required disabled={isLoading} autoComplete="email" inputMode="email" className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={form.password} onChange={handleChange} required minLength={8} disabled={isLoading} autoComplete="new-password" className={cn("pr-10", errors.password && "border-destructive")} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-1">
                  {strengthConfig.map((s, i) => (
                    <div key={s.label} className={cn("h-1.5 flex-1 rounded-full", i < strength ? s.color : "bg-muted")} />
                  ))}
                  <span className={cn("text-xs font-medium", strengthConfig[Math.max(0, strength - 1)]?.textColor || "text-muted-foreground")}>
                    {strengthConfig[Math.max(0, strength - 1)]?.label || ""}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} required disabled={isLoading} autoComplete="new-password" className={cn("pr-10", errors.confirmPassword && "border-destructive")} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create Account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/login" className="font-medium text-primary hover:underline">Sign in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
