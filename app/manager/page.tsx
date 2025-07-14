"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Package, ShoppingCart } from "lucide-react"
import { CovidPeopleManagement } from "@/components/manager/covid-people-management"
import { ProductsManagement } from "@/components/manager/products-management"
import { PackagesManagement } from "@/components/manager/packages-management"
import { StatisticsView } from "@/components/manager/statistics-view"

export default function ManagerDashboard() {
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
              <h1 className="text-3xl font-bold text-gray-900">Hệ thống quản lý Covid-19</h1>
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
                <CardTitle className="text-sm font-medium">Tổng F0</CardTitle>
                <Users className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">45</div>
                <p className="text-xs text-muted-foreground">+3 từ hôm qua</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng F1</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">128</div>
                <p className="text-xs text-muted-foreground">+12 từ hôm qua</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sản phẩm</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Đang bán</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đơn hàng hôm nay</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">+5 từ hôm qua</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="people" className="space-y-4">
            <TabsList>
              <TabsTrigger value="people">Quản lý người liên quan</TabsTrigger>
              <TabsTrigger value="products">Sản phẩm</TabsTrigger>
              <TabsTrigger value="packages">Gói nhu yếu phẩm</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-4">
              <CovidPeopleManagement />
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <ProductsManagement />
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <PackagesManagement />
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <StatisticsView />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
