import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (identifier: string) => string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Clean up old entries
    await supabase.from("rate_limits").delete().lt("created_at", new Date(windowStart).toISOString())

    // Get current count for this identifier
    const { data: requests, error } = await supabase
      .from("rate_limits")
      .select("id")
      .eq("identifier", key)
      .gte("created_at", new Date(windowStart).toISOString())

    if (error) {
      // If we can't check rate limit, allow the request
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }

    const currentCount = requests?.length || 0

    if (currentCount >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + this.config.windowMs,
      }
    }

    // Record this request
    await supabase.from("rate_limits").insert({
      identifier: key,
      created_at: new Date().toISOString(),
    })

    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount - 1,
      resetTime: now + this.config.windowMs,
    }
  }
}

// Predefined rate limiters
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 5 login attempts per 15 minutes
  keyGenerator: (ip: string) => `login:${ip}`,
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  keyGenerator: (identifier: string) => `api:${identifier}`,
})

export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
  keyGenerator: (email: string) => `reset:${email}`,
})
