"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Search, Users, UserCheck, DollarSign, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"

interface CustomerData {
  _id: string
  name: string
  phone: string
  visitCount: number
  totalSpent: number
  lastVisit: string
  createdAt: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  async function loadCustomers() {
    try {
      const res = await fetch("/api/customers")
      const data = await res.json()
      if (res.ok) setCustomers(data)
    } catch {
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers

  const totalVisits = customers.reduce((s, c) => s + c.visitCount, 0)
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)

  if (loading)
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )

  const noResults = search && filtered.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            {customers.length} registered customers
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Customers</p>
                <p className="text-xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. per Customer</p>
                <p className="text-xl font-bold">
                  {customers.length > 0
                    ? formatCurrency(Math.round(totalSpent / customers.length))
                    : formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">All Customers</h2>
        </div>
        <CardContent className="p-0">
          {customers.length === 0 && !search ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground">
                No customers yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Customers will appear here after they place orders.
              </p>
            </div>
          ) : noResults ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground">
                No results for "{search}"
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different name or phone number.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Visits</TableHead>
                    <TableHead className="font-semibold text-right">
                      Total Spent
                    </TableHead>
                    <TableHead className="font-semibold">Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, idx) => (
                    <TableRow
                      key={c._id}
                      className={
                        idx % 2 === 0 ? "bg-muted/10" : ""
                      }
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.visitCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.totalSpent)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.lastVisit ? formatDateTime(c.lastVisit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
