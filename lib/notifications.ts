import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  category: "general" | "covid" | "order" | "payment" | "system"
  is_read: boolean
  action_url?: string
  metadata?: any
  created_at: string
  read_at?: string
}

export interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  categories: {
    general: boolean
    covid: boolean
    order: boolean
    payment: boolean
    system: boolean
  }
}

export class NotificationService {
  // Create notification
  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: Notification["type"] = "info",
    category: Notification["category"] = "general",
    actionUrl?: string,
    metadata?: any,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("create_notification", {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_category: category,
      p_action_url: actionUrl,
      p_metadata: metadata,
    })

    if (error) throw error

    // Send email notification if enabled
    await this.sendEmailNotification(userId, title, message, type, category)

    return data
  }

  // Get user notifications
  async getUserNotifications(
    userId: number,
    options: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      category?: string
    } = {},
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (options.unreadOnly) {
      query = query.eq("is_read", false)
    }

    if (options.category) {
      query = query.eq("category", options.category)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      notifications: data || [],
      total: count || 0,
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)

    if (error) throw error
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
  }

  // Get notification preferences
  async getPreferences(userId: number): Promise<NotificationPreferences> {
    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      // Create default preferences
      const defaultPrefs = {
        user_id: userId,
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        categories: {
          general: true,
          covid: true,
          order: true,
          payment: true,
          system: true,
        },
      }

      const { data: newPrefs, error: createError } = await supabase
        .from("notification_preferences")
        .insert(defaultPrefs)
        .select()
        .single()

      if (createError) throw createError
      return newPrefs
    }

    return data
  }

  // Update notification preferences
  async updatePreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  }

  // Send email notification
  private async sendEmailNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    category: string,
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getPreferences(userId)

      if (!preferences.email_enabled || !preferences.categories[category as keyof typeof preferences.categories]) {
        return
      }

      // Get user email
      const { data: user } = await supabase.from("users").select("username").eq("id", userId).single()

      if (!user) return

      // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
      console.log(`Email notification sent to ${user.username}:`, {
        title,
        message,
        type,
        category,
      })

      // TODO: Implement actual email sending
      // await emailService.send({
      //   to: user.email,
      //   subject: title,
      //   html: message,
      //   template: 'notification'
      // })
    } catch (error) {
      console.error("Failed to send email notification:", error)
    }
  }

  // Bulk notifications for system events
  async notifyAllUsers(
    title: string,
    message: string,
    type: Notification["type"] = "info",
    category: Notification["category"] = "system",
    filters?: {
      roles?: string[]
      provinces?: number[]
    },
  ): Promise<void> {
    let query = supabase.from("users").select("id")

    if (filters?.roles?.length) {
      query = query.in("role", filters.roles)
    }

    const { data: users, error } = await query

    if (error) throw error

    if (users?.length) {
      const notifications = users.map((user) => ({
        user_id: user.id,
        title,
        message,
        type,
        category,
      }))

      const { error: insertError } = await supabase.from("notifications").insert(notifications)

      if (insertError) throw insertError
    }
  }

  // Notification templates for common events
  async notifyOrderCreated(userId: number, orderId: number, totalAmount: number): Promise<void> {
    await this.createNotification(
      userId,
      "Đơn hàng đã được tạo",
      `Đơn hàng #${orderId} với tổng tiền ${totalAmount.toLocaleString("vi-VN")} VNĐ đã được tạo thành công.`,
      "success",
      "order",
      `/user/orders/${orderId}`,
      { orderId, totalAmount },
    )
  }

  async notifyPaymentReceived(userId: number, amount: number): Promise<void> {
    await this.createNotification(
      userId,
      "Thanh toán thành công",
      `Đã nhận thanh toán ${amount.toLocaleString("vi-VN")} VNĐ vào tài khoản của bạn.`,
      "success",
      "payment",
      "/user/payments",
      { amount },
    )
  }

  async notifyCovidStatusChange(userId: number, oldStatus: string, newStatus: string, notes?: string): Promise<void> {
    await this.createNotification(
      userId,
      "Thay đổi trạng thái Covid-19",
      `Trạng thái của bạn đã được cập nhật từ ${oldStatus} thành ${newStatus}.${notes ? ` Ghi chú: ${notes}` : ""}`,
      newStatus === "F0" ? "warning" : newStatus === "F3" ? "success" : "info",
      "covid",
      "/user/profile",
      { oldStatus, newStatus, notes },
    )
  }

  async notifySystemMaintenance(startTime: string, endTime: string): Promise<void> {
    await this.notifyAllUsers(
      "Bảo trì hệ thống",
      `Hệ thống sẽ được bảo trì từ ${startTime} đến ${endTime}. Trong thời gian này, một số tính năng có thể không khả dụng.`,
      "warning",
      "system",
    )
  }
}

export const notificationService = new NotificationService()
