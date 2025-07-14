import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const districtId = searchParams.get("district_id")

    if (!districtId) {
      return NextResponse.json({ error: "District ID is required" }, { status: 400 })
    }

    const { data: wards, error } = await supabase
      .from("wards")
      .select("*")
      .eq("district_id", districtId)
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ wards }, { status: 200 })
  } catch (error) {
    console.error("Get wards error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
