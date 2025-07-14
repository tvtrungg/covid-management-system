import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { person_id, amount } = await request.json()

    if (amount <= 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
    }

    // Get user's account
    const { data: account, error: accountError } = await supabase
      .from("payment_accounts")
      .select("*")
      .eq("person_id", person_id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản thanh toán" }, { status: 404 })
    }

    // Update account balance
    const { error: updateError } = await supabase
      .from("payment_accounts")
      .update({
        balance: account.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", account.account_id)

    if (updateError) {
      return NextResponse.json({ error: "Không thể cập nhật số dư" }, { status: 500 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      from_account_id: "EXTERNAL", // External deposit
      to_account_id: account.account_id,
      amount,
      transaction_type: "deposit",
      description: "Nạp tiền vào tài khoản",
      status: "completed",
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
    }

    return NextResponse.json({ message: "Nạp tiền thành công" }, { status: 200 })
  } catch (error) {
    console.error("Deposit error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
