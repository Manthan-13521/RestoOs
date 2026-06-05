import { Table } from "@/lib/db/models/Table"
import { withAuth, apiSuccess, apiError, requireRole } from "@/lib/db/helpers"
import { tableSchema, validateBody } from "@/lib/validations"
import { NextResponse } from "next/server"

export const GET = withAuth(async (req, _context, session) => {
  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section")

  const filter: Record<string, any> = {
    restaurantId: session.user.restaurantId,
    organizationId: session.user.organizationId,
    isActive: true,
  }

  if (section) filter.section = section

  const tables = await Table.find(filter).sort({ number: 1 }).limit(100).lean()
  return apiSuccess(tables)
})

export const POST = withAuth(async (req, _context, session) => {
  requireRole(session, "manager")
  const body = await req.json()
  const result = validateBody(tableSchema, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.message, details: result.error.details }, { status: 400 })
  }
  const { number, name, capacity, section } = result.data

  const existing = await Table.findOne({
    restaurantId: session.user.restaurantId,
    number,
  })
  if (existing) return apiError(`Table ${number} already exists`, 409)

  const table = await Table.create({
    number,
    name: name.trim(),
    capacity,
    section: section || "Main",
    organizationId: session.user.organizationId,
    restaurantId: session.user.restaurantId,
  })

  return apiSuccess(table, 201)
})
