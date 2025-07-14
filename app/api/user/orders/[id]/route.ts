import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        packages(name),
        order_items(
          *,
          products(name, unit)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 })
    }

    const formattedOrder = {
      ...order,
      package_name: order.packages?.name,
      items: order.order_items.map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        unit: item.products?.unit,
      })),
    }

    return NextResponse.json({ order: formattedOrder }, { status: 200 })
  } catch (error) {
    console.error("Get order detail error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
