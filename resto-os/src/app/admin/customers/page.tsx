"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Search, Users } from "lucide-react"
import toast from "react-hot-toast"

interface CustomerData { _id: string; name: string; phone: string; visitCount: number; totalSpent: number; lastVisit: string; createdAt: string }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState("")

  async function loadCustomers() {
    try { const res = await fetch("/api/customers"); const data = await res.json(); if (res.ok) setCustomers(data) } catch { toast.error("Failed to load customers") } finally { setLoading(false) }
  }

  useEffect(() => { loadCustomers() }, [])

  const filtered = search ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) : customers

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-64" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold tracking-tight">Customers</h1><p className="text-muted-foreground">Manage your customers</p></div>
      </div>
      <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or phone..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <Card><CardHeader><CardTitle>All Customers</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Visits</TableHead><TableHead>Total Spent</TableHead><TableHead>Last Visit</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow> : filtered.map(c => (
            <TableRow key={c._id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.phone}</TableCell><TableCell><Badge variant="outline">{c.visitCount}</Badge></TableCell><TableCell>{formatCurrency(c.totalSpent)}</TableCell><TableCell className="text-muted-foreground">{c.lastVisit ? formatDateTime(c.lastVisit) : "—"}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>
    </div>
  )
}
