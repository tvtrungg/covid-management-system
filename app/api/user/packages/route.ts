import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: packages, error } = await supabase
      .from("packages")
      .select(`
        *,
        package_products(
          product_id,
          max_quantity,
          products(
            id,
            name,
            price,
            unit,
            images
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    const formattedPackages = packages.map((pkg) => ({
      ...pkg,
      products: pkg.package_products.map((pp: any) => ({
        product_id: pp.product_id,
        product_name: pp.products.name,
        max_quantity: pp.max_quantity,
        price: pp.products.price,
        unit: pp.products.unit,
        images: pp.products.images,
      })),
    }))

    return NextResponse.json({ packages: formattedPackages }, { status: 200 })
  } catch (error) {
    console.error("Get packages error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
