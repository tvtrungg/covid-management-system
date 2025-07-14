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
import { Plus, Edit, Loader2 } from "lucide-react"

interface Location {
  id: number
  name: string
  capacity: number
  current_count: number
}

export function ManageLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    capacity: 0,
  })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations")
      const data = await response.json()
      if (response.ok) {
        setLocations(data.locations)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const url = editingLocation ? `/api/admin/locations/${editingLocation.id}` : "/api/admin/locations"

      const method = editingLocation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(editingLocation ? "Cập nhật thành công!" : "Thêm địa điểm thành công!")
        setDialogOpen(false)
        setEditingLocation(null)
        setFormData({ name: "", capacity: 0 })
        fetchLocations()
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      capacity: location.capacity,
    })
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingLocation(null)
    setFormData({ name: "", capacity: 0 })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý địa điểm điều trị</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm địa điểm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin địa điểm điều trị/cách ly</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên địa điểm</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLocation ? "Cập nhật" : "Thêm mới"}
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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách địa điểm</CardTitle>
          <CardDescription>Quản lý các địa điểm điều trị và cách ly</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên địa điểm</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Đang điều trị</TableHead>
                <TableHead>Tỷ lệ lấp đầy</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.capacity}</TableCell>
                  <TableCell>{location.current_count}</TableCell>
                  <TableCell>{((location.current_count / location.capacity) * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(location)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
