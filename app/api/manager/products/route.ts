import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Không thể tải dữ liệu" }, { status: 500 })
    }

    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { error } = await supabase.from("products").insert(data)

    if (error) {
      return NextResponse.json({ error: "Không thể thêm sản phẩm" }, { status: 500 })
    }

    return NextResponse.json({ message: "Thêm sản phẩm thành công" }, { status: 201 })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
