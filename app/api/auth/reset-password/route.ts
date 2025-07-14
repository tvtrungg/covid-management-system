import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validatePasswordStrength } from "@/lib/auth"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: "Mật khẩu không đủ mạnh", details: passwordValidation.errors }, { status: 400 })
    }

    // Verify reset token
    const { data: resetToken, error } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at, used")
      .eq("token", token)
      .single()

    if (error || !resetToken) {
      return NextResponse.json({ error: "Token không hợp lệ" }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "Token đã được sử dụng" }, { status: 400 })
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token đã hết hạn" }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        password_changed_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
        require_password_change: false,
      })
      .eq("id", resetToken.user_id)

    // Mark token as used
    await supabase.from("password_reset_tokens").update({ used: true }).eq("token", token)

    // Invalidate all sessions for this user
    await supabase.from("user_sessions").update({ is_active: false }).eq("user_id", resetToken.user_id)

    // Log audit event
    await supabase.rpc("log_audit_event", {
      p_user_id: resetToken.user_id,
      p_action: "password_reset_completed",
      p_resource_type: "user",
      p_resource_id: resetToken.user_id,
      p_ip_address: request.ip || "unknown",
      p_user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ message: "Mật khẩu đã được đặt lại thành công" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
