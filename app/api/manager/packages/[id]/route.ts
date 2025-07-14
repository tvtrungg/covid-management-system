import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: packageData, error } = await supabase
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
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    // Format the response
    const formattedPackage = {
      ...packageData,
      products: packageData.package_products.map((pp: any) => ({
        product_id: pp.product_id,
        product_name: pp.products.name,
        max_quantity: pp.max_quantity,
        price: pp.products.price,
        unit: pp.products.unit,
        images: pp.products.images,
      })),
    }

    return NextResponse.json({ package: formattedPackage }, { status: 200 })
  } catch (error) {
    console.error("Get package detail error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    // Update package
    const { error: packageError } = await supabase
      .from("packages")
      .update({
        name: data.name,
        limit_per_person: data.limit_per_person,
        time_limit_type: data.time_limit_type,
        time_limit_value: data.time_limit_value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (packageError) {
      return NextResponse.json({ error: "Không thể cập nhật gói" }, { status: 500 })
    }

    // Delete existing package products
    await supabase.from("package_products").delete().eq("package_id", id)

    // Add new products to package
    if (data.products && data.products.length > 0) {
      const packageProducts = data.products.map((product: any) => ({
        package_id: Number.parseInt(id),
        product_id: product.product_id,
        max_quantity: product.max_quantity,
      }))

      const { error: productsError } = await supabase.from("package_products").insert(packageProducts)

      if (productsError) {
        return NextResponse.json({ error: "Không thể cập nhật sản phẩm trong gói" }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "Cập nhật gói thành công" }, { status: 200 })
  } catch (error) {
    console.error("Update package error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if package is used in any orders
    const { data: orders } = await supabase.from("orders").select("id").eq("package_id", id).limit(1)

    if (orders && orders.length > 0) {
      return NextResponse.json({ error: "Không thể xóa gói đã có đơn hàng" }, { status: 400 })
    }

    // Delete package products first
    await supabase.from("package_products").delete().eq("package_id", id)

    // Delete package
    const { error } = await supabase.from("packages").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể xóa gói" }, { status: 500 })
    }

    return NextResponse.json({ message: "Xóa gói thành công" }, { status: 200 })
  } catch (error) {
    console.error("Delete package error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
