"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { AddPersonForm } from "./add-person-form"
import { Search, Eye, Edit, Users, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface CovidPerson {
  id: number
  full_name: string
  id_number: string
  birth_year: number
  status: string
  province_name?: string
  district_name?: string
  ward_name?: string
  treatment_location_name?: string
}

export function CovidPeopleManagement() {
  const [people, setPeople] = useState<CovidPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    try {
      const response = await fetch("/api/manager/covid-people")
      const data = await response.json()
      if (response.ok) {
        setPeople(data.people)
      }
    } catch (err) {
      console.error("Error fetching people:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPeople = people.filter((person) => {
    const matchesSearch =
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || person.id_number.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || person.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý người liên quan Covid-19</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm người mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm người liên quan Covid-19</DialogTitle>
              <DialogDescription>Nhập đầy đủ thông tin của người liên quan.</DialogDescription>
            </DialogHeader>
            <AddPersonForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc CMND..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="F0">F0</SelectItem>
                <SelectItem value="F1">F1</SelectItem>
                <SelectItem value="F2">F2</SelectItem>
                <SelectItem value="F3">F3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* People List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người liên quan ({filteredPeople.length})</CardTitle>
          <CardDescription>Quản lý thông tin người liên quan Covid-19</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPeople.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>CMND/CCCD</TableHead>
                  <TableHead>Năm sinh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Nơi điều trị</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeople.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.full_name}</TableCell>
                    <TableCell>{person.id_number}</TableCell>
                    <TableCell>{person.birth_year}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(person.status)}>{person.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {person.ward_name}, {person.district_name}, {person.province_name}
                    </TableCell>
                    <TableCell>{person.treatment_location_name || "Chưa có"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Không tìm thấy người liên quan nào</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
