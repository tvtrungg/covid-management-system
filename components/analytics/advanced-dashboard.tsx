"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts"
import { Download, Filter, RefreshCw, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"
import { analyticsService, type AnalyticsData } from "@/lib/analytics"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdvancedDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [filters, setFilters] = useState({
    provinces: [] as number[],
    statuses: [] as string[],
    locations: [] as number[],
  })
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, filters])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const analyticsData = await analyticsService.getAdvancedAnalytics(dateRange.start, dateRange.end, filters)
      setData(analyticsData)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!data) return

    try {
      setExportLoading(true)
      const buffer = await analyticsService.exportToExcel(data)
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-report-${dateRange.start}-${dateRange.end}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!data) return

    try {
      setExportLoading(true)
      const buffer = await analyticsService.exportToPDF(data)
      const blob = new Blob([buffer], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-report-${dateRange.start}-${dateRange.end}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div>Không thể tải dữ liệu analytics</div>
  }

  const statusColors = {
    F0: "#ef4444",
    F1: "#f97316",
    F2: "#eab308",
    F3: "#22c55e",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-600">Phân tích chi tiết và báo cáo nâng cao</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={exportLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Khoảng thời gian</label>
              <DatePickerWithRange
                value={{
                  from: new Date(dateRange.start),
                  to: new Date(dateRange.end),
                }}
                onChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      start: range.from.toISOString().split("T")[0],
                      end: range.to.toISOString().split("T")[0],
                    })
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F0">F0</SelectItem>
                  <SelectItem value="F1">F1</SelectItem>
                  <SelectItem value="F2">F2</SelectItem>
                  <SelectItem value="F3">F3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tỉnh/Thành phố</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tỉnh/thành phố" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Hà Nội</SelectItem>
                  <SelectItem value="2">Hồ Chí Minh</SelectItem>
                  <SelectItem value="3">Đà Nẵng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Địa điểm điều trị</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn địa điểm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Bệnh viện Bạch Mai</SelectItem>
                  <SelectItem value="2">Bệnh viện Chợ Rẫy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người liên quan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.covidStats.totalPeople}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />+{data.covidStats.newCasesThisWeek} tuần này
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.orderStats.totalOrders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              AOV: {data.orderStats.averageOrderValue.toLocaleString("vi-VN")} VNĐ
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.orderStats.totalRevenue.toLocaleString("vi-VN")} VNĐ
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +15% so với tháng trước
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dư nợ</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.paymentStats.totalDebt.toLocaleString("vi-VN")} VNĐ
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -8% so với tháng trước
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="covid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="covid">Covid Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order Analytics</TabsTrigger>
          <TabsTrigger value="locations">Location Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payment Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="covid" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố trạng thái</CardTitle>
                <CardDescription>Tỷ lệ người theo từng trạng thái Covid-19</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    F0: { label: "F0", color: statusColors.F0 },
                    F1: { label: "F1", color: statusColors.F1 },
                    F2: { label: "F2", color: statusColors.F2 },
                    F3: { label: "F3", color: statusColors.F3 },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.covidStats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.covidStats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.status as keyof typeof statusColors]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Covid Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng Covid-19</CardTitle>
                <CardDescription>Biến động số ca theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    F0: { label: "F0", color: statusColors.F0 },
                    F1: { label: "F1", color: statusColors.F1 },
                    F2: { label: "F2", color: statusColors.F2 },
                    F3: { label: "F3", color: statusColors.F3 },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.covidStats.trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="F0" stackId="1" stroke={statusColors.F0} fill={statusColors.F0} />
                      <Area type="monotone" dataKey="F1" stackId="1" stroke={statusColors.F1} fill={statusColors.F1} />
                      <Area type="monotone" dataKey="F2" stackId="1" stroke={statusColors.F2} fill={statusColors.F2} />
                      <Area type="monotone" dataKey="F3" stackId="1" stroke={statusColors.F3} fill={statusColors.F3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.covidStats.statusDistribution.map((status) => (
                  <div key={status.status} className="text-center p-4 border rounded-lg">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: statusColors[status.status as keyof typeof statusColors] }}
                    >
                      {status.count}
                    </div>
                    <div className="text-sm text-gray-500">{status.status}</div>
                    <Badge variant="outline">{status.percentage.toFixed(1)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng đơn hàng</CardTitle>
                <CardDescription>Số lượng đơn hàng và doanh thu theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    orders: { label: "Đơn hàng", color: "hsl(var(--chart-1))" },
                    revenue: { label: "Doanh thu", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.orderStats.orderTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--color-revenue)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <CardDescription>Top 10 sản phẩm theo doanh thu</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: { label: "Doanh thu", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.orderStats.topProducts} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.orderStats.ordersByStatus.map((status) => (
                  <div key={status.status} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{status.count}</div>
                    <div className="text-sm text-gray-500 capitalize">{status.status}</div>
                    <div className="text-lg font-semibold text-green-600">
                      {status.amount.toLocaleString("vi-VN")} VNĐ
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capacity Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ sử dụng công suất</CardTitle>
                <CardDescription>Mức độ sử dụng của các địa điểm điều trị</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    utilization: { label: "Tỷ lệ sử dụng", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.locationStats.capacityUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="utilization" fill="var(--color-utilization)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Occupancy Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng công suất</CardTitle>
                <CardDescription>Biến động công suất theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total_capacity: { label: "Tổng công suất", color: "hsl(var(--chart-1))" },
                    total_occupied: { label: "Đã sử dụng", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.locationStats.occupancyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="total_capacity" stroke="var(--color-total_capacity)" />
                      <Line type="monotone" dataKey="total_occupied" stroke="var(--color-total_occupied)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng thanh toán</CardTitle>
                <CardDescription>Thanh toán và dư nợ theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    paid: { label: "Đã thanh toán", color: "#22c55e" },
                    debt: { label: "Dư nợ", color: "#ef4444" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.paymentStats.paymentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="paid" stackId="1" stroke="#22c55e" fill="#22c55e" />
                      <Area type="monotone" dataKey="debt" stackId="1" stroke="#ef4444" fill="#ef4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Debtors */}
            <Card>
              <CardHeader>
                <CardTitle>Top nợ nhiều nhất</CardTitle>
                <CardDescription>Danh sách người nợ nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.paymentStats.topDebtors.map((debtor, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{debtor.name}</div>
                        <div className="text-sm text-gray-500">#{index + 1}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{debtor.debt.toLocaleString("vi-VN")} VNĐ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
