import jwt from "jsonwebtoken"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key"

export interface JWTPayload {
  userId: number
  username: string
  role: string
  sessionId: string
}

export interface RefreshTokenPayload {
  userId: number
  sessionId: string
}

// Generate access token (15 minutes)
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" })
}

// Generate refresh token (7 days)
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" })
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload
  } catch (error) {
    return null
  }
}

// Create session in database
export async function createSession(userId: number, userAgent?: string, ipAddress?: string) {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase.from("user_sessions").insert({
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent,
    ip_address: ipAddress,
    is_active: true,
  })

  if (error) {
    throw new Error("Failed to create session")
  }

  return sessionId
}

// Validate session
export async function validateSession(sessionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("expires_at, is_active")
    .eq("id", sessionId)
    .single()

  if (error || !data || !data.is_active) {
    return false
  }

  return new Date(data.expires_at) > new Date()
}

// Invalidate session
export async function invalidateSession(sessionId: string) {
  await supabase.from("user_sessions").update({ is_active: false }).eq("id", sessionId)
}

// Generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Mật khẩu phải có ít nhất 8 ký tự")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ hoa")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ thường")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 số")
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Check account lockout
export async function checkAccountLockout(username: string): Promise<{
  isLocked: boolean
  remainingTime?: number
}> {
  const { data } = await supabase
    .from("users")
    .select("failed_login_attempts, locked_until")
    .eq("username", username)
    .single()

  if (!data) {
    return { isLocked: false }
  }

  if (data.locked_until && new Date(data.locked_until) > new Date()) {
    const remainingTime = new Date(data.locked_until).getTime() - Date.now()
    return { isLocked: true, remainingTime }
  }

  return { isLocked: false }
}

// Record failed login attempt
export async function recordFailedLogin(username: string) {
  const { data } = await supabase.from("users").select("failed_login_attempts").eq("username", username).single()

  if (data) {
    const attempts = (data.failed_login_attempts || 0) + 1
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null // Lock for 30 minutes

    await supabase
      .from("users")
      .update({
        failed_login_attempts: attempts,
        locked_until: lockUntil?.toISOString(),
      })
      .eq("username", username)
  }
}

// Reset failed login attempts
export async function resetFailedLogins(username: string) {
  await supabase
    .from("users")
    .update({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .eq("username", username)
}
