"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, ShoppingCart, CreditCard } from "lucide-react"
import { PersonalInfo } from "@/components/user/personal-info"
import { PackageStore } from "@/components/user/package-store"
import { PaymentHistory } from "@/components/user/payment-history"
import { OrderHistory } from "@/components/user/order-history"

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [personInfo, setPersonInfo] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      fetchPersonInfo(JSON.parse(userData).id)
    }
  }, [])

  const fetchPersonInfo = async (userId: number) => {
    try {
      const response = await fetch(`/api/user/profile/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setPersonInfo(data.person)
      }
    } catch (err) {
      console.error("Error fetching person info:", err)
    }
  }

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
              <p className="text-gray-600">Xin chào, {personInfo?.full_name || user?.username}</p>
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
                <CardTitle className="text-sm font-medium">Trạng thái hiện tại</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    personInfo?.status === "F0"
                      ? "text-red-600"
                      : personInfo?.status === "F1"
                        ? "text-orange-600"
                        : "text-blue-600"
                  }`}
                >
                  {personInfo?.status || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Cập nhật mới nhất</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đơn hàng tháng này</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">+1 từ tháng trước</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dư nợ hiện tại</CardTitle>
                <CreditCard className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">250,000 VNĐ</div>
                <p className="text-xs text-muted-foreground">Cần thanh toán</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số dư tài khoản</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">500,000 VNĐ</div>
                <p className="text-xs text-muted-foreground">Có thể sử dụng</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="store">Mua hàng</TabsTrigger>
              <TabsTrigger value="orders">Lịch sử đơn hàng</TabsTrigger>
              <TabsTrigger value="payments">Thanh toán</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <PersonalInfo person={personInfo} />
            </TabsContent>

            <TabsContent value="store" className="space-y-4">
              <PackageStore personId={personInfo?.id} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <OrderHistory personId={personInfo?.id} />
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <PaymentHistory personId={personInfo?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
