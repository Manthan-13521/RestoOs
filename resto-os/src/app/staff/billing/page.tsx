"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import {
  Receipt,
  IndianRupee,
  Clock,
  CheckCircle2,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  FileText,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"
import { cn } from "@/lib/utils"

interface BillData {
  _id: string
  billNumber: string
  orderId: string
  subtotal: number
  tax: number
  serviceCharge: number
  total: number
  paidAmount: number
  remainingAmount: number
  status: string
  payments: { method: string; amount: number }[]
  createdAt: string
}

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Smartphone },
] as const

export default function StaffBillingPage() {
  const [loaded, setLoaded] = useState(false)
  const allOrders = useOrderStore((s) => s.orders)
  const orders = allOrders.filter((o: any) => !o.isPaid && o.status !== "cancelled")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [bill, setBill] = useState<BillData | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "upi">("cash")
  const [payAmount, setPayAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [todayStats, setTodayStats] = useState({ paid: 0, count: 0, avgBill: 0 })
  useRealtimeSync()

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      loadTodayStats()
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  async function loadTodayStats() {
    try {
      const res = await fetch("/api/reports/dashboard")
      if (res.ok) {
        const data = await res.json()
        setTodayStats({
          paid: data.todayRevenue || 0,
          count: data.todayOrders || 0,
          avgBill: data.averageOrderValue || 0,
        })
      }
    } catch {}
  }

  const loading = !loaded

  const pendingAmount = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const avgPending = orders.length > 0 ? Math.round(pendingAmount / orders.length) : 0

  async function generateBill(order: any) {
    setSelectedOrder(order)
    try {
      const billRes = await fetch(`/api/bills?orderId=${order._id}`)
      const bills = await billRes.json()
      if (bills.length > 0) setBill(bills[0])
      else {
        const res = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order._id, payments: [] }),
        })
        const data = await res.json()
        if (res.ok) setBill(data)
        else {
          if (data.details?.length) data.details.forEach((d: any) => toast.error(d.message))
          else toast.error(data.error || "Failed")
        }
      }
      setShowPayment(true)
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function processPayment() {
    if (!bill || !payAmount) {
      toast.error("Enter payment amount")
      return
    }
    const amount = Number(payAmount)
    if (amount <= 0) {
      toast.error("Invalid amount")
      return
    }
    setProcessing(true)
    try {
      const existingPayments = bill.payments || []
      const newPaid = bill.paidAmount + amount
      const newRemaining = Math.max(0, bill.total - newPaid)
      const newStatus = newRemaining <= 0 ? "paid" : "partial"
      const res = await fetch(`/api/bills/${bill._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [
            ...existingPayments,
            { method: payMethod, amount, status: "completed" },
          ],
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        }),
      })
      const updatedBill = await res.json()
      if (res.ok) {
        setBill(updatedBill)
        toast.success(
          updatedBill.status === "paid" ? "Payment complete!" : `Partial payment received`
        )
        if (updatedBill.status === "paid") setShowPayment(false)
        setPayAmount("")
      }
    } catch {
      toast.error("Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Process payments and manage invoices</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unpaid Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20">
                <IndianRupee className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Today</p>
                <p className="text-2xl font-bold">{formatCurrency(todayStats.paid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Bill</p>
                <p className="text-2xl font-bold">{formatCurrency(avgPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Orders Table */}
      <Card>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Unpaid Orders</h2>
            <Badge variant="secondary" className="rounded-full">
              {orders.length}
            </Badge>
          </div>
        </div>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">All Caught Up</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                No unpaid orders right now. New orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Order #</TableHead>
                    <TableHead className="font-semibold">Table</TableHead>
                    <TableHead className="font-semibold">Items</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any, idx: number) => (
                    <TableRow
                      key={order._id}
                      className={cn(
                        "transition-colors hover:bg-muted/30",
                        idx % 2 === 0 && "bg-muted/10"
                      )}
                    >
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                          {order.orderNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.tableId ? (
                          <Badge variant="outline" className="font-mono">
                            Table {order.tableId.number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Unpaid
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-9 min-w-[100px] font-medium"
                          onClick={() => generateBill(order)}
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          Generate Bill
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Receipt className="h-5 w-5 text-primary" />
              Payment — {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {bill && (
            <div className="space-y-5">
              {/* Bill Summary */}
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span className="font-medium">{formatCurrency(bill.tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Charge</span>
                  <span className="font-medium">{formatCurrency(bill.serviceCharge)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(bill.total)}</span>
                </div>
                {bill.paidAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Paid</span>
                    <span className="font-medium">{formatCurrency(bill.paidAmount)}</span>
                  </div>
                )}
                {bill.remainingAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400 font-semibold">
                    <span>Remaining</span>
                    <span>{formatCurrency(bill.remainingAmount)}</span>
                  </div>
                )}
              </div>

              {/* Payment Form */}
              {bill.remainingAmount > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map((pm) => {
                        const Icon = pm.icon
                        return (
                          <button
                            key={pm.value}
                            type="button"
                            onClick={() => setPayMethod(pm.value)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                              payMethod === pm.value
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                payMethod === pm.value
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-medium",
                                payMethod === pm.value
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              {pm.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payAmount" className="text-sm font-medium">
                      Amount
                    </Label>
                    <Input
                      id="payAmount"
                      type="number"
                      placeholder={`Max: ${formatCurrency(bill.remainingAmount)}`}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      max={bill.remainingAmount}
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setPayAmount(String(Math.round(bill.remainingAmount * 0.25)))
                      }
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setPayAmount(String(Math.round(bill.remainingAmount * 0.5)))
                      }
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setPayAmount(String(Math.round(bill.remainingAmount * 0.75)))
                      }
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPayAmount(String(bill.remainingAmount))}
                    >
                      Full
                    </Button>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    onClick={processPayment}
                    disabled={processing || !payAmount}
                  >
                    {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {payAmount
                      ? `Pay ${formatCurrency(Number(payAmount))}`
                      : "Enter an amount"}
                  </Button>
                </div>
              )}

              {/* Completed State */}
              {(bill.status === "paid" || bill.remainingAmount === 0) && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 py-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        Payment Complete
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bill #{bill.billNumber}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(`/staff/billing/invoice/${bill._id}`, "_blank")
                    }
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Bill #{bill.billNumber}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
