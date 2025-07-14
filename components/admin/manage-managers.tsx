"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Unlock, Loader2 } from "lucide-react"

interface Manager {
  id: number
  username: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export function ManageManagers() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/admin/managers")
      const data = await response.json()
      if (response.ok) {
        setManagers(data.managers)
      }
    } catch (err) {
      setError("Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  const toggleAccountStatus = async (managerId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/managers/${managerId}/toggle-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(currentStatus ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản")
        fetchManagers()
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    }
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
      <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>

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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài khoản</CardTitle>
          <CardDescription>Quản lý tài khoản người quản lý và admin</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Phân quyền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">{manager.username}</TableCell>
                  <TableCell>
                    <Badge variant={manager.role === "admin" ? "default" : "secondary"}>
                      {manager.role === "admin" ? "Admin" : "Manager"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={manager.is_active ? "default" : "destructive"}>
                      {manager.is_active ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(manager.created_at).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAccountStatus(manager.id, manager.is_active)}
                    >
                      {manager.is_active ? (
                        <>
                          <Lock className="h-4 w-4 mr-1" />
                          Khóa
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-1" />
                          Mở khóa
                        </>
                      )}
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
