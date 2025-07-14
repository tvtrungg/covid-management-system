import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { passwordResetRateLimiter } from "@/lib/rate-limiter"
import crypto from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    // Rate limiting
    const rateLimitResult = await passwordResetRateLimiter.checkLimit(username)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ." },
        { status: 429 },
      )
    }

    // Check if user exists
    const { data: user, error } = await supabase.from("users").select("id, username").eq("username", username).single()

    // Always return success to prevent username enumeration
    if (error || !user) {
      return NextResponse.json(
        { message: "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi." },
        { status: 200 },
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
    })

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, integrate with email service)
    console.log(`Password reset token for ${username}: ${resetToken}`)

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_user_id: user.id,
      p_action: "password_reset_requested",
      p_resource_type: "user",
      p_resource_id: user.id,
      p_ip_address: request.ip || "unknown",
      p_user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ message: "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi." }, { status: 200 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
