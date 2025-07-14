import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // In a real app, you would get user ID from JWT token or session
    // For demo purposes, we'll get it from request headers or body
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Không tìm thấy thông tin xác thực" }, { status: 401 })
    }

    // Extract user ID from auth header (in real app, decode JWT)
    const userId = authHeader.replace("Bearer ", "")

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userData.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: "Không thể cập nhật mật khẩu" }, { status: 500 })
    }

    return NextResponse.json({ message: "Đổi mật khẩu thành công" }, { status: 200 })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
