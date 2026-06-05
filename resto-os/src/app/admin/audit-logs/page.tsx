"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils"
import { ScrollText } from "lucide-react"
import toast from "react-hot-toast"

interface AuditLogData { _id: string; action: string; resource: string; performedBy?: { name: string }; details?: string; ip?: string; createdAt: string }

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([]); const [loading, setLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    try { const res = await fetch("/api/audit-logs"); const data = await res.json(); if (res.ok) setLogs(Array.isArray(data) ? data : data.data || []) } catch { toast.error("Failed to load") } finally { setLoading(false) }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><ScrollText className="h-5 w-5 text-primary" /></div><div><h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1><p className="text-muted-foreground">System activity trail</p></div></div>
      <Card><CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Resource</TableHead><TableHead>User</TableHead><TableHead>Details</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
          <TableBody>{logs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit logs</TableCell></TableRow> : logs.map(l => (
            <TableRow key={l._id}><TableCell><Badge variant="outline" className="font-mono text-xs">{l.action}</Badge></TableCell><TableCell className="text-muted-foreground">{l.resource}</TableCell><TableCell>{l.performedBy?.name || "System"}</TableCell><TableCell className="text-muted-foreground max-w-xs truncate">{l.details || "—"}</TableCell><TableCell className="text-muted-foreground text-sm">{formatDateTime(l.createdAt)}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
    </div>
  )
}
