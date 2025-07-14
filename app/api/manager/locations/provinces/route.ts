import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: provinces, error } = await supabase.from("provinces").select("*").order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ provinces }, { status: 200 })
  } catch (error) {
    console.error("Get provinces error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
