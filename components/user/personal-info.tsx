"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { User, MapPin, Calendar, Key, Loader2 } from "lucide-react"

interface PersonalInfoProps {
  person: any
}

export function PersonalInfo({ person }: PersonalInfoProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      // Get user info from localStorage
      const userStr = localStorage.getItem("user")
      if (!userStr) {
        setError("Không tìm thấy thông tin người dùng")
        return
      }

      const user = JSON.parse(userStr)

      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Đổi mật khẩu thành công!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setTimeout(() => {
          setShowChangePassword(false)
          setMessage("")
        }, 2000)
      } else {
        setError(data.error || "Đổi mật khẩu thất bại")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "F0":
        return "destructive"
      case "F1":
        return "default"
      case "F2":
        return "secondary"
      case "F3":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!person) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Thông tin cơ bản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Họ tên</p>
              <p className="text-lg font-semibold">{person.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Số CMND/CCCD</p>
              <p className="text-lg">{person.id_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Năm sinh</p>
              <p className="text-lg">{person.birth_year}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Trạng thái hiện tại</p>
              <Badge variant={getStatusColor(person.status)} className="text-lg">
                {person.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Địa chỉ nơi ở
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Tỉnh/Thành phố</p>
              <p className="text-lg">{person.province_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Quận/Huyện</p>
              <p className="text-lg">{person.district_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phường/Xã</p>
              <p className="text-lg">{person.ward_name}</p>
            </div>
          </div>
          {person.treatment_location_name && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Nơi điều trị/cách ly</p>
              <p className="text-lg">{person.treatment_location_name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Lịch sử được quản lý
          </CardTitle>
          <CardDescription>Các thay đổi trạng thái và nơi điều trị</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Loại thay đổi</TableHead>
                <TableHead>Từ</TableHead>
                <TableHead>Đến</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{new Date(person.created_at).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>Tạo mới</TableCell>
                <TableCell>-</TableCell>
                <TableCell>{person.status}</TableCell>
                <TableCell>Tạo mới thông tin người liên quan</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Cài đặt tài khoản
          </CardTitle>
          <CardDescription>Quản lý thông tin đăng nhập</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogTrigger asChild>
                <Button variant="outline">Đổi mật khẩu</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đổi mật khẩu</DialogTitle>
                  <DialogDescription>Nhập mật khẩu hiện tại và mật khẩu mới</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đổi mật khẩu
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="text-sm text-gray-500">
              <p>
                💡 <strong>Lưu ý:</strong> Để nạp tiền vào tài khoản, vui lòng chuyển đến tab "Thanh toán"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
