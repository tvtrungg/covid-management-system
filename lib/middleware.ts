import { type NextRequest, NextResponse } from "next/server"
import { verifyAccessToken, validateSession } from "./auth"
import { hasPermission, type Permission } from "./permissions"
import { apiRateLimiter } from "./rate-limiter"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number
    username: string
    role: string
    sessionId: string
  }
}

// Authentication middleware
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)

  if (!payload) {
    return NextResponse.json({ error: "Token đã hết hạn" }, { status: 401 })
  }

  // Validate session
  const isValidSession = await validateSession(payload.sessionId)
  if (!isValidSession) {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 })
  }

  // Add user info to request
  const authenticatedRequest = request as AuthenticatedRequest
  authenticatedRequest.user = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    sessionId: payload.sessionId,
  }

  return handler(authenticatedRequest)
}

// Permission middleware
export function withPermission(permission: Permission) {
  return async (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    if (!request.user) {
      return NextResponse.json({ error: "Chưa xác thực" }, { status: 401 })
    }

    if (!hasPermission(request.user.role, permission)) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    return handler(request)
  }
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  const identifier = request.ip || "unknown"
  const result = await apiRateLimiter.checkLimit(identifier)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Quá nhiều yêu cầu",
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetTime.toString(),
        },
      },
    )
  }

  const response = await handler(request)

  // Add rate limit headers
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString())

  return response
}

// Combined middleware
export function withAuthAndPermission(permission: Permission) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    return withAuth(request, async (authReq) => {
      return withPermission(permission)(authReq, handler)
    })
  }
}
