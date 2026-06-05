import { Skeleton } from "@/components/ui/skeleton"

export default function KitchenLoading() {
  return (
    <div className="flex gap-4 p-6 h-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-1 space-y-4">
          <Skeleton className="h-10 w-32" />
          {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-48 rounded-xl" />)}
        </div>
      ))}
    </div>
  )
}
