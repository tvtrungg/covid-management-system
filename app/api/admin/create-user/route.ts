import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json()

    // Check if username already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("username", username).single()

    if (existingUser) {
      return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 400 })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const { error } = await supabase.from("users").insert({
      username,
      password_hash: hashedPassword,
      role,
      first_login: false,
      is_active: true,
    })

    if (error) {
      return NextResponse.json({ error: "Không thể tạo tài khoản" }, { status: 500 })
    }

    return NextResponse.json({ message: "Tạo tài khoản thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
