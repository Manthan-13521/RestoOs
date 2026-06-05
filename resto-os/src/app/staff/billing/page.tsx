"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Receipt, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useRealtimeSync } from "@/hooks/use-realtime"
import { useOrderStore } from "@/store/order-store"

interface BillData { _id: string; billNumber: string; orderId: string; subtotal: number; tax: number; serviceCharge: number; total: number; paidAmount: number; remainingAmount: number; status: string; payments: { method: string; amount: number }[]; createdAt: string }

export default function StaffBillingPage() {
  const [loaded, setLoaded] = useState(false)
  const allOrders = useOrderStore(s => s.orders)
  const orders = allOrders.filter((o: any) => !o.isPaid && o.status !== "cancelled")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [bill, setBill] = useState<BillData | null>(null); const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<"cash"|"card"|"upi">("cash"); const [payAmount, setPayAmount] = useState(""); const [processing, setProcessing] = useState(false)
  useRealtimeSync()

  useEffect(() => {
    if (!loaded && (allOrders.length > 0 || document.readyState === "complete")) {
      const t = setTimeout(() => setLoaded(true), 2000)
      return () => clearTimeout(t)
    }
  }, [allOrders, loaded])

  const loading = !loaded

  async function generateBill(order: any) {
    setSelectedOrder(order)
    try { const billRes = await fetch(`/api/bills?orderId=${order._id}`); const bills = await billRes.json(); if (bills.length > 0) setBill(bills[0]); else { const res = await fetch("/api/bills", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ orderId: order._id, payments: [] }) }); const data = await res.json(); if (res.ok) setBill(data); else toast.error(data.error || "Failed") }; setShowPayment(true) } catch { toast.error("Something went wrong") }
  }

  async function processPayment() {
    if (!bill || !payAmount) { toast.error("Enter payment amount"); return }
    const amount = Number(payAmount); if (amount <= 0) { toast.error("Invalid amount"); return }
    setProcessing(true)
    try {
      const existingPayments = bill.payments || []
      const res = await fetch(`/api/bills/${bill._id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ payments: [...existingPayments, { method: payMethod, amount, status: "completed" }], paidAmount: bill.paidAmount + amount, remainingAmount: Math.max(0, bill.total - bill.paidAmount - amount), status: bill.total - bill.paidAmount - amount <= 0 ? "paid" : "partial" }) })
      const updatedBill = await res.json()
      if (res.ok) { setBill(updatedBill); toast.success(updatedBill.status === "paid" ? "Payment complete!" : `Partial payment received`); if (updatedBill.status === "paid") { setShowPayment(false) }; setPayAmount("") }
    } catch { toast.error("Payment failed") } finally { setProcessing(false) }
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold tracking-tight">Billing</h1><p className="text-muted-foreground">Generate bills and process payments</p></div>
      <Card><CardHeader><CardTitle>Unpaid Orders</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Table</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>{orders.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No unpaid orders</TableCell></TableRow> : orders.map(order => (
            <TableRow key={order._id}><TableCell className="font-medium">{order.orderNumber}</TableCell><TableCell>{order.tableId ? `Table ${order.tableId.number}` : "—"}</TableCell><TableCell>{order.items.length} items</TableCell><TableCell>{formatCurrency(order.total)}</TableCell><TableCell><Badge variant={order.isPaid ? "success" : "warning"}>{order.isPaid ? "Paid" : "Unpaid"}</Badge></TableCell><TableCell><Button size="sm" onClick={() => generateBill(order)}><Receipt className="mr-2 h-4 w-4" />Bill</Button></TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent><DialogHeader><DialogTitle>Payment — {selectedOrder?.orderNumber}</DialogTitle></DialogHeader>
          {bill && <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(bill.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (GST)</span><span>{formatCurrency(bill.tax)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span>{formatCurrency(bill.serviceCharge)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatCurrency(bill.total)}</span></div>
              {bill.paidAmount > 0 && <div className="flex justify-between text-success"><span>Paid</span><span>{formatCurrency(bill.paidAmount)}</span></div>}
              {bill.remainingAmount > 0 && <div className="flex justify-between text-destructive font-bold"><span>Remaining</span><span>{formatCurrency(bill.remainingAmount)}</span></div>}
            </div>
            {bill.remainingAmount > 0 && <div className="space-y-3">
              <div className="space-y-2"><Label>Method</Label><Select value={payMethod} onValueChange={(v: any) => setPayMethod(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="upi">UPI</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" placeholder={`Max: ${formatCurrency(bill.remainingAmount)}`} value={payAmount} onChange={e => setPayAmount(e.target.value)} max={bill.remainingAmount} /></div>
              <Button className="w-full" onClick={processPayment} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pay {payAmount ? formatCurrency(Number(payAmount)) : ""}</Button>
              <div className="grid grid-cols-3 gap-2"><Button variant="outline" size="sm" onClick={() => setPayAmount(String(bill.remainingAmount))}>Full</Button><Button variant="outline" size="sm" onClick={() => setPayAmount(String(Math.round(bill.remainingAmount / 2)))}>Half</Button><Button variant="outline" size="sm" onClick={() => setPayAmount(String(Math.round(bill.remainingAmount * 0.25)))}>Quarter</Button></div>
            </div>}
            {bill.status === "paid" && <div className="text-center py-4"><Badge variant="success" className="text-base px-4 py-1">✓ Payment Complete</Badge><div className="mt-2"><Button variant="outline" size="sm" onClick={() => window.open(`/staff/billing/invoice/${bill._id}`, "_blank")}><Receipt className="mr-2 h-4 w-4" />View Invoice</Button></div></div>}
            {bill.remainingAmount === 0 && bill.status !== "paid" && <div className="text-center py-4"><Badge variant="success" className="text-base px-4 py-1">✓ Fully Paid</Badge><div className="mt-2"><Button variant="outline" size="sm" onClick={() => window.open(`/staff/billing/invoice/${bill._id}`, "_blank")}><Receipt className="mr-2 h-4 w-4" />View Invoice</Button></div></div>}
            <div className="text-xs text-muted-foreground text-center">Bill #{bill.billNumber}</div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
