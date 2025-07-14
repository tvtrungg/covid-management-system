import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken, invalidateSession } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const payload = verifyAccessToken(token)

      if (payload) {
        // Invalidate session
        await invalidateSession(payload.sessionId)

        // Log audit event
        await supabase.rpc("log_audit_event", {
          p_user_id: payload.userId,
          p_action: "logout",
          p_resource_type: "user",
          p_resource_id: payload.userId,
          p_ip_address: request.ip || "unknown",
          p_user_agent: request.headers.get("user-agent") || "unknown",
        })
      }
    }

    const response = NextResponse.json({ message: "Đăng xuất thành công" }, { status: 200 })

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
