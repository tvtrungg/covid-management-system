import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { username, newPassword } = await request.json()

    // Hash the new password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update user password and set first_login to false
    const { error } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        first_login: false,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)

    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật mật khẩu" }, { status: 500 })
    }

    return NextResponse.json({ message: "Đặt mật khẩu thành công" }, { status: 200 })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
