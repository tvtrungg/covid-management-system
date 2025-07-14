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

    if (account.balance < amount) {
      return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 })
    }

    // Get main account
    const { data: mainAccount } = await supabase
      .from("payment_accounts")
      .select("*")
      .eq("is_main_account", true)
      .single()

    if (!mainAccount) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản chính" }, { status: 404 })
    }

    // Update user account balance
    const { error: updateUserError } = await supabase
      .from("payment_accounts")
      .update({
        balance: account.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", account.account_id)

    if (updateUserError) {
      return NextResponse.json({ error: "Không thể cập nhật số dư" }, { status: 500 })
    }

    // Update main account balance
    const { error: updateMainError } = await supabase
      .from("payment_accounts")
      .update({
        balance: mainAccount.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", mainAccount.account_id)

    if (updateMainError) {
      // Rollback user account update
      await supabase
        .from("payment_accounts")
        .update({
          balance: account.balance,
          updated_at: new Date().toISOString(),
        })
        .eq("account_id", account.account_id)

      return NextResponse.json({ error: "Không thể thực hiện thanh toán" }, { status: 500 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      from_account_id: account.account_id,
      to_account_id: mainAccount.account_id,
      amount,
      transaction_type: "payment",
      description: "Thanh toán chi phí đơn hàng",
      status: "completed",
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
    }

    // Update pending orders to paid status
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("person_id", person_id)
      .eq("status", "pending")

    if (orderUpdateError) {
      console.error("Order update error:", orderUpdateError)
    }

    return NextResponse.json({ message: "Thanh toán thành công" }, { status: 200 })
  } catch (error) {
    console.error("Payment error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
