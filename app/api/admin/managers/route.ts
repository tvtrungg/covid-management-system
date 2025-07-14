import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: managers, error } = await supabase
      .from("users")
      .select("id, username, role, is_active, created_at")
      .in("role", ["admin", "manager"])
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ managers }, { status: 200 })
  } catch (error) {
    console.error("Get managers error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
