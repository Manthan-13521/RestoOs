import { Skeleton } from "@/components/ui/skeleton"

export default function CustomerLoading() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  )
}
