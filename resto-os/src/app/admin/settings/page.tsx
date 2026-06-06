"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Loader2, RotateCcw, Store, CreditCard, Puzzle } from "lucide-react"
import toast from "react-hot-toast"

interface RestaurantSettings {
  currency: string
  timezone: string
  taxRate: number
  gstin?: string
  serviceCharge: number
  enableKDS: boolean
  enableWhatsApp: boolean
  enableQR: boolean
  enableReservations: boolean
}

interface SettingsData {
  name: string
  address: string
  phone: string
  email: string
  settings: RestaurantSettings
}

const defaultSettings: RestaurantSettings = {
  currency: "INR",
  timezone: "Asia/Kolkata",
  taxRate: 5,
  gstin: "",
  serviceCharge: 0,
  enableKDS: true,
  enableWhatsApp: false,
  enableQR: true,
  enableReservations: true,
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<SettingsData | null>(null)
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" })
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await fetch("/api/restaurant/settings")
      if (res.ok) {
        const d: SettingsData = await res.json()
        setData(d)
        setForm({ name: d.name, address: d.address, phone: d.phone, email: d.email })
        setSettings(d.settings)
      } else {
        toast.error("Failed to load settings")
      }
    } catch {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const hasUnsavedChanges = useCallback(() => {
    if (!data) return false
    return (
      form.name !== data.name ||
      form.address !== data.address ||
      form.phone !== data.phone ||
      form.email !== data.email ||
      JSON.stringify(settings) !== JSON.stringify(data.settings)
    )
  }, [form, settings, data])

  function handleTabChange(value: string) {
    if (hasUnsavedChanges() && value !== activeTab) {
      toast.error("Save or discard your changes before switching tabs")
      return
    }
    setActiveTab(value)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/restaurant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, settings }),
      })
      if (res.ok) {
        toast.success("Settings saved")
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save settings")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!data) return
    setForm({ name: data.name, address: data.address, phone: data.phone, email: data.email })
    setSettings({ ...data.settings })
    toast.success("Changes reverted")
  }

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div><Skeleton className="h-7 w-32" /><Skeleton className="h-4 w-48 mt-1" /></div>
      </div>
      <Skeleton className="h-10 w-80 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage restaurant configuration</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving || !hasUnsavedChanges()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />General
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />Billing & Tax
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Puzzle className="h-4 w-4" />Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" />Restaurant Information</CardTitle>
              <CardDescription>Basic details about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Billing & Tax Configuration</CardTitle>
              <CardDescription>Tax rates, currency, and charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={settings.currency} onValueChange={v => setSettings(p => ({...p, currency: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={v => setSettings(p => ({...p, timezone: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input type="number" value={settings.taxRate} onChange={e => setSettings(p => ({...p, taxRate: Number(e.target.value) || 0}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Charge (%)</Label>
                    <Input type="number" value={settings.serviceCharge} onChange={e => setSettings(p => ({...p, serviceCharge: Number(e.target.value) || 0}))} />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input value={settings.gstin || ""} onChange={e => setSettings(p => ({...p, gstin: e.target.value}))} placeholder="Optional" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Puzzle className="h-5 w-5 text-primary" />Feature Toggles</CardTitle>
              <CardDescription>Enable or disable restaurant features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "enableKDS" as const, label: "Kitchen Display System", desc: "Show orders in kitchen in real-time" },
                { key: "enableWhatsApp" as const, label: "WhatsApp Notifications", desc: "Send order updates via WhatsApp" },
                { key: "enableQR" as const, label: "QR Menu Ordering", desc: "Allow customers to order via QR code" },
                { key: "enableReservations" as const, label: "Online Reservations", desc: "Accept table reservations" },
              ].map(f => (
                <div key={f.key} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                  <Switch checked={settings[f.key]} onCheckedChange={v => setSettings(p => ({...p, [f.key]: v}))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
