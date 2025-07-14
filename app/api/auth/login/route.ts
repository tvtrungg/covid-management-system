import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import {
  generateAccessToken,
  generateRefreshToken,
  createSession,
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/auth"
import { loginRateLimiter } from "@/lib/rate-limiter"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    // Rate limiting
    const rateLimitResult = await loginRateLimiter.checkLimit(clientIP)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau." }, { status: 429 })
    }

    // Check account lockout
    const lockoutStatus = await checkAccountLockout(username)
    if (lockoutStatus.isLocked) {
      const remainingMinutes = Math.ceil((lockoutStatus.remainingTime || 0) / (1000 * 60))
      return NextResponse.json({ error: `Tài khoản bị khóa. Thử lại sau ${remainingMinutes} phút.` }, { status: 423 })
    }

    // Get user
    const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !user) {
      await recordFailedLogin(username)
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Tài khoản đã bị khóa" }, { status: 401 })
    }

    // Check if first login
    if (user.first_login) {
      return NextResponse.json({ firstLogin: true }, { status: 200 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      await recordFailedLogin(username)
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // Reset failed login attempts
    await resetFailedLogins(username)

    // Create session
    const sessionId = await createSession(user.id, userAgent, clientIP)

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId,
    })

    // Update last login
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_user_id: user.id,
      p_action: "login",
      p_resource_type: "user",
      p_resource_id: user.id,
      p_ip_address: clientIP,
      p_user_agent: userAgent,
    })

    const { password_hash, ...userInfo } = user

    const response = NextResponse.json(
      {
        user: userInfo,
        accessToken,
        requirePasswordChange: user.require_password_change,
      },
      { status: 200 },
    )

    // Set refresh token as httpOnly cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
