"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MapPin, UserPlus, Settings } from "lucide-react"
import { CreateManagerForm } from "@/components/admin/create-manager-form"
import { ManageLocations } from "@/components/admin/manage-locations"
import { ManageManagers } from "@/components/admin/manage-managers"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản trị hệ thống</h1>
              <p className="text-gray-600">Xin chào, {user?.username}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng người quản lý</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 từ tháng trước</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Địa điểm điều trị</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tài khoản hoạt động</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">11</div>
                <p className="text-xs text-muted-foreground">1 tài khoản bị khóa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cài đặt hệ thống</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">OK</div>
                <p className="text-xs text-muted-foreground">Hệ thống ổn định</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="managers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="managers">Quản lý tài khoản</TabsTrigger>
              <TabsTrigger value="locations">Địa điểm điều trị</TabsTrigger>
              <TabsTrigger value="create">Tạo tài khoản</TabsTrigger>
            </TabsList>

            <TabsContent value="managers" className="space-y-4">
              <ManageManagers />
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <ManageLocations />
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <CreateManagerForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
