import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { Table } from "@/lib/db/models/Table"
import { MenuItem } from "@/lib/db/models/MenuItem"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"

async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const tableId = searchParams.get("tableId")

  if (!tableId) {
    return NextResponse.json({ error: "tableId is required" }, { status: 400 })
  }

  await connectDB()

  const table = await Table.findById(tableId).lean()
  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 })
  }

  const items = await MenuItem.find({
    restaurantId: table.restaurantId,
    organizationId: table.organizationId,
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 }).lean()

  return NextResponse.json(items)
}

export const GET = withPublicRateLimit(handler, "public")
