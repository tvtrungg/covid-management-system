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
import { Plus, Edit, Trash2, Search, ArrowUpDown, Loader2 } from "lucide-react"

interface Product {
  id: number
  name: string
  images: string[]
  price: number
  unit: string
  created_at: string
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    images: ["/placeholder.svg?height=200&width=200"],
    price: 0,
    unit: "",
  })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<keyof Product>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/manager/products")
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      images: ["/placeholder.svg?height=200&width=200"],
      price: 0,
      unit: "",
    })
    setShowAddForm(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      images: product.images,
      price: product.price,
      unit: product.unit,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`/api/manager/products/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setProducts(products.filter((product) => product.id !== id))
          setMessage("Xóa sản phẩm thành công!")
          setTimeout(() => setMessage(""), 3000)
        } else {
          const data = await response.json()
          setError(data.error || "Xóa sản phẩm thất bại")
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
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const method = editingProduct ? "PUT" : "POST"
      const url = editingProduct ? `/api/manager/products/${editingProduct.id}` : "/api/manager/products"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(editingProduct ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!")
        setShowAddForm(false)
        fetchProducts()
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unit.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSort = (key: keyof Product) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    } else {
      return 0
    }
  })

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm nhu yếu phẩm</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin sản phẩm nhu yếu phẩm</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá tiền *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kg, chai, gói..."
                    required
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Cập nhật" : "Thêm mới"}
              </Button>
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
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm ({sortedProducts.length})</CardTitle>
          <CardDescription>Quản lý các sản phẩm nhu yếu phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hình ảnh</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0">
                      Tên sản phẩm <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("price")} className="h-auto p-0">
                      Giá tiền <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.price.toLocaleString("vi-VN")} VNĐ</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{new Date(product.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
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
    </div>
  )
}
