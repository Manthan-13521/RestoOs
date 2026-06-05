"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { IndianRupee, Plus, Loader2, Search } from "lucide-react"
import toast from "react-hot-toast"

interface ExpenseData { _id: string; title: string; amount: number; category: string; description?: string; date: string; createdBy?: string }

const categories = ["Food", "Beverages", "Utilities", "Maintenance", "Salary", "Marketing", "Other"]

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false); const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0], description: "" })

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    try { const res = await fetch("/api/expenses"); const data = await res.json(); if (res.ok) setExpenses(Array.isArray(data) ? data : data.data || []) } catch { toast.error("Failed to load") } finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.title || !form.amount) { toast.error("Title and amount required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/expenses", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      if (res.ok) { toast.success("Expense added"); setShowAdd(false); setForm({ title: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0], description: "" }); loadExpenses() } else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Something went wrong") } finally { setSaving(false) }
  }

  const filtered = search ? expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())) : expenses
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0)

  if (loading) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-primary" /></div><div><h1 className="text-2xl font-bold tracking-tight">Expenses</h1><p className="text-muted-foreground">Track business expenses</p></div></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
      </div>
      <div className="flex gap-4 flex-wrap"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search expenses..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div><Card className="flex-1 max-w-xs"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-destructive" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p></div></CardContent></Card></div>
      <Card><CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No expenses found</TableCell></TableRow> : filtered.map(e => (
            <TableRow key={e._id}><TableCell className="font-medium">{e.title}</TableCell><TableCell className="capitalize">{e.category}</TableCell><TableCell className="font-mono">{formatCurrency(e.amount)}</TableCell><TableCell className="text-muted-foreground">{formatDateTime(e.date)}</TableCell></TableRow>
          ))}</TableBody></Table></CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Amount *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} /></div><div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
            <Button className="w-full" onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Expense</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
