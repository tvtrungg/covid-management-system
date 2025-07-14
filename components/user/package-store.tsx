"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, ShoppingCart, Package, Loader2, Plus, Minus } from "lucide-react"

interface Product {
  product_id: number
  product_name: string
  max_quantity: number
  price: number
  unit: string
  images: string[]
}

interface PackageItem {
  id: number
  name: string
  limit_per_person: number
  time_limit_type: string
  time_limit_value: number
  products: Product[]
  created_at: string
}

interface CartItem {
  package_id: number
  package_name: string
  products: Array<{
    product_id: number
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  total_amount: number
}

interface PackageStoreProps {
  personId: number
}

export function PackageStore({ personId }: PackageStoreProps) {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null)
  const [showPackageDetail, setShowPackageDetail] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderData, setOrderData] = useState<{ [key: number]: number }>({})
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/user/packages")
      const data = await response.json()
      if (response.ok) {
        setPackages(data.packages)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const filteredPackages = packages.filter((pkg) => pkg.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const formatTimeLimit = (type: string, value: number) => {
    const typeMap = {
      day: "ngày",
      week: "tuần",
      month: "tháng",
    }
    return `${value} ${typeMap[type as keyof typeof typeMap] || type}`
  }

  const calculatePackagePrice = (products: Product[]) => {
    return products.reduce((total, product) => total + product.price * product.max_quantity, 0)
  }

  const handleViewDetail = (pkg: PackageItem) => {
    setSelectedPackage(pkg)
    setShowPackageDetail(true)
  }

  const handleOrderPackage = (pkg: PackageItem) => {
    setSelectedPackage(pkg)
    // Initialize order data with default quantities
    const initialOrderData: { [key: number]: number } = {}
    pkg.products.forEach((product) => {
      initialOrderData[product.product_id] = 1
    })
    setOrderData(initialOrderData)
    setShowOrderForm(true)
  }

  const updateProductQuantity = (productId: number, quantity: number, maxQuantity: number) => {
    if (quantity < 1) quantity = 1
    if (quantity > maxQuantity) quantity = maxQuantity

    setOrderData((prev) => ({
      ...prev,
      [productId]: quantity,
    }))
  }

  const calculateOrderTotal = () => {
    if (!selectedPackage) return 0

    return selectedPackage.products.reduce((total, product) => {
      const quantity = orderData[product.product_id] || 1
      return total + product.price * quantity
    }, 0)
  }

  const handleSubmitOrder = async () => {
    if (!selectedPackage || !personId) return

    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const orderItems = selectedPackage.products.map((product) => ({
        product_id: product.product_id,
        quantity: orderData[product.product_id] || 1,
        unit_price: product.price,
        total_price: product.price * (orderData[product.product_id] || 1),
      }))

      const response = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          package_id: selectedPackage.id,
          total_amount: calculateOrderTotal(),
          items: orderItems,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Đặt hàng thành công!")
        setShowOrderForm(false)
        setOrderData({})
        setTimeout(() => setMessage(""), 3000)
      } else {
        setError(data.error || "Đặt hàng thất bại")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setSubmitting(false)
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
        <h2 className="text-2xl font-bold">Cửa hàng gói nhu yếu phẩm</h2>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm gói</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm gói nhu yếu phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{pkg.name}</span>
                <Badge variant="outline">{pkg.products.length} sản phẩm</Badge>
              </CardTitle>
              <CardDescription>
                Giới hạn: {pkg.limit_per_person} gói/{formatTimeLimit(pkg.time_limit_type, pkg.time_limit_value)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Giá từ:</span>
                  <span className="text-lg font-bold text-green-600">
                    {calculatePackagePrice(pkg.products).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Sản phẩm trong gói:</p>
                  <div className="space-y-1">
                    {pkg.products.slice(0, 3).map((product) => (
                      <div key={product.product_id} className="flex justify-between text-sm">
                        <span>{product.product_name}</span>
                        <span className="text-gray-500">x{product.max_quantity}</span>
                      </div>
                    ))}
                    {pkg.products.length > 3 && (
                      <p className="text-sm text-gray-500">... và {pkg.products.length - 3} sản phẩm khác</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetail(pkg)} className="flex-1">
                    <Package className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                  <Button size="sm" onClick={() => handleOrderPackage(pkg)} className="flex-1">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Đặt hàng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Không tìm thấy gói nhu yếu phẩm nào</p>
          </CardContent>
        </Card>
      )}

      {/* Package Detail Dialog */}
      <Dialog open={showPackageDetail} onOpenChange={setShowPackageDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết gói: {selectedPackage?.name}</DialogTitle>
            <DialogDescription>Thông tin chi tiết về gói và các sản phẩm</DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Giới hạn số lượng</p>
                  <p className="text-lg">{selectedPackage.limit_per_person} gói</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Thời gian giới hạn</p>
                  <p className="text-lg">
                    {formatTimeLimit(selectedPackage.time_limit_type, selectedPackage.time_limit_value)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Sản phẩm trong gói</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hình ảnh</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Giá đơn vị</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Số lượng tối đa</TableHead>
                      <TableHead>Tổng giá</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPackage.products.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.product_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell>{product.price.toLocaleString("vi-VN")} VNĐ</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.max_quantity}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {(product.price * product.max_quantity).toLocaleString("vi-VN")} VNĐ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Tổng giá trị gói:</span>
                <span className="text-2xl font-bold text-green-600">
                  {calculatePackagePrice(selectedPackage.products).toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đặt hàng: {selectedPackage?.name}</DialogTitle>
            <DialogDescription>Chọn số lượng sản phẩm trong gói</DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Chọn số lượng sản phẩm</h3>
                <div className="space-y-4">
                  {selectedPackage.products.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-gray-500">
                            {product.price.toLocaleString("vi-VN")} VNĐ/{product.unit}
                          </p>
                          <p className="text-sm text-gray-500">
                            Tối đa: {product.max_quantity} {product.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProductQuantity(
                              product.product_id,
                              (orderData[product.product_id] || 1) - 1,
                              product.max_quantity,
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={product.max_quantity}
                          value={orderData[product.product_id] || 1}
                          onChange={(e) =>
                            updateProductQuantity(
                              product.product_id,
                              Number.parseInt(e.target.value),
                              product.max_quantity,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateProductQuantity(
                              product.product_id,
                              (orderData[product.product_id] || 1) + 1,
                              product.max_quantity,
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="ml-4 text-right">
                          <p className="font-semibold">
                            {(product.price * (orderData[product.product_id] || 1)).toLocaleString("vi-VN")} VNĐ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-green-600">
                  {calculateOrderTotal().toLocaleString("vi-VN")} VNĐ
                </span>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowOrderForm(false)} className="flex-1">
                  Hủy
                </Button>
                <Button onClick={handleSubmitOrder} disabled={submitting} className="flex-1">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đặt hàng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
