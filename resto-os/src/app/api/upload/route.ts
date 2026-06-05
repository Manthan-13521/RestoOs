import { withAuth, apiSuccess, apiError, requireRole } from "@/lib/db/helpers"
import { put } from "@vercel/blob"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export const POST = withAuth(async (req, context, session) => {
  requireRole(session, "manager")
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return apiError("No file provided", 400)
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError("Invalid file type. Allowed: JPEG, PNG, WebP", 400)
  }

  if (file.size > MAX_SIZE) {
    return apiError("File too large. Maximum 5MB", 400)
  }

  const ext = file.name.split(".").pop() || "jpg"
  const filename = `${session.user.restaurantId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  })

  return apiSuccess({ url: blob.url })
})
