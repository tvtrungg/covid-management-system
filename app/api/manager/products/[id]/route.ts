import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { id } = params

    const { error } = await supabase
      .from("products")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể cập nhật sản phẩm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Cập nhật sản phẩm thành công" }, { status: 200 })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if product is used in any packages
    const { data: packageProducts } = await supabase.from("package_products").select("id").eq("product_id", id).limit(1)

    if (packageProducts && packageProducts.length > 0) {
      return NextResponse.json({ error: "Không thể xóa sản phẩm đang được sử dụng trong gói" }, { status: 400 })
    }

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Không thể xóa sản phẩm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Xóa sản phẩm thành công" }, { status: 200 })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
