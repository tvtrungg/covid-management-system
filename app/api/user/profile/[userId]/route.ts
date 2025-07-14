import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    const { data: person, error } = await supabase
      .from("covid_people")
      .select(`
        *,
        provinces(name),
        districts(name),
        wards(name),
        treatment_locations(name)
      `)
      .eq("user_id", userId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Không tìm thấy thông tin người dùng" }, { status: 404 })
    }

    const formattedPerson = {
      ...person,
      province_name: person.provinces?.name,
      district_name: person.districts?.name,
      ward_name: person.wards?.name,
      treatment_location_name: person.treatment_locations?.name,
    }

    return NextResponse.json({ person: formattedPerson }, { status: 200 })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
