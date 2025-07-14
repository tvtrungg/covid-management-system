import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personId = searchParams.get("person_id")

    if (!personId) {
      return NextResponse.json({ error: "Person ID is required" }, { status: 400 })
    }

    const { data: account, error } = await supabase
      .from("payment_accounts")
      .select("*")
      .eq("person_id", personId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản thanh toán" }, { status: 404 })
    }

    return NextResponse.json({ account }, { status: 200 })
  } catch (error) {
    console.error("Get payment account error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
