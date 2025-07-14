import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: locations, error } = await supabase
      .from("treatment_locations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ locations }, { status: 200 })
  } catch (error) {
    console.error("Get locations error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, capacity } = await request.json()

    const { error } = await supabase.from("treatment_locations").insert({
      name,
      capacity,
      current_count: 0,
    })

    if (error) {
      return NextResponse.json({ error: "Không thể thêm địa điểm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Thêm địa điểm thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create location error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
