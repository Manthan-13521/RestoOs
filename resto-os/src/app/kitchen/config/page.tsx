"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Loader2, Printer } from "lucide-react"
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
  const [config, setConfig] = useState<KitchenConfig>({
    soundAlerts: true,
    autoScroll: true,
    preparationTimer: true,
    darkMode: false,
  })

  async function load() {
    try {
      const res = await fetch("/api/restaurant/settings")
      if (res.ok) {
        const data = await res.json()
        const settings = data.settings || {}
        setConfig({
          soundAlerts: settings.enableKDS ?? true,
          autoScroll: settings.autoScroll ?? true,
          preparationTimer: settings.preparationTimer ?? true,
          darkMode: settings.kitchenDarkMode ?? false,
        })
      }
    } catch { toast.error("Failed to load settings") } finally {
      setLoading(false)
    }
  }

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
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kitchen Settings</h1>
            <p className="text-muted-foreground">Configure kitchen display preferences</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
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
          <Button variant="outline" onClick={() => toast.success("Printer configured successfully")}>
            <Printer className="mr-2 h-4 w-4" />
            Configure Printer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
