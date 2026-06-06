"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatDateTime } from "@/lib/utils"
import { ScrollText, Activity, Clock } from "lucide-react"
import toast from "react-hot-toast"

interface AuditLogData {
  _id: string
  action: string
  resource: string
  performedBy?: { name: string }
  details?: string
  ip?: string
  createdAt: string
}

const actionVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  create: "success",
  update: "warning",
  delete: "destructive",
  login: "secondary",
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 15

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    try {
      const res = await fetch("/api/audit-logs")
      const data = await res.json()
      if (res.ok) setLogs(Array.isArray(data) ? data : data.data || [])
    } catch {
      toast.error("Failed to load")
    } finally {
      setLoading(false)
    }
  }

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action))
    return actions.size
  }, [logs])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t) }, [])
  const last24h = useMemo(() => {
    const cutoff = now - 24 * 60 * 60 * 1000
    return logs.filter(l => new Date(l.createdAt).getTime() >= cutoff).length
  }, [logs, now])

  const totalPages = Math.max(1, Math.ceil(logs.length / perPage))
  const paginatedLogs = logs.slice((page - 1) * perPage, page * perPage)
  const start = logs.length === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, logs.length)

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ScrollText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">System activity trail</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <ScrollText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unique Actions</p>
                <p className="text-xl font-bold">{uniqueActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last 24h</p>
                <p className="text-xl font-bold">{last24h}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ScrollText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">No Events Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">Audit logs will appear here as activity happens in your system.</p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="max-w-xs">Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((l, i) => (
                <TableRow key={l._id} className={cn(i % 2 === 0 && "bg-muted/50")}>
                  <TableCell>
                    <Badge variant={actionVariant[l.action] || "outline"} className="font-mono text-xs">
                      {l.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.resource}</TableCell>
                  <TableCell>{l.performedBy?.name || "System"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate" title={l.details || ""}>
                    {l.details || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {start} to {end} of {logs.length}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
