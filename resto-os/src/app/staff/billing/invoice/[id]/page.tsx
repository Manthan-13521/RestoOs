"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  Printer,
  Download,
  Share2,
  MessageSquare,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
  MapPin,
  Phone,
  Mail as MailIcon,
  FileText,
  User,
  UtensilsCrossed,
  Hash,
  CalendarClock,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface InvoiceItem {
  name: string
  quantity: number
  price: number
  instructions?: string
}

interface InvoiceOrder {
  _id: string
  orderNumber: string
  items: InvoiceItem[]
  type?: string
  subtotal?: number
  total?: number
  notes?: string
}

interface InvoiceBill {
  _id: string
  billNumber: string
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  paidAmount: number
  remainingAmount: number
  status: string
  gstDetails?: { cgst: number; sgst: number; igst?: number }
  payments?: { method: string; amount: number; reference?: string }[]
  createdAt: string
  notes?: string
}

interface InvoiceRestaurant {
  name: string
  address: string
  phone: string
  email: string
  gstin?: string
  settings?: { taxRate?: number }
  logo?: string
}

interface InvoiceCashier {
  _id: string
  name: string
  email: string
}

interface InvoiceTable {
  _id: string
  number: number
  name: string
}

interface InvoiceData {
  bill: InvoiceBill
  order: InvoiceOrder
  restaurant: InvoiceRestaurant
  cashier: InvoiceCashier | null
  tableInfo: InvoiceTable | null
}

const statusConfig: Record<string, { color: string; bg: string; icon: LucideIcon; label: string }> = {
  paid: { color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/20", icon: CheckCircle2, label: "Paid" },
  partial: { color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/20", icon: Clock, label: "Partial" },
  pending: { color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/20", icon: AlertCircle, label: "Pending" },
}

export default function InvoicePage() {
  const params = useParams()
  const printRef = useRef<HTMLDivElement>(null)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bills/${params.id}/invoice`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }))
          toast.error(err.error || "Invoice not found")
        }
      } catch {
        toast.error("Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) return
    setPdfGenerating(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`invoice-${data?.bill?.billNumber || "download"}.pdf`)
      toast.success("PDF downloaded")
    } catch {
      toast.error("PDF generation failed. Try Print → Save as PDF instead.")
    } finally {
      setPdfGenerating(false)
    }
  }, [data])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${data?.bill?.billNumber}`, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success("Invoice link copied")
    }
  }, [data])

  const handleWhatsApp = useCallback(() => {
    const url = window.location.href
    const text = encodeURIComponent(`Invoice ${data?.bill?.billNumber} - ${data?.restaurant?.name}\n\n${url}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }, [data])

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Invoice ${data?.bill?.billNumber} from ${data?.restaurant?.name}`)
    const body = encodeURIComponent(`Dear Customer,\n\nPlease find your invoice from ${data?.restaurant?.name}.\n\nInvoice: ${data?.bill?.billNumber}\nTotal: ${formatCurrency(data?.bill?.total || 0)}\n\nView online: ${window.location.href}\n\nThank you for dining with us!`)
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank")
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <div className="mx-auto max-w-[210mm] space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold">Invoice Not Found</h2>
          <p className="text-muted-foreground">This invoice could not be loaded.</p>
          <Button asChild variant="outline">
            <Link href="/staff/billing">Back to Billing</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { bill, order, restaurant, cashier, tableInfo } = data
  const settings = restaurant?.settings || {}
  const gstDetails = bill.gstDetails
  const taxRate = settings.taxRate || 5
  const status = statusConfig[bill.status] || statusConfig.pending
  const StatusIcon = status.icon
  const invoiceUrl = typeof window !== "undefined" ? window.location.href : ""


  const itemsTotal = order?.items?.reduce((s: number, i: InvoiceItem) => s + i.price * i.quantity, 0) || 0
  const displaySubtotal = bill.subtotal || itemsTotal
  const effectiveDiscount = bill.discount || 0
  const effectiveServiceCharge = bill.serviceCharge || 0
  const effectiveTax = bill.tax || 0
  const grandTotal = bill.total || displaySubtotal + effectiveTax + effectiveServiceCharge - effectiveDiscount

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 print:bg-white">
      {/* Actions Bar - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between px-4 py-3">
          <Link
            href="/staff/billing"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadPDF} disabled={pdfGenerating} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{pdfGenerating ? "Generating..." : "PDF"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleWhatsApp} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEmail} className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="print-padding">
        <motion.div
          ref={printRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-[210mm] bg-white dark:bg-gray-900 shadow-lg print:shadow-none my-6 print:my-0 rounded-xl print:rounded-none overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 print:px-6 print:pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {restaurant?.logo ? (
                  <Avatar className="h-16 w-16 rounded-xl">
                    <AvatarImage src={restaurant.logo} alt={restaurant.name} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                      {getInitials(restaurant.name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{restaurant?.name || "Restaurant"}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Premium Dining Experience</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold tracking-wider text-primary">INVOICE</span>
                </div>
                <p className="text-sm font-mono text-muted-foreground mt-1.5">{bill.billNumber}</p>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Restaurant Info + Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                    <p className="text-sm">{restaurant?.address || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-sm">{restaurant?.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm">{restaurant?.email || "—"}</p>
                  </div>
                </div>
                {restaurant?.gstin && (
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GSTIN</p>
                      <p className="text-sm font-mono">{restaurant.gstin}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2 sm:text-right">
                <div className="flex items-center gap-3 sm:justify-end">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice #</p>
                    <p className="text-sm font-mono">{bill.billNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order #</p>
                    <p className="text-sm font-mono">{order?.orderNumber || "—"}</p>
                  </div>
                </div>
                {tableInfo && (
                  <div className="flex items-center gap-3 sm:justify-end">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Table</p>
                      <p className="text-sm font-medium">
                        Table {tableInfo.number}{tableInfo.name ? ` (${tableInfo.name})` : ""}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 sm:justify-end">
                  <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</p>
                    <p className="text-sm">{formatDateTime(bill.createdAt)}</p>
                  </div>
                </div>
                {cashier && (
                  <div className="flex items-center gap-3 sm:justify-end">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 sm:hidden" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cashier</p>
                      <p className="text-sm">{cashier.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Section */}
          {order?.type && (
            <div className="px-8 print:px-6">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Details</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Order Type</p>
                    <p className="font-medium capitalize">{order.type === "dinein" ? "Dine In" : order.type}</p>
                  </div>
                  {tableInfo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Table</p>
                      <p className="font-medium">#{tableInfo.number}</p>
                    </div>
                  )}
                  {order.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="font-medium text-muted-foreground">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="px-8 pt-6 print:px-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Order Items
            </h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Item
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order?.items?.length ? (
                    order.items.map((item: InvoiceItem, i: number) => (
                      <tr
                        key={i}
                        className={`border-t transition-colors ${
                          i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/20"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.instructions && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">{item.instructions}</p>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-sm">{formatCurrency(item.price)}</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t">
                      <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary + Payment Side-by-Side */}
          <div className="px-8 pt-6 pb-8 print:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Bill Summary
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(displaySubtotal)}</span>
                  </div>
                  {effectiveServiceCharge > 0 && (
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Service Charge</span>
                      <span>{formatCurrency(effectiveServiceCharge)}</span>
                    </div>
                  )}
                  {gstDetails ? (
                    <>
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">CGST ({taxRate / 2}%)</span>
                        <span>{formatCurrency(gstDetails.cgst || 0)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">SGST ({taxRate / 2}%)</span>
                        <span>{formatCurrency(gstDetails.sgst || 0)}</span>
                      </div>
                    </>
                  ) : effectiveTax > 0 ? (
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Tax (GST {taxRate}%)</span>
                      <span>{formatCurrency(effectiveTax)}</span>
                    </div>
                  ) : null}
                  {effectiveDiscount > 0 && (
                    <div className="flex justify-between px-4 py-2.5 text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(effectiveDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3 bg-primary/5 font-bold text-base">
                    <span>Grand Total</span>
                    <span className="text-lg">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Payment Details
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </span>
                </div>
                {bill.payments && bill.payments.length > 0 ? (
                  <div className="divide-y">
                    {bill.payments.map((p: { method: string; amount: number; reference?: string }, i: number) => (
                      <div key={i} className="px-4 py-2.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium capitalize">{p.method}</span>
                          <span>{formatCurrency(p.amount)}</span>
                        </div>
                        {p.reference && (
                          <p className="text-xs text-muted-foreground mt-0.5">Ref: {p.reference}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No payments recorded</div>
                )}
                <div className="border-t divide-y">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(bill.paidAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm font-medium">
                    <span>Balance Due</span>
                    <span className={bill.remainingAmount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                      {bill.remainingAmount > 0 ? formatCurrency(bill.remainingAmount) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="mt-4 flex items-center gap-4 rounded-lg border p-4">
                <div className="shrink-0 bg-white p-1 rounded-lg">
                  <QRCodeSVG value={invoiceUrl} size={72} level="M" />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground text-sm mb-0.5">Scan to View Invoice</p>
                  <p>Point your camera at this QR code to view the invoice online.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {bill.notes && (
            <div className="px-8 pb-2 print:px-6">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-sm border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p>{bill.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-8 py-6 text-center print:px-6">
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                Thank you for dining with us!
              </p>
              <p className="text-sm text-muted-foreground">
                Visit Again
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                This is a computer-generated invoice • {restaurant?.name || "RestoOS"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:my-0 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:px-6 {
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
          .print\\:pt-6 {
            padding-top: 1.5rem !important;
          }
          .print\\:pb-2 {
            padding-bottom: 0.5rem !important;
          }
          .print-padding {
            padding: 0 !important;
          }
          .no-break {
            break-inside: avoid;
          }
        }
        @media screen {
          .print-padding {
            padding: 0 1rem 2rem;
          }
        }
      `}</style>
    </div>
  )
}
