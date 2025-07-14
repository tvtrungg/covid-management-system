"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2, Users, Package, DollarSign, TrendingUp } from "lucide-react"

interface Statistics {
  statusCounts: {
    F0: number
    F1: number
    F2: number
    F3: number
  }
  packageStats: Array<{
    package_name: string
    total_orders: number
    total_amount: number
  }>
  productStats: Array<{
    product_name: string
    total_quantity: number
    total_amount: number
  }>
  paymentStats: {
    total_debt: number
    total_paid: number
    pending_payments: number
  }
}

export function StatisticsView() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("month")

  useEffect(() => {
    fetchStatistics()
  }, [timeRange])

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/manager/statistics?range=${timeRange}`)
      const data = await response.json()
      if (response.ok) {
        setStatistics(data.statistics)
      }
    } catch (err) {
      console.error("Error fetching statistics:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!statistics) {
    return <div>Không thể tải dữ liệu thống kê</div>
  }

  // Prepare chart data
  const statusChartData = [
    { name: "F0", value: statistics.statusCounts.F0, color: "#ef4444" },
    { name: "F1", value: statistics.statusCounts.F1, color: "#f97316" },
    { name: "F2", value: statistics.statusCounts.F2, color: "#eab308" },
    { name: "F3", value: statistics.statusCounts.F3, color: "#22c55e" },
  ]

  const packageChartData = statistics.packageStats.slice(0, 5)
  const productChartData = statistics.productStats.slice(0, 5)

  const totalPeople = Object.values(statistics.statusCounts).reduce((sum, count) => sum + count, 0)
  const totalRevenue = statistics.packageStats.reduce((sum, pkg) => sum + pkg.total_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Thống kê và báo cáo</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 ngày qua</SelectItem>
            <SelectItem value="month">30 ngày qua</SelectItem>
            <SelectItem value="quarter">3 tháng qua</SelectItem>
            <SelectItem value="year">1 năm qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người liên quan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPeople}</div>
            <p className="text-xs text-muted-foreground">
              F0: {statistics.statusCounts.F0} | F1: {statistics.statusCounts.F1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.packageStats.reduce((sum, pkg) => sum + pkg.total_orders, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Đơn hàng trong kỳ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString("vi-VN")} VNĐ</div>
            <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dư nợ</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.paymentStats.total_debt.toLocaleString("vi-VN")} VNĐ
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.paymentStats.pending_payments} đơn chưa thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố trạng thái</CardTitle>
            <CardDescription>Số lượng người theo từng trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                F0: { label: "F0", color: "#ef4444" },
                F1: { label: "F1", color: "#f97316" },
                F2: { label: "F2", color: "#eab308" },
                F3: { label: "F3", color: "#22c55e" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Package Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh số theo gói</CardTitle>
            <CardDescription>Top 5 gói bán chạy nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total_amount: { label: "Doanh thu", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="package_name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_amount" fill="var(--color-total_amount)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm bán chạy</CardTitle>
            <CardDescription>Top 5 sản phẩm theo số lượng</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total_quantity: { label: "Số lượng", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product_name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_quantity" fill="var(--color-total_quantity)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tình hình thanh toán</CardTitle>
            <CardDescription>So sánh đã thanh toán và dư nợ</CardDescription>
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
                <PieChart>
                  <Pie
                    data={[
                      { name: "Đã thanh toán", value: statistics.paymentStats.total_paid, color: "#22c55e" },
                      { name: "Dư nợ", value: statistics.paymentStats.total_debt, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value.toLocaleString("vi-VN")} VNĐ (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} VNĐ`, ""]}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết gói bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.packageStats.slice(0, 10).map((pkg, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">{pkg.package_name}</p>
                    <p className="text-sm text-gray-500">{pkg.total_orders} đơn hàng</p>
                  </div>
                  <p className="font-semibold text-green-600">{pkg.total_amount.toLocaleString("vi-VN")} VNĐ</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiết sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.productStats.slice(0, 10).map((product, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-gray-500">{product.total_quantity} đã bán</p>
                  </div>
                  <p className="font-semibold text-blue-600">{product.total_amount.toLocaleString("vi-VN")} VNĐ</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
