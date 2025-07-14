import { type NextRequest, NextResponse } from "next/server"
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
          max_quantity
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    const formattedPackages = packages.map((pkg) => ({
      ...pkg,
      products: pkg.package_products || [],
    }))

    return NextResponse.json({ packages: formattedPackages }, { status: 200 })
  } catch (error) {
    console.error("Get packages error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Create package
    const { data: packageData, error: packageError } = await supabase
      .from("packages")
      .insert({
        name: data.name,
        limit_per_person: data.limit_per_person,
        time_limit_type: data.time_limit_type,
        time_limit_value: data.time_limit_value,
      })
      .select()
      .single()

    if (packageError) {
      return NextResponse.json({ error: "Không thể tạo gói" }, { status: 500 })
    }

    // Add products to package
    if (data.products && data.products.length > 0) {
      const packageProducts = data.products.map((product: any) => ({
        package_id: packageData.id,
        product_id: product.product_id,
        max_quantity: product.max_quantity,
      }))

      const { error: productsError } = await supabase.from("package_products").insert(packageProducts)

      if (productsError) {
        // Rollback package creation
        await supabase.from("packages").delete().eq("id", packageData.id)
        return NextResponse.json({ error: "Không thể thêm sản phẩm vào gói" }, { status: 500 })
      }
    }

    return NextResponse.json({ package: packageData, message: "Tạo gói thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create package error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
