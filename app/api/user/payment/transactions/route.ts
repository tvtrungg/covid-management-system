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

    // Get user's account ID
    const { data: account } = await supabase
      .from("payment_accounts")
      .select("account_id")
      .eq("person_id", personId)
      .single()

    if (!account) {
      return NextResponse.json({ transactions: [] }, { status: 200 })
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .or(`from_account_id.eq.${account.account_id},to_account_id.eq.${account.account_id}`)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ transactions }, { status: 200 })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
