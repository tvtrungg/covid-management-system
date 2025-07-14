import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: people, error } = await supabase
      .from("covid_people")
      .select(`
        *,
        provinces(name),
        districts(name),
        wards(name),
        treatment_locations(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    const formattedPeople = people.map((person) => ({
      ...person,
      province_name: person.provinces?.name,
      district_name: person.districts?.name,
      ward_name: person.wards?.name,
      treatment_location_name: person.treatment_locations?.name,
    }))

    return NextResponse.json({ people: formattedPeople }, { status: 200 })
  } catch (error) {
    console.error("Get covid people error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Check if ID number already exists
    const { data: existingPerson } = await supabase
      .from("covid_people")
      .select("id")
      .eq("id_number", data.id_number)
      .single()

    if (existingPerson) {
      return NextResponse.json({ error: "Số CMND/CCCD đã tồn tại" }, { status: 400 })
    }

    // Create covid person
    const { data: person, error } = await supabase.from("covid_people").insert(data).select().single()

    if (error) {
      return NextResponse.json({ error: "Không thể thêm người liên quan" }, { status: 500 })
    }

    // Update treatment location count if assigned
    if (data.treatment_location_id) {
      await supabase.rpc("increment_location_count", { location_id: data.treatment_location_id })
    }

    // Create payment account for the person
    const accountId = `USER_${person.id.toString().padStart(3, "0")}`
    await supabase.from("payment_accounts").insert({
      account_id: accountId,
      balance: 0,
      is_main_account: false,
      person_id: person.id,
    })

    return NextResponse.json({ person, message: "Thêm người liên quan thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create covid person error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
