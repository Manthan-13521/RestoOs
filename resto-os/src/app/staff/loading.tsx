import { Skeleton } from "@/components/ui/skeleton"

export default function StaffLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
