"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, Clock, TrendingUp, User, Package, ShoppingCart, MapPin, FileText, X } from "lucide-react"
import { searchService, type SearchResult, type SearchFilters } from "@/lib/search"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<{ query: string; count: number }[]>([])
  const [filters, setFilters] = useState<SearchFilters>({})
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]>>({})

  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch()
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [debouncedQuery, filters])

  useEffect(() => {
    loadSearchHistory()
    loadPopularSearches()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const performSearch = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const searchResults = await searchService.globalSearch(debouncedQuery, filters, {}, user.id)

      setResults(searchResults.results)
      setSuggestions(searchResults.suggestions)
      setFacets(searchResults.facets)
      setShowResults(true)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSearchHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user.id) {
        const history = await searchService.getSearchHistory(user.id)
        setSearchHistory(history)
      }
    } catch (error) {
      console.error("Failed to load search history:", error)
    }
  }

  const loadPopularSearches = async () => {
    try {
      const popular = await searchService.getPopularSearches()
      setPopularSearches(popular)
    } catch (error) {
      console.error("Failed to load popular searches:", error)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    router.push(result.url)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowResults(false)
  }

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "person":
        return <User className="h-4 w-4" />
      case "product":
        return <Package className="h-4 w-4" />
      case "package":
        return <Package className="h-4 w-4" />
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "person":
        return "Người"
      case "product":
        return "Sản phẩm"
      case "package":
        return "Gói"
      case "order":
        return "Đơn hàng"
      case "location":
        return "Địa điểm"
      default:
        return "Khác"
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters]
    return Array.isArray(value) ? value.length > 0 : value !== undefined
  })

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Tìm kiếm người, sản phẩm, đơn hàng..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && <Badge variant="destructive" className="ml-1 h-2 w-2 p-0" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Bộ lọc tìm kiếm</h4>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium">Loại</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["person", "product", "package", "order", "location"].map((type) => (
                      <Badge
                        key={type}
                        variant={filters.types?.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTypes = filters.types || []
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter((t) => t !== type)
                            : [...currentTypes, type]
                          setFilters({ ...filters, types: newTypes })
                        }}
                      >
                        {getTypeLabel(type as SearchResult["type"])}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium">Khoảng thời gian</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      type="date"
                      value={filters.dateRange?.start || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { ...filters.dateRange, start: e.target.value, end: filters.dateRange?.end || "" },
                        })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.dateRange?.end || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: { start: filters.dateRange?.start || "", end: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["F0", "F1", "F2", "F3", "pending", "paid", "delivered"].map((status) => (
                      <Badge
                        key={status}
                        variant={filters.status?.includes(status) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentStatus = filters.status || []
                          const newStatus = currentStatus.includes(status)
                            ? currentStatus.filter((s) => s !== status)
                            : [...currentStatus, status]
                          setFilters({ ...filters, status: newStatus })
                        }}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-sm font-medium">Khoảng giá</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Từ"
                      value={filters.priceRange?.min || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceRange: {
                            ...filters.priceRange,
                            min: Number(e.target.value),
                            max: filters.priceRange?.max || 0,
                          },
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Đến"
                      value={filters.priceRange?.max || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceRange: { min: filters.priceRange?.min || 0, max: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>

                <Button onClick={() => setShowFilters(false)} className="w-full">
                  Áp dụng bộ lọc
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <Command>
              <CommandList>
                {loading && (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                )}

                {!loading && query.trim() === "" && (
                  <>
                    {/* Search History */}
                    {searchHistory.length > 0 && (
                      <CommandGroup heading="Tìm kiếm gần đây">
                        {searchHistory.slice(0, 5).map((historyQuery, index) => (
                          <CommandItem key={index} onSelect={() => handleSuggestionClick(historyQuery)}>
                            <Clock className="mr-2 h-4 w-4" />
                            {historyQuery}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Popular Searches */}
                    {popularSearches.length > 0 && (
                      <CommandGroup heading="Tìm kiếm phổ biến">
                        {popularSearches.slice(0, 5).map((popular, index) => (
                          <CommandItem key={index} onSelect={() => handleSuggestionClick(popular.query)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            {popular.query}
                            <Badge variant="outline" className="ml-auto">
                              {popular.count}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}

                {!loading && query.trim() !== "" && (
                  <>
                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <CommandGroup heading="Gợi ý">
                        {suggestions.map((suggestion, index) => (
                          <CommandItem key={index} onSelect={() => handleSuggestionClick(suggestion)}>
                            <Search className="mr-2 h-4 w-4" />
                            {suggestion}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Search Results */}
                    {results.length > 0 && (
                      <CommandGroup heading={`Kết quả (${results.length})`}>
                        {results.slice(0, 10).map((result) => (
                          <CommandItem key={`${result.type}-${result.id}`} onSelect={() => handleResultClick(result)}>
                            <div className="flex items-center space-x-3 w-full">
                              {getResultIcon(result.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium truncate">{result.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getTypeLabel(result.type)}
                                  </Badge>
                                </div>
                                {result.subtitle && (
                                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                                )}
                                {result.description && (
                                  <div className="text-xs text-gray-400 truncate">{result.description}</div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {results.length === 0 && !loading && (
                      <CommandEmpty>Không tìm thấy kết quả nào cho "{query}"</CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>

            {/* Facets */}
            {Object.keys(facets).length > 0 && (
              <div className="border-t p-3">
                <div className="text-sm font-medium mb-2">Lọc theo:</div>
                <div className="space-y-2">
                  {Object.entries(facets).map(([key, values]) => (
                    <div key={key}>
                      <div className="text-xs text-gray-500 mb-1 capitalize">{key}</div>
                      <div className="flex flex-wrap gap-1">
                        {values.slice(0, 5).map((facet) => (
                          <Badge
                            key={facet.value}
                            variant="outline"
                            className="text-xs cursor-pointer"
                            onClick={() => {
                              const currentValues = (filters[key as keyof SearchFilters] as string[]) || []
                              const newValues = currentValues.includes(facet.value)
                                ? currentValues.filter((v) => v !== facet.value)
                                : [...currentValues, facet.value]
                              setFilters({ ...filters, [key]: newValues })
                            }}
                          >
                            {facet.value} ({facet.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
