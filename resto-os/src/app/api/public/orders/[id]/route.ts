import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { Order } from "@/lib/db/models/Order"
import { Table } from "@/lib/db/models/Table"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"

async function handler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const order = await Order.findOne({
    _id: id,
    restaurantId: table.restaurantId,
  }).populate("tableId", "number name").lean()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  return NextResponse.json(order)
}

export const GET = withPublicRateLimit(handler, "public")
