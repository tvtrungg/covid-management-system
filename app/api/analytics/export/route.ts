import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { analyticsService } from "@/lib/analytics"

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { format, startDate, endDate, filters } = await request.json()

      const data = await analyticsService.getAdvancedAnalytics(startDate, endDate, filters)

      if (format === "excel") {
        const buffer = await analyticsService.exportToExcel(data)

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="analytics-report-${startDate}-${endDate}.xlsx"`,
          },
        })
      } else if (format === "pdf") {
        const buffer = await analyticsService.exportToPDF(data)

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="analytics-report-${startDate}-${endDate}.pdf"`,
          },
        })
      }

      return NextResponse.json({ error: "Định dạng không hỗ trợ" }, { status: 400 })
    } catch (error) {
      console.error("Error exporting analytics:", error)
      return NextResponse.json({ error: "Lỗi khi xuất dữ liệu" }, { status: 500 })
    }
  })
}
