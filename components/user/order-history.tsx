"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, Package } from "lucide-react"

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  unit: string
}

interface Order {
  id: number
  package_id: number
  package_name: string
  total_amount: number
  status: string
  created_at: string
  items: OrderItem[]
}

interface OrderHistoryProps {
  personId: number
}

export function OrderHistory({ personId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (personId) {
      fetchOrders()
    }
  }, [personId])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/user/orders?person_id=${personId}`)
      const data = await response.json()
      if (response.ok) {
        setOrders(data.orders)
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "paid":
        return "secondary"
      case "delivered":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ thanh toán"
      case "paid":
        return "Đã thanh toán"
      case "delivered":
        return "Đã giao hàng"
      case "cancelled":
        return "Đã hủy"
      default:
        return status
    }
  }

  const filteredOrders = orders.filter((order) => statusFilter === "all" || order.status === statusFilter)

  const handleViewDetail = async (orderId: number) => {
    try {
      const response = await fetch(`/api/user/orders/${orderId}`)
      const data = await response.json()
      if (response.ok) {
        setSelectedOrder(data.order)
        setShowOrderDetail(true)
      }
    } catch (err) {
      console.error("Error fetching order detail:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lịch sử đơn hàng</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="delivered">Đã giao hàng</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{orders.filter((o) => o.status === "paid").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString("vi-VN")} VNĐ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng ({filteredOrders.length})</CardTitle>
          <CardDescription>Lịch sử các đơn hàng đã đặt</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Gói sản phẩm</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.package_name}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="font-semibold">{order.total_amount.toLocaleString("vi-VN")} VNĐ</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetail(order.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Chưa có đơn hàng nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đơn hàng</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Gói sản phẩm</p>
                  <p className="text-lg font-semibold">{selectedOrder.package_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày đặt hàng</p>
                  <p className="text-lg">{new Date(selectedOrder.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                  <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm">
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tổng tiền</p>
                  <p className="text-lg font-bold text-green-600">
                    {selectedOrder.total_amount.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Chi tiết sản phẩm</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.unit_price.toLocaleString("vi-VN")} VNĐ</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="font-semibold">{item.total_price.toLocaleString("vi-VN")} VNĐ</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedOrder.total_amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
