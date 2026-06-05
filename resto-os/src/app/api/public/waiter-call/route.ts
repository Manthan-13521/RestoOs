import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import { Table } from "@/lib/db/models/Table"
import { Notification } from "@/lib/db/models/Notification"
import { User } from "@/lib/db/models/User"
import { withPublicRateLimit } from "@/lib/rate-limit-wrapper"

async function handler(req: Request) {
  const body = await req.json()
  const { tableNumber, tableId, tableName, message } = body

  await connectDB()

  let table
  if (tableId && typeof tableId === "string") {
    table = await Table.findById(tableId).lean()
  } else if (tableNumber && typeof tableNumber === "string") {
    const parsedNumber = parseInt(tableNumber, 10)
    if (isNaN(parsedNumber)) {
      return NextResponse.json({ error: "Invalid table number" }, { status: 400 })
    }
    table = await Table.findOne({ number: parsedNumber }).lean()
  } else {
    return NextResponse.json({ error: "tableId or tableNumber is required" }, { status: 400 })
  }

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 })
  }

  const waiters = await User.find({
    restaurantId: table.restaurantId,
    organizationId: table.organizationId,
    role: "waiter",
    isActive: true,
  }).select("_id").lean()

  await Notification.create({
    organizationId: table.organizationId,
    restaurantId: table.restaurantId,
    type: "waiter_call",
    title: `Waiter call — Table ${table.name || table.number}`,
    message: message || `Customer needs assistance at Table ${table.number} (${table.name})`,
    recipients: waiters.map(w => w._id),
    priority: "high",
  })

  return NextResponse.json({ success: true }, { status: 201 })
}

export const POST = withPublicRateLimit(handler, "public")
