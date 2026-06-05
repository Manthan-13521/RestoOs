"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return <div className="space-y-2"><p className="text-sm font-medium">{label}</p><div className="flex gap-1">{[1,2,3,4,5].map(star => <button key={star} onClick={() => onChange(star)} className="transition-transform hover:scale-110"><Star className={cn("h-8 w-8", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} /></button>)}</div></div>
}

export default function FeedbackPage() {
  const params = useParams(); const router = useRouter()
  const { tableId } = params as { tableId: string }
  const [foodRating, setFoodRating] = useState(0); const [serviceRating, setServiceRating] = useState(0); const [experience, setExperience] = useState(0); const [complaint, setComplaint] = useState(""); const [submitting, setSubmitting] = useState(false)
  const orderId = typeof window !== "undefined" ? sessionStorage.getItem("lastOrderId") : null

  async function handleSubmit() {
    if (!foodRating || !serviceRating || !experience) { toast.error("Please rate all categories"); return }
    if (!orderId) { toast.success("Thank you!"); router.push(`/menu/${tableId}`); return }
    setSubmitting(true)
    try { const res = await fetch("/api/feedback", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ orderId, foodRating, serviceRating, experience, complaint: complaint || undefined }) }); if (res.ok) { toast.success("Thank you!"); sessionStorage.removeItem("lastOrderId"); setTimeout(() => router.push(`/menu/${tableId}`), 2000) } else toast.error("Failed") } catch { toast.error("Something went wrong") } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 animate-fade-in">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-6">
        <div className="text-center"><div className="flex justify-center mb-4"><div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Heart className="h-8 w-8 text-primary" /></div></div><h1 className="text-2xl font-bold">How was your meal?</h1><p className="text-muted-foreground mt-2">We value your feedback</p></div>
        <Card><CardContent className="p-6 space-y-6"><StarRating label="Food Quality" value={foodRating} onChange={setFoodRating} /><StarRating label="Service" value={serviceRating} onChange={setServiceRating} /><StarRating label="Overall Experience" value={experience} onChange={setExperience} /><div className="space-y-2"><p className="text-sm font-medium">Anything we could improve?</p><Textarea placeholder="Share your thoughts..." value={complaint} onChange={e => setComplaint(e.target.value)} /></div></CardContent></Card>
        <Button className="w-full h-14 rounded-2xl shadow-xl text-base font-bold" onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : "Submit Feedback"}</Button>
        <Button variant="ghost" className="w-full" onClick={() => router.push(`/menu/${tableId}`)}>Skip</Button>
      </div>
    </div>
  )
}
