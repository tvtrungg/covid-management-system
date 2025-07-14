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

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        packages(name),
        order_items(
          *,
          products(name, unit)
        )
      `)
      .eq("person_id", personId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    const formattedOrders = orders.map((order) => ({
      ...order,
      package_name: order.packages?.name,
      items: order.order_items.map((item: any) => ({
        ...item,
        product_name: item.products?.name,
        unit: item.products?.unit,
      })),
    }))

    return NextResponse.json({ orders: formattedOrders }, { status: 200 })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { person_id, package_id, total_amount, items } = await request.json()

    // Check package purchase limits
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("created_at")
      .eq("person_id", person_id)
      .eq("package_id", package_id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    const { data: packageInfo } = await supabase
      .from("packages")
      .select("limit_per_person, time_limit_type, time_limit_value")
      .eq("id", package_id)
      .single()

    if (packageInfo && recentOrders && recentOrders.length >= packageInfo.limit_per_person) {
      return NextResponse.json({ error: "Đã vượt quá giới hạn mua gói này" }, { status: 400 })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        person_id,
        package_id,
        total_amount,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: "Không thể tạo đơn hàng" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      // Rollback order creation
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Không thể tạo chi tiết đơn hàng" }, { status: 500 })
    }

    return NextResponse.json({ order, message: "Đặt hàng thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
