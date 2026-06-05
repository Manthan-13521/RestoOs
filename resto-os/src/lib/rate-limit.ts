const store = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 60_000)
}

export function rateLimit(options: { max: number; windowMs: number }) {
  return (key: string): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now()
    let entry = store.get(key)

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + options.windowMs }
      store.set(key, entry)
      return { allowed: true, remaining: options.max - 1, resetAt: entry.resetAt }
    }

    if (entry.count >= options.max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
  }
}

export function createRateLimiter(options: { max: number; windowMs: number }) {
  const check = rateLimit(options)

  return {
    check: (key: string) => {
      const result = check(key)
      if (!result.allowed) {
        const err = new Error("RATE_LIMIT_EXCEEDED") as Error & { statusCode: number; code: string }
        err.statusCode = 429
        err.code = "RATE_LIMIT_EXCEEDED"
        throw err
      }
      return result
    },
    getRemaining: (key: string) => check(key).remaining,
  }
}
