"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, DollarSign, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: number
  from_account_id: string
  to_account_id: string
  amount: number
  transaction_type: string
  description: string
  status: string
  created_at: string
}

interface PaymentAccount {
  account_id: string
  balance: number
}

interface PaymentHistoryProps {
  personId: number
}

export function PaymentHistory({ personId }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [account, setAccount] = useState<PaymentAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    if (personId) {
      fetchPaymentData()
    }
  }, [personId])

  const fetchPaymentData = async () => {
    try {
      const [accountResponse, transactionsResponse] = await Promise.all([
        fetch(`/api/user/payment/account?person_id=${personId}`),
        fetch(`/api/user/payment/transactions?person_id=${personId}`),
      ])

      const accountData = await accountResponse.json()
      const transactionsData = await transactionsResponse.json()

      if (accountResponse.ok) {
        setAccount(accountData.account)
      }
      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions)
      }
    } catch (err) {
      console.error("Error fetching payment data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ")
      return
    }

    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/user/payment/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          amount: Number.parseFloat(depositAmount),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Nạp tiền thành công!")
        setDepositAmount("")
        setShowDepositForm(false)
        fetchPaymentData()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setError(data.error || "Nạp tiền thất bại")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentAmount || Number.parseFloat(paymentAmount) <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ")
      return
    }

    if (account && Number.parseFloat(paymentAmount) > account.balance) {
      setError("Số dư không đủ để thanh toán")
      return
    }

    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/user/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          amount: Number.parseFloat(paymentAmount),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Thanh toán thành công!")
        setPaymentAmount("")
        setShowPaymentForm(false)
        fetchPaymentData()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setError(data.error || "Thanh toán thất bại")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setSubmitting(false)
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "deposit":
        return "Nạp tiền"
      case "payment":
        return "Thanh toán"
      case "transfer":
        return "Chuyển khoản"
      default:
        return type
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "default"
      case "payment":
        return "secondary"
      case "transfer":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredTransactions = transactions.filter(
    (transaction) => typeFilter === "all" || transaction.transaction_type === typeFilter,
  )

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý thanh toán</h2>
        <div className="flex space-x-2">
          <Dialog open={showDepositForm} onOpenChange={setShowDepositForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nạp tiền
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nạp tiền vào tài khoản</DialogTitle>
                <DialogDescription>Nhập số tiền muốn nạp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Số tiền (VNĐ)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="1000"
                    step="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleDeposit} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Nạp tiền
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
            <DialogTrigger asChild>
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                Thanh toán
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thanh toán dư nợ</DialogTitle>
                <DialogDescription>Thanh toán chi phí đơn hàng</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Số tiền thanh toán (VNĐ)</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="1000"
                    step="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                  />
                  <p className="text-sm text-gray-500">
                    Số dư hiện tại: {account?.balance.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handlePayment} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Thanh toán
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Account Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{account?.balance.toLocaleString("vi-VN")} VNĐ</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng nạp tiền</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transactions
                .filter((t) => t.transaction_type === "deposit")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("vi-VN")}{" "}
              VNĐ
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactions
                .filter((t) => t.transaction_type === "payment")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("vi-VN")}{" "}
              VNĐ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Filter */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lịch sử giao dịch</h3>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả giao dịch</SelectItem>
            <SelectItem value="deposit">Nạp tiền</SelectItem>
            <SelectItem value="payment">Thanh toán</SelectItem>
            <SelectItem value="transfer">Chuyển khoản</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch ({filteredTransactions.length})</CardTitle>
          <CardDescription>Các giao dịch nạp tiền và thanh toán</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày giao dịch</TableHead>
                  <TableHead>Loại giao dịch</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.transaction_type === "deposit" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <Badge variant={getTransactionTypeColor(transaction.transaction_type)}>
                          {getTransactionTypeText(transaction.transaction_type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell
                      className={`font-semibold ${
                        transaction.transaction_type === "deposit" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.transaction_type === "deposit" ? "+" : "-"}
                      {transaction.amount.toLocaleString("vi-VN")} VNĐ
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === "completed" ? "default" : "destructive"}>
                        {transaction.status === "completed" ? "Hoàn thành" : "Thất bại"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Chưa có giao dịch nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
