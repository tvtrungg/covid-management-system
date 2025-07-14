"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Check, X } from "lucide-react"

export function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const validatePassword = (password: string) => {
    const errors: string[] = []
    let strength = 0

    if (password.length >= 8) {
      strength += 20
    } else {
      errors.push("Ít nhất 8 ký tự")
    }

    if (/[A-Z]/.test(password)) {
      strength += 20
    } else {
      errors.push("Ít nhất 1 chữ hoa")
    }

    if (/[a-z]/.test(password)) {
      strength += 20
    } else {
      errors.push("Ít nhất 1 chữ thường")
    }

    if (/[0-9]/.test(password)) {
      strength += 20
    } else {
      errors.push("Ít nhất 1 số")
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 20
    } else {
      errors.push("Ít nhất 1 ký tự đặc biệt")
    }

    setPasswordStrength(strength)
    setPasswordErrors(errors)
  }

  const handlePasswordChange = (password: string) => {
    setNewPassword(password)
    validatePassword(password)
  }

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500"
    if (passwordStrength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 40) return "Yếu"
    if (passwordStrength < 80) return "Trung bình"
    return "Mạnh"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError("Token không hợp lệ")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (passwordStrength < 100) {
      setError("Mật khẩu chưa đủ mạnh")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Liên kết không hợp lệ</CardTitle>
            <CardDescription>Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Quay lại đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Đặt lại mật khẩu thành công</CardTitle>
            <CardDescription>
              Mật khẩu của bạn đã được đặt lại. Bạn sẽ được chuyển hướng đến trang đăng nhập.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                disabled={loading}
              />

              {newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Độ mạnh mật khẩu:</span>
                    <span
                      className={
                        passwordStrength >= 80
                          ? "text-green-600"
                          : passwordStrength >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />

                  {passwordErrors.length > 0 && (
                    <div className="space-y-1">
                      {passwordErrors.map((error, index) => (
                        <div key={index} className="flex items-center text-sm text-red-600">
                          <X className="w-3 h-3 mr-1" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading || passwordStrength < 100}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt lại mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
