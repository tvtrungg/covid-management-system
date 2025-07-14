import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "month"

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get status counts
    const { data: statusData } = await supabase
      .from("covid_people")
      .select("status")
      .gte("created_at", startDate.toISOString())

    const statusCounts = {
      F0: 0,
      F1: 0,
      F2: 0,
      F3: 0,
    }

    statusData?.forEach((person) => {
      if (person.status in statusCounts) {
        statusCounts[person.status as keyof typeof statusCounts]++
      }
    })

    // Get package statistics
    const { data: packageStats } = await supabase
      .from("orders")
      .select(`
        package_id,
        total_amount,
        packages(name)
      `)
      .gte("created_at", startDate.toISOString())

    const packageStatsMap = new Map()
    packageStats?.forEach((order) => {
      const packageName = order.packages?.name || "Unknown"
      if (!packageStatsMap.has(packageName)) {
        packageStatsMap.set(packageName, {
          package_name: packageName,
          total_orders: 0,
          total_amount: 0,
        })
      }
      const stats = packageStatsMap.get(packageName)
      stats.total_orders++
      stats.total_amount += order.total_amount
    })

    // Get product statistics
    const { data: productStats } = await supabase
      .from("order_items")
      .select(`
        product_id,
        quantity,
        total_price,
        products(name),
        orders!inner(created_at)
      `)
      .gte("orders.created_at", startDate.toISOString())

    const productStatsMap = new Map()
    productStats?.forEach((item) => {
      const productName = item.products?.name || "Unknown"
      if (!productStatsMap.has(productName)) {
        productStatsMap.set(productName, {
          product_name: productName,
          total_quantity: 0,
          total_amount: 0,
        })
      }
      const stats = productStatsMap.get(productName)
      stats.total_quantity += item.quantity
      stats.total_amount += item.total_price
    })

    // Get payment statistics
    const { data: paymentData } = await supabase
      .from("orders")
      .select("total_amount, status")
      .gte("created_at", startDate.toISOString())

    const paymentStats = {
      total_debt: 0,
      total_paid: 0,
      pending_payments: 0,
    }

    paymentData?.forEach((order) => {
      if (order.status === "pending") {
        paymentStats.total_debt += order.total_amount
        paymentStats.pending_payments++
      } else if (order.status === "paid") {
        paymentStats.total_paid += order.total_amount
      }
    })

    const statistics = {
      statusCounts,
      packageStats: Array.from(packageStatsMap.values()),
      productStats: Array.from(productStatsMap.values()),
      paymentStats,
    }

    return NextResponse.json({ statistics }, { status: 200 })
  } catch (error) {
    console.error("Get statistics error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
