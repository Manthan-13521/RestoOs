"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Settings, Loader2, Printer, ChefHat, Bell, RefreshCw, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"

interface KitchenConfig {
  soundAlerts: boolean
  autoScroll: boolean
  preparationTimer: boolean
  darkMode: boolean
}

export default function KitchenConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeOrders, setActiveOrders] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [showPrinterDialog, setShowPrinterDialog] = useState(false)
  const [printerConfig, setPrinterConfig] = useState({ port: "9100", paperSize: "80mm", copies: "1" })
  const [config, setConfig] = useState<KitchenConfig>({
    soundAlerts: true,
    autoScroll: true,
    preparationTimer: true,
    darkMode: false,
  })

  async function load() {
    try {
      const [settingsRes, ordersRes] = await Promise.all([
        fetch("/api/restaurant/settings"),
        fetch("/api/kitchen/orders").catch(() => null),
      ])
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        const settings = data.settings || {}
        setConfig({
          soundAlerts: settings.enableKDS ?? true,
          autoScroll: settings.autoScroll ?? true,
          preparationTimer: settings.preparationTimer ?? true,
          darkMode: settings.kitchenDarkMode ?? false,
        })
      }
      if (ordersRes?.ok) {
        const orders = await ordersRes.json()
        const preparing = Array.isArray(orders) ? orders.filter((o: any) => o.status === "preparing").length : 0
        setActiveOrders(preparing)
      }
      setLastSync(new Date())
    } catch { toast.error("Failed to load settings") } finally {
      setLoading(false)
    }
  }

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const settingsRes = await fetch("/api/restaurant/settings")
      if (!settingsRes.ok) { toast.error("Failed to load settings"); return }
      const data = await settingsRes.json()
      const res = await fetch("/api/restaurant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...data.settings,
            enableKDS: config.soundAlerts,
            autoScroll: config.autoScroll,
            preparationTimer: config.preparationTimer,
            kitchenDarkMode: config.darkMode,
          },
        }),
      })
      if (res.ok) {
        toast.success("Kitchen settings saved")
        setLastSync(new Date())
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    const defaults = { soundAlerts: true, autoScroll: true, preparationTimer: true, darkMode: false }
    setConfig(defaults)
    try {
      const settingsRes = await fetch("/api/restaurant/settings")
      const data = settingsRes.ok ? await settingsRes.json() : { settings: {} }
      const res = await fetch("/api/restaurant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...data.settings,
            enableKDS: true,
            autoScroll: true,
            preparationTimer: true,
            kitchenDarkMode: false,
          },
        }),
      })
      if (res.ok) {
        toast.success("Settings reset to defaults")
        setLastSync(new Date())
      } else {
        toast.error("Failed to reset settings")
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  function getRelativeTime(date: Date, now_: number): string {
    const diff = Math.floor((now_ - date.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const syncText = lastSync ? getRelativeTime(lastSync, now) : "—"

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kitchen Settings</h1>
            <p className="text-muted-foreground">Configure kitchen display preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <ChefHat className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Orders</p>
                <p className="text-xl font-bold">{activeOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sound Alerts</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", config.soundAlerts ? "bg-green-500" : "bg-red-500")} />
                  <p className="text-xl font-bold">{config.soundAlerts ? "On" : "Off"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="text-xl font-bold">{syncText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Display Preferences</CardTitle><CardDescription>Customize your kitchen display system</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "soundAlerts" as const, label: "Sound Alerts", desc: "Play a sound when new orders arrive" },
            { key: "autoScroll" as const, label: "Auto-scroll", desc: "Automatically scroll to new orders" },
            { key: "preparationTimer" as const, label: "Preparation Timer", desc: "Show elapsed time for each item" },
            { key: "darkMode" as const, label: "Dark Mode", desc: "Use dark theme for kitchen display" },
          ].map(f => (
            <div key={f.key} className="flex items-center justify-between rounded-lg border p-4">
              <div><p className="font-medium">{f.label}</p><p className="text-sm text-muted-foreground">{f.desc}</p></div>
              <Switch checked={config[f.key]} onCheckedChange={v => setConfig(p => ({...p, [f.key]: v}))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Printer</CardTitle><CardDescription>Configure receipt and order printing</CardDescription></CardHeader>
        <CardContent>
          <Dialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><Printer className="mr-2 h-4 w-4" />Configure Printer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-3"><Printer className="h-5 w-5 text-primary" />Printer Configuration</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input value={printerConfig.port} onChange={e => setPrinterConfig(p => ({...p, port: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select value={printerConfig.paperSize} onValueChange={v => setPrinterConfig(p => ({...p, paperSize: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80mm">80mm</SelectItem>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Copies</Label>
                  <Input type="number" min={1} value={printerConfig.copies} onChange={e => setPrinterConfig(p => ({...p, copies: e.target.value}))} />
                </div>
                <Button className="w-full" onClick={() => { toast.success("Printer configured successfully"); setShowPrinterDialog(false) }}>
                  Save Printer Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
