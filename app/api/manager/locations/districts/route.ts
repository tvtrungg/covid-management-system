import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provinceId = searchParams.get("province_id")

    if (!provinceId) {
      return NextResponse.json({ error: "Province ID is required" }, { status: 400 })
    }

    const { data: districts, error } = await supabase
      .from("districts")
      .select("*")
      .eq("province_id", provinceId)
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ districts }, { status: 200 })
  } catch (error) {
    console.error("Get districts error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
