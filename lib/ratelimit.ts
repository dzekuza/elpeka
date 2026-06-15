import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// NOTE: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// Add them in Vercel dashboard → Settings → Environment Variables.
// Get values from console.upstash.com after creating a Redis database.

function createLimiter() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null
  }
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  // 30 requests per 60 seconds per user — generous for legitimate use,
  // tight enough to stop enumeration attacks
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
  })
}

const limiter = createLimiter()

/**
 * Check rate limit for the authenticated user making this request.
 * Returns a 429 NextResponse if the limit is exceeded, otherwise null.
 * Falls back to allowing the request if Upstash env vars are not configured.
 */
export async function checkRateLimit(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  if (!limiter) return null

  const { success, limit, remaining, reset } = await limiter.limit(
    `storage:${userId}`
  )

  if (!success) {
    return NextResponse.json(
      { error: 'Per daug užklausų. Bandykite vėliau.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}
