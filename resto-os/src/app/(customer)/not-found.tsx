import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Button asChild><Link href="/">Back to Menu</Link></Button>
    </div>
  )
}
