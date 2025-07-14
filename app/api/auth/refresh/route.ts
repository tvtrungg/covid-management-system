import { type NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, generateAccessToken, validateSession } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token không tồn tại" }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: "Refresh token không hợp lệ" }, { status: 401 })
    }

    // Validate session
    const isValidSession = await validateSession(payload.sessionId)
    if (!isValidSession) {
      return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn" }, { status: 401 })
    }

    // Get user info
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, role, is_active")
      .eq("id", payload.userId)
      .single()

    if (error || !user || !user.is_active) {
      return NextResponse.json({ error: "Người dùng không hợp lệ" }, { status: 401 })
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId: payload.sessionId,
    })

    return NextResponse.json({ accessToken }, { status: 200 })
  } catch (error) {
    console.error("Refresh token error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
