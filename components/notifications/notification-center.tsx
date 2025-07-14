"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Check, CheckCheck, Filter, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { notificationService, type Notification } from "@/lib/notifications"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    fetchNotifications()
  }, [filter, categoryFilter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      const { notifications: data, total } = await notificationService.getUserNotifications(user.id, {
        limit: 50,
        unreadOnly: filter === "unread",
        category: categoryFilter === "all" ? undefined : categoryFilter,
      })

      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.id) return

      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "covid":
        return "bg-red-100 text-red-800"
      case "order":
        return "bg-blue-100 text-blue-800"
      case "payment":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread" && notification.is_read) return false
    if (filter === "read" && !notification.is_read) return false
    return true
  })

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Thông báo</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Lọc
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter("all")}>Tất cả</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("unread")}>Chưa đọc</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("read")}>Đã đọc</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="general">Chung</TabsTrigger>
            <TabsTrigger value="covid">Covid</TabsTrigger>
            <TabsTrigger value="order">Đơn hàng</TabsTrigger>
            <TabsTrigger value="payment">Thanh toán</TabsTrigger>
            <TabsTrigger value="system">Hệ thống</TabsTrigger>
          </TabsList>

          <TabsContent value={categoryFilter} className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.is_read ? "bg-gray-50" : "bg-white border-blue-200"
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-medium ${!notification.is_read ? "font-semibold" : ""}`}>
                                {notification.title}
                              </h4>
                              <Badge variant="outline" className={`text-xs ${getCategoryColor(notification.category)}`}>
                                {notification.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: vi,
                                })}
                              </span>
                              {notification.action_url && (
                                <Button variant="link" size="sm" className="p-0 h-auto">
                                  Xem chi tiết
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
