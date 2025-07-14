"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface Province {
  id: number
  name: string
}

interface District {
  id: number
  name: string
}

interface Ward {
  id: number
  name: string
}

interface TreatmentLocation {
  id: number
  name: string
  capacity: number
  current_count: number
}

interface CovidPerson {
  id: number
  full_name: string
  id_number: string
}

export function AddPersonForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    id_number: "",
    birth_year: new Date().getFullYear() - 30,
    province_id: "",
    district_id: "",
    ward_id: "",
    status: "F3",
    treatment_location_id: "",
    related_person_id: "",
  })

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [treatmentLocations, setTreatmentLocations] = useState<TreatmentLocation[]>([])
  const [covidPeople, setCovidPeople] = useState<CovidPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchProvinces()
    fetchTreatmentLocations()
    fetchCovidPeople()
  }, [])

  useEffect(() => {
    if (formData.province_id) {
      fetchDistricts(formData.province_id)
      setFormData((prev) => ({ ...prev, district_id: "", ward_id: "" }))
    }
  }, [formData.province_id])

  useEffect(() => {
    if (formData.district_id) {
      fetchWards(formData.district_id)
      setFormData((prev) => ({ ...prev, ward_id: "" }))
    }
  }, [formData.district_id])

  const fetchProvinces = async () => {
    try {
      const response = await fetch("/api/manager/locations/provinces")
      const data = await response.json()
      if (response.ok) {
        setProvinces(data.provinces)
      }
    } catch (err) {
      console.error("Error fetching provinces:", err)
    }
  }

  const fetchDistricts = async (provinceId: string) => {
    try {
      const response = await fetch(`/api/manager/locations/districts?province_id=${provinceId}`)
      const data = await response.json()
      if (response.ok) {
        setDistricts(data.districts)
      }
    } catch (err) {
      console.error("Error fetching districts:", err)
    }
  }

  const fetchWards = async (districtId: string) => {
    try {
      const response = await fetch(`/api/manager/locations/wards?district_id=${districtId}`)
      const data = await response.json()
      if (response.ok) {
        setWards(data.wards)
      }
    } catch (err) {
      console.error("Error fetching wards:", err)
    }
  }

  const fetchTreatmentLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations")
      const data = await response.json()
      if (response.ok) {
        setTreatmentLocations(data.locations)
      }
    } catch (err) {
      console.error("Error fetching treatment locations:", err)
    }
  }

  const fetchCovidPeople = async () => {
    try {
      const response = await fetch("/api/manager/covid-people")
      const data = await response.json()
      if (response.ok) {
        setCovidPeople(data.people)
      }
    } catch (err) {
      console.error("Error fetching covid people:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/manager/covid-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          province_id: Number.parseInt(formData.province_id),
          district_id: Number.parseInt(formData.district_id),
          ward_id: Number.parseInt(formData.ward_id),
          treatment_location_id: formData.treatment_location_id
            ? Number.parseInt(formData.treatment_location_id)
            : null,
          related_person_id: formData.related_person_id ? Number.parseInt(formData.related_person_id) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Thêm người liên quan thành công!")
        setFormData({
          full_name: "",
          id_number: "",
          birth_year: new Date().getFullYear() - 30,
          province_id: "",
          district_id: "",
          ward_id: "",
          status: "F3",
          treatment_location_id: "",
          related_person_id: "",
        })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(data.error || "Thêm người liên quan thất bại")
      }
    } catch (err) {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Họ tên *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_number">Số CMND/CCCD *</Label>
          <Input
            id="id_number"
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birth_year">Năm sinh *</Label>
          <Input
            id="birth_year"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.birth_year}
            onChange={(e) => setFormData({ ...formData, birth_year: Number.parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F0">F0</SelectItem>
              <SelectItem value="F1">F1</SelectItem>
              <SelectItem value="F2">F2</SelectItem>
              <SelectItem value="F3">F3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="province">Tỉnh/Thành phố *</Label>
          <Select
            value={formData.province_id}
            onValueChange={(value) => setFormData({ ...formData, province_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tỉnh/thành phố" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id.toString()}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">Quận/Huyện *</Label>
          <Select
            value={formData.district_id}
            onValueChange={(value) => setFormData({ ...formData, district_id: value })}
            disabled={!formData.province_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn quận/huyện" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ward">Phường/Xã *</Label>
          <Select
            value={formData.ward_id}
            onValueChange={(value) => setFormData({ ...formData, ward_id: value })}
            disabled={!formData.district_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn phường/xã" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id.toString()}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="treatment_location">Nơi điều trị/cách ly</Label>
          <Select
            value={formData.treatment_location_id}
            onValueChange={(value) => setFormData({ ...formData, treatment_location_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn nơi điều trị" />
            </SelectTrigger>
            <SelectContent>
              {treatmentLocations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name} ({location.current_count}/{location.capacity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="related_person">Người liên quan</Label>
          <Select
            value={formData.related_person_id}
            onValueChange={(value) => setFormData({ ...formData, related_person_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn người liên quan" />
            </SelectTrigger>
            <SelectContent>
              {covidPeople.map((person) => (
                <SelectItem key={person.id} value={person.id.toString()}>
                  {person.full_name} - {person.id_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Thêm người liên quan
      </Button>
    </form>
  )
}
