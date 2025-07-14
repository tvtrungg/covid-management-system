import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface SearchResult {
  id: number
  type: "person" | "product" | "package" | "order" | "location"
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: any
  relevance?: number
}

export interface SearchFilters {
  types?: string[]
  dateRange?: {
    start: string
    end: string
  }
  status?: string[]
  provinces?: number[]
  districts?: number[]
  priceRange?: {
    min: number
    max: number
  }
  categories?: string[]
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: "relevance" | "date" | "name"
  sortOrder?: "asc" | "desc"
}

export class SearchService {
  // Global search across all entities
  async globalSearch(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
    userId?: number,
  ): Promise<{
    results: SearchResult[]
    total: number
    suggestions: string[]
    facets: Record<string, { value: string; count: number }[]>
  }> {
    const { limit = 20, offset = 0, sortBy = "relevance" } = options

    // Save search history
    if (userId && query.trim()) {
      await this.saveSearchHistory(userId, query, filters)
    }

    const results: SearchResult[] = []
    let total = 0

    // Search in different entities based on filters
    const searchPromises = []

    if (!filters.types || filters.types.includes("person")) {
      searchPromises.push(this.searchPeople(query, filters, options))
    }

    if (!filters.types || filters.types.includes("product")) {
      searchPromises.push(this.searchProducts(query, filters, options))
    }

    if (!filters.types || filters.types.includes("package")) {
      searchPromises.push(this.searchPackages(query, filters, options))
    }

    if (!filters.types || filters.types.includes("order")) {
      searchPromises.push(this.searchOrders(query, filters, options))
    }

    if (!filters.types || filters.types.includes("location")) {
      searchPromises.push(this.searchLocations(query, filters, options))
    }

    const searchResults = await Promise.all(searchPromises)

    // Combine and sort results
    searchResults.forEach((typeResults) => {
      results.push(...typeResults.results)
      total += typeResults.total
    })

    // Sort by relevance or other criteria
    results.sort((a, b) => {
      if (sortBy === "relevance") {
        return (b.relevance || 0) - (a.relevance || 0)
      } else if (sortBy === "date") {
        return new Date(b.metadata?.created_at || 0).getTime() - new Date(a.metadata?.created_at || 0).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit)

    // Generate suggestions and facets
    const suggestions = await this.generateSuggestions(query)
    const facets = await this.generateFacets(query, filters)

    return {
      results: paginatedResults,
      total,
      suggestions,
      facets,
    }
  }

  // Search people
  private async searchPeople(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    let dbQuery = supabase.from("covid_people").select(
      `
        *,
        provinces(name),
        districts(name),
        wards(name),
        treatment_locations(name)
      `,
      { count: "exact" },
    )

    // Full-text search
    if (query.trim()) {
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,id_number.ilike.%${query}%`)
    }

    // Apply filters
    if (filters.status?.length) {
      dbQuery = dbQuery.in("status", filters.status)
    }

    if (filters.provinces?.length) {
      dbQuery = dbQuery.in("province_id", filters.provinces)
    }

    if (filters.districts?.length) {
      dbQuery = dbQuery.in("district_id", filters.districts)
    }

    if (filters.dateRange) {
      dbQuery = dbQuery.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const results: SearchResult[] =
      data?.map((person) => ({
        id: person.id,
        type: "person" as const,
        title: person.full_name,
        subtitle: `${person.id_number} - ${person.status}`,
        description: `${person.provinces?.name}, ${person.districts?.name}`,
        url: `/manager/people/${person.id}`,
        metadata: person,
        relevance: this.calculateRelevance(query, [person.full_name, person.id_number]),
      })) || []

    return { results, total: count || 0 }
  }

  // Search products
  private async searchProducts(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    let dbQuery = supabase.from("products").select("*", { count: "exact" })

    if (query.trim()) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }

    if (filters.priceRange) {
      dbQuery = dbQuery.gte("price", filters.priceRange.min).lte("price", filters.priceRange.max)
    }

    if (filters.dateRange) {
      dbQuery = dbQuery.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const results: SearchResult[] =
      data?.map((product) => ({
        id: product.id,
        type: "product" as const,
        title: product.name,
        subtitle: `${product.price.toLocaleString("vi-VN")} VNĐ/${product.unit}`,
        description: `Sản phẩm nhu yếu phẩm`,
        url: `/manager/products/${product.id}`,
        metadata: product,
        relevance: this.calculateRelevance(query, [product.name]),
      })) || []

    return { results, total: count || 0 }
  }

  // Search packages
  private async searchPackages(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    let dbQuery = supabase.from("packages").select("*", { count: "exact" })

    if (query.trim()) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }

    if (filters.dateRange) {
      dbQuery = dbQuery.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const results: SearchResult[] =
      data?.map((pkg) => ({
        id: pkg.id,
        type: "package" as const,
        title: pkg.name,
        subtitle: `Giới hạn: ${pkg.limit_per_person} gói/${pkg.time_limit_value} ${pkg.time_limit_type}`,
        description: `Gói nhu yếu phẩm`,
        url: `/manager/packages/${pkg.id}`,
        metadata: pkg,
        relevance: this.calculateRelevance(query, [pkg.name]),
      })) || []

    return { results, total: count || 0 }
  }

  // Search orders
  private async searchOrders(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    let dbQuery = supabase.from("orders").select(
      `
        *,
        covid_people(full_name, id_number),
        packages(name)
      `,
      { count: "exact" },
    )

    if (query.trim()) {
      // Search by order ID or customer name
      dbQuery = dbQuery.or(`id.eq.${query},covid_people.full_name.ilike.%${query}%`)
    }

    if (filters.status?.length) {
      dbQuery = dbQuery.in("status", filters.status)
    }

    if (filters.dateRange) {
      dbQuery = dbQuery.gte("created_at", filters.dateRange.start).lte("created_at", filters.dateRange.end)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const results: SearchResult[] =
      data?.map((order) => ({
        id: order.id,
        type: "order" as const,
        title: `Đơn hàng #${order.id}`,
        subtitle: `${order.covid_people?.full_name} - ${order.total_amount.toLocaleString("vi-VN")} VNĐ`,
        description: `${order.packages?.name} - ${order.status}`,
        url: `/manager/orders/${order.id}`,
        metadata: order,
        relevance: this.calculateRelevance(query, [order.id.toString(), order.covid_people?.full_name || ""]),
      })) || []

    return { results, total: count || 0 }
  }

  // Search locations
  private async searchLocations(
    query: string,
    filters: SearchFilters,
    options: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    let dbQuery = supabase.from("treatment_locations").select("*", { count: "exact" })

    if (query.trim()) {
      dbQuery = dbQuery.ilike("name", `%${query}%`)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    const results: SearchResult[] =
      data?.map((location) => ({
        id: location.id,
        type: "location" as const,
        title: location.name,
        subtitle: `${location.current_count}/${location.capacity} - ${((location.current_count / location.capacity) * 100).toFixed(1)}%`,
        description: `Địa điểm điều trị/cách ly`,
        url: `/admin/locations/${location.id}`,
        metadata: location,
        relevance: this.calculateRelevance(query, [location.name]),
      })) || []

    return { results, total: count || 0 }
  }

  // Calculate relevance score
  private calculateRelevance(query: string, fields: string[]): number {
    if (!query.trim()) return 0

    const queryLower = query.toLowerCase()
    let score = 0

    fields.forEach((field) => {
      if (!field) return

      const fieldLower = field.toLowerCase()

      // Exact match gets highest score
      if (fieldLower === queryLower) {
        score += 100
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(queryLower)) {
        score += 80
      }
      // Contains query gets medium score
      else if (fieldLower.includes(queryLower)) {
        score += 50
      }
      // Fuzzy match gets low score
      else if (this.fuzzyMatch(queryLower, fieldLower)) {
        score += 20
      }
    })

    return score
  }

  // Simple fuzzy matching
  private fuzzyMatch(query: string, text: string): boolean {
    const queryChars = query.split("")
    let textIndex = 0

    for (const char of queryChars) {
      const foundIndex = text.indexOf(char, textIndex)
      if (foundIndex === -1) return false
      textIndex = foundIndex + 1
    }

    return true
  }

  // Generate search suggestions
  private async generateSuggestions(query: string): Promise<string[]> {
    if (!query.trim() || query.length < 2) return []

    const suggestions = new Set<string>()

    // Get suggestions from search history
    const { data: history } = await supabase
      .from("search_history")
      .select("query")
      .ilike("query", `%${query}%`)
      .limit(5)

    history?.forEach((item) => suggestions.add(item.query))

    // Get suggestions from entity names
    const { data: people } = await supabase
      .from("covid_people")
      .select("full_name")
      .ilike("full_name", `%${query}%`)
      .limit(3)

    people?.forEach((person) => suggestions.add(person.full_name))

    const { data: products } = await supabase.from("products").select("name").ilike("name", `%${query}%`).limit(3)

    products?.forEach((product) => suggestions.add(product.name))

    return Array.from(suggestions).slice(0, 8)
  }

  // Generate search facets
  private async generateFacets(
    query: string,
    filters: SearchFilters,
  ): Promise<Record<string, { value: string; count: number }[]>> {
    const facets: Record<string, { value: string; count: number }[]> = {}

    // Status facets
    const { data: statusCounts } = await supabase.from("covid_people").select("status").ilike("full_name", `%${query}%`)

    if (statusCounts) {
      const statusFacets = statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      facets.status = Object.entries(statusFacets).map(([value, count]) => ({ value, count }))
    }

    // Province facets
    const { data: provinceCounts } = await supabase
      .from("covid_people")
      .select("province_id, provinces(name)")
      .ilike("full_name", `%${query}%`)

    if (provinceCounts) {
      const provinceFacets = provinceCounts.reduce(
        (acc, item) => {
          const name = item.provinces?.name || "Unknown"
          acc[name] = (acc[name] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      facets.province = Object.entries(provinceFacets).map(([value, count]) => ({ value, count }))
    }

    return facets
  }

  // Save search history
  private async saveSearchHistory(userId: number, query: string, filters: SearchFilters): Promise<void> {
    try {
      await supabase.from("search_history").insert({
        user_id: userId,
        query: query.trim(),
        filters,
        results_count: 0, // Will be updated after search
      })
    } catch (error) {
      console.error("Failed to save search history:", error)
    }
  }

  // Get search history for user
  async getSearchHistory(userId: number, limit = 10): Promise<string[]> {
    const { data, error } = await supabase
      .from("search_history")
      .select("query")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return data?.map((item) => item.query) || []
  }

  // Get popular searches
  async getPopularSearches(limit = 10): Promise<{ query: string; count: number }[]> {
    const { data, error } = await supabase
      .from("search_history")
      .select("query")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

    if (error) throw error

    const queryCounts = data?.reduce(
      (acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(queryCounts || {})
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

export const searchService = new SearchService()
