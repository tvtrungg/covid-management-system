"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  username: string
  role: string
  is_active: boolean
  last_login?: string
  require_password_change?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const router = useRouter()

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    const savedToken = localStorage.getItem("accessToken")

    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser)
        setAuthState({
          user,
          accessToken: savedToken,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch (error) {
        console.error("Error parsing saved auth data:", error)
        logout()
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const refreshInterval = setInterval(
      async () => {
        await refreshToken()
      },
      14 * 60 * 1000,
    ) // Refresh every 14 minutes

    return () => clearInterval(refreshInterval)
  }, [authState.isAuthenticated])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.firstLogin) {
          return { success: true, firstLogin: true }
        }

        const { user, accessToken, requirePasswordChange } = data

        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("accessToken", accessToken)

        setAuthState({
          user,
          accessToken,
          isLoading: false,
          isAuthenticated: true,
        })

        return {
          success: true,
          requirePasswordChange,
          redirectTo: getRedirectPath(user.role),
        }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  const logout = useCallback(async () => {
    try {
      if (authState.accessToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem("user")
      localStorage.removeItem("accessToken")

      setAuthState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      })

      router.push("/login")
    }
  }, [authState.accessToken, router])

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
      })

      if (response.ok) {
        const { accessToken } = await response.json()
        localStorage.setItem("accessToken", accessToken)

        setAuthState((prev) => ({
          ...prev,
          accessToken,
        }))

        return true
      } else {
        // Refresh failed, logout user
        logout()
        return false
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      logout()
      return false
    }
  }

  const getRedirectPath = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin"
      case "manager":
        return "/manager"
      case "user":
        return "/user"
      default:
        return "/dashboard"
    }
  }

  const hasPermission = (resource: string, action: string) => {
    if (!authState.user) return false

    // Simple permission check - in real app, use the permissions system
    const { role } = authState.user

    if (role === "admin") return true

    if (role === "manager") {
      return !["users", "settings"].includes(resource)
    }

    if (role === "user") {
      return ["packages", "orders", "payments"].includes(resource) && ["view", "create"].includes(action)
    }

    return false
  }

  return {
    ...authState,
    login,
    logout,
    refreshToken,
    hasPermission,
  }
}
