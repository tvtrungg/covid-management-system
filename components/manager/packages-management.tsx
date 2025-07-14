"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Package, Loader2, X } from "lucide-react"

interface Product {
  id: number
  name: string
  price: number
  unit: string
  images: string[]
}

interface PackageProduct {
  product_id: number
  product_name?: string
  max_quantity: number
  price?: number
  unit?: string
}

interface PackageItem {
  id: number
  name: string
  limit_per_person: number
  time_limit_type: string
  time_limit_value: number
  products: PackageProduct[]
  created_at: string
}

export function PackagesManagement() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    limit_per_person: 1,
    time_limit_type: "month",
    time_limit_value: 1,
    products: [] as PackageProduct[],
  })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPackages()
    fetchProducts()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/manager/packages")
      const data = await response.json()
      if (response.ok) {
        setPackages(data.packages)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu gói")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/manager/products")
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu sản phẩm")
    }
  }

  const handleAdd = () => {
    setEditingPackage(null)
    setFormData({
      name: "",
      limit_per_person: 1,
      time_limit_type: "month",
      time_limit_value: 1,
      products: [],
    })
    setShowAddForm(true)
  }

  const handleEdit = async (pkg: PackageItem) => {
    try {
      const response = await fetch(`/api/manager/packages/${pkg.id}`)
      const data = await response.json()
      if (response.ok) {
        setEditingPackage(pkg)
        setFormData({
          name: data.package.name,
          limit_per_person: data.package.limit_per_person,
          time_limit_type: data.package.time_limit_type,
          time_limit_value: data.package.time_limit_value,
          products: data.package.products.map((p: any) => ({
            product_id: p.product_id,
            max_quantity: p.max_quantity,
          })),
        })
        setShowAddForm(true)
      }
    } catch (err) {
      setError("Lỗi tải chi tiết gói")
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói này?")) {
      try {
        const response = await fetch(`/api/manager/packages/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setPackages(packages.filter((pkg) => pkg.id !== id))
          setMessage("Xóa gói thành công!")
          setTimeout(() => setMessage(""), 3000)
        } else {
          const data = await response.json()
          setError(data.error || "Xóa gói thất bại")
          setTimeout(() => setError(""), 3000)
        }
      } catch (err) {
        setError("Lỗi kết nối server")
        setTimeout(() => setError(""), 3000)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.products.length === 0) {
      setError("Vui lòng thêm ít nhất một sản phẩm vào gói")
      return
    }

    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const method = editingPackage ? "PUT" : "POST"
      const url = editingPackage ? `/api/manager/packages/${editingPackage.id}` : "/api/manager/packages"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(editingPackage ? "Cập nhật gói thành công!" : "Thêm gói thành công!")
        setShowAddForm(false)
        fetchPackages()
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setSubmitting(false)
    }
  }

  const addProductToPackage = (productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (product && !formData.products.find((p) => p.product_id === productId)) {
      setFormData({
        ...formData,
        products: [
          ...formData.products,
          {
            product_id: productId,
            max_quantity: 1,
          },
        ],
      })
    }
  }

  const removeProductFromPackage = (productId: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((p) => p.product_id !== productId),
    })
  }

  const updateProductQuantity = (productId: number, quantity: number) => {
    setFormData({
      ...formData,
      products: formData.products.map((p) =>
        p.product_id === productId ? { ...p, max_quantity: Math.max(1, quantity) } : p,
      ),
    })
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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý gói nhu yếu phẩm</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm gói
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Chỉnh sửa gói" : "Thêm gói mới"}</DialogTitle>
              <DialogDescription>Tạo gói nhu yếu phẩm với các sản phẩm</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên gói *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limit_per_person">Giới hạn số lượng *</Label>
                  <Input
                    id="limit_per_person"
                    type="number"
                    min="1"
                    value={formData.limit_per_person}
                    onChange={(e) => setFormData({ ...formData, limit_per_person: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time_limit_type">Loại thời gian giới hạn *</Label>
                  <Select
                    value={formData.time_limit_type}
                    onValueChange={(value) => setFormData({ ...formData, time_limit_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Ngày</SelectItem>
                      <SelectItem value="week">Tuần</SelectItem>
                      <SelectItem value="month">Tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_limit_value">Giá trị thời gian *</Label>
                  <Input
                    id="time_limit_value"
                    type="number"
                    min="1"
                    value={formData.time_limit_value}
                    onChange={(e) => setFormData({ ...formData, time_limit_value: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Add Products Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Sản phẩm trong gói</Label>
                  <Select onValueChange={(value) => addProductToPackage(Number.parseInt(value))}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Thêm sản phẩm..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter((product) => !formData.products.find((p) => p.product_id === product.id))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - {product.price.toLocaleString("vi-VN")} VNĐ/{product.unit}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.products.length > 0 && (
                  <div className="space-y-2">
                    {formData.products.map((packageProduct) => {
                      const product = products.find((p) => p.id === packageProduct.product_id)
                      return (
                        <div
                          key={packageProduct.product_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={product?.images[0] || "/placeholder.svg"}
                              alt={product?.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{product?.name}</p>
                              <p className="text-sm text-gray-500">
                                {product?.price.toLocaleString("vi-VN")} VNĐ/{product?.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">Số lượng tối đa:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={packageProduct.max_quantity}
                              onChange={(e) =>
                                updateProductQuantity(packageProduct.product_id, Number.parseInt(e.target.value))
                              }
                              className="w-20"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeProductFromPackage(packageProduct.product_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPackage ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm gói..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Packages List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói ({filteredPackages.length})</CardTitle>
          <CardDescription>Quản lý các gói nhu yếu phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên gói</TableHead>
                  <TableHead>Số sản phẩm</TableHead>
                  <TableHead>Giới hạn</TableHead>
                  <TableHead>Thời gian giới hạn</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{pkg.products.length} sản phẩm</Badge>
                    </TableCell>
                    <TableCell>{pkg.limit_per_person} gói</TableCell>
                    <TableCell>{formatTimeLimit(pkg.time_limit_type, pkg.time_limit_value)}</TableCell>
                    <TableCell>{new Date(pkg.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredPackages.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Không tìm thấy gói nhu yếu phẩm nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
