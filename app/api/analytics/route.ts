import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { analyticsService } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(request.url)
      const startDate =
        searchParams.get("start_date") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const endDate = searchParams.get("end_date") || new Date().toISOString().split("T")[0]

      const filters = {
        provinces: searchParams.get("provinces")?.split(",").map(Number) || [],
        statuses: searchParams.get("statuses")?.split(",") || [],
        locations: searchParams.get("locations")?.split(",").map(Number) || [],
      }

      const data = await analyticsService.getAdvancedAnalytics(startDate, endDate, filters)

      return NextResponse.json({ data }, { status: 200 })
    } catch (error) {
      console.error("Analytics API error:", error)
      return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
    }
  })
}
