import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { is_active } = await request.json()
    const { id } = params

    const { error } = await supabase
      .from("users")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật trạng thái tài khoản" }, { status: 500 })
    }

    return NextResponse.json({ message: "Cập nhật trạng thái thành công" }, { status: 200 })
  } catch (error) {
    console.error("Toggle account status error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
