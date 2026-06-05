"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface InvoiceOrderItem { name: string; quantity: number; price: number }
interface InvoiceOrder { _id: string; orderNumber: string; tableId?: { number: number; name: string }; items: InvoiceOrderItem[] }
interface InvoiceBill { billNumber: string; subtotal: number; tax: number; serviceCharge: number; total: number; paidAmount: number; remainingAmount: number; status: string; discount: number; gstDetails?: { cgst: number; sgst: number; igst?: number }; payments?: { method: string; amount: number }[]; createdAt: string }
interface InvoiceRestaurant { name: string; address: string; phone: string; email: string; gstin?: string; settings?: { taxRate?: number } }
interface InvoiceData {
  bill: InvoiceBill
  order: InvoiceOrder
  restaurant: InvoiceRestaurant
}

export default function InvoicePage() {
  const params = useParams()
  const printRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bills/${params.id}/invoice`)
        if (res.ok) setData(await res.json())
        else toast.error("Invoice not found")
      } catch {
        toast.error("Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  function handlePrint() {
    window.print()
  }

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>
  if (!data) return <div className="p-8 text-center text-muted-foreground">Invoice not found</div>

  const { bill, order, restaurant } = data
  const settings = restaurant?.settings || {}
  const gstDetails = bill.gstDetails

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="print:hidden flex items-center justify-between border-b bg-white px-6 py-3">
        <Link href="/staff/billing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Billing
        </Link>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print Invoice</Button>
      </div>

      <div ref={printRef} className="mx-auto max-w-[210mm] bg-white p-8 print:p-4 print:shadow-none shadow-lg my-8 print:my-0">
        <div className="border-b pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{restaurant?.name || "Restaurant"}</h1>
              <p className="text-sm text-muted-foreground">{restaurant?.address}</p>
              <p className="text-sm text-muted-foreground">Phone: {restaurant?.phone}</p>
              <p className="text-sm text-muted-foreground">Email: {restaurant?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">INVOICE</p>
              <p className="text-sm text-muted-foreground">{bill.billNumber}</p>
            </div>
          </div>
          {restaurant?.gstin && <p className="text-sm mt-2">GSTIN: {restaurant.gstin}</p>}
        </div>

        <div className="flex justify-between mb-6 text-sm">
          <div>
            <p className="font-medium">Date: {formatDateTime(bill.createdAt)}</p>
            {order?.tableId && <p>Table: {order.tableId?.number || "—"} ({order.tableId?.name || "—"})</p>}
            <p>Order: {order?.orderNumber || "—"}</p>
          </div>
        </div>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b border-t bg-gray-50">
              <th className="text-left py-2 px-1 text-sm font-medium">Item</th>
              <th className="text-center py-2 px-1 text-sm font-medium">Qty</th>
              <th className="text-right py-2 px-1 text-sm font-medium">Price</th>
              <th className="text-right py-2 px-1 text-sm font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order?.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b">
                <td className="py-2 px-1 text-sm">{item.name}</td>
                <td className="text-center py-2 px-1 text-sm">{item.quantity}</td>
                <td className="text-right py-2 px-1 text-sm">{formatCurrency(item.price)}</td>
                <td className="text-right py-2 px-1 text-sm">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span></div>
            {bill.serviceCharge > 0 && <div className="flex justify-between"><span>Service Charge</span><span>{formatCurrency(bill.serviceCharge)}</span></div>}
            {gstDetails && (
              <>
                <div className="flex justify-between"><span>CGST ({settings.taxRate ? settings.taxRate / 2 : 2.5}%)</span><span>{formatCurrency(gstDetails.cgst)}</span></div>
                <div className="flex justify-between"><span>SGST ({settings.taxRate ? settings.taxRate / 2 : 2.5}%)</span><span>{formatCurrency(gstDetails.sgst)}</span></div>
              </>
            )}
            {!gstDetails && bill.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(bill.tax)}</span></div>}
            {bill.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(bill.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{formatCurrency(bill.total)}</span></div>
            {bill.paidAmount > 0 && <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(bill.paidAmount)}</span></div>}
            {bill.remainingAmount > 0 && <div className="flex justify-between text-destructive"><span>Remaining</span><span>{formatCurrency(bill.remainingAmount)}</span></div>}
          </div>
        </div>

        {bill.payments && bill.payments.length > 0 && (
          <div className="border-t pt-4 mb-4">
            <p className="text-sm font-medium mb-2">Payment{ bill.payments.length > 1 ? "s" : "" }</p>
            {bill.payments.map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-sm text-muted-foreground">
                <span className="capitalize">{p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          <p>Thank you for dining with us!</p>
          <p className="text-xs mt-1">This is a computer-generated invoice</p>
        </div>
      </div>
    </div>
  )
}
