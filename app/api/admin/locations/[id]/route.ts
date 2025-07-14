import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    const { error } = await supabase
      .from("treatment_locations")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật địa điểm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Cập nhật địa điểm thành công" }, { status: 200 })
  } catch (error) {
    console.error("Update location error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if location is being used
    const { data: people } = await supabase.from("covid_people").select("id").eq("treatment_location_id", id).limit(1)

    if (people && people.length > 0) {
      return NextResponse.json({ error: "Không thể xóa địa điểm đang được sử dụng" }, { status: 400 })
    }

    const { error } = await supabase.from("treatment_locations").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể xóa địa điểm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Xóa địa điểm thành công" }, { status: 200 })
  } catch (error) {
    console.error("Delete location error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
