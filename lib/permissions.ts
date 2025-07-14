// Role-based permissions system
export interface Permission {
  resource: string
  action: string
}

export interface Role {
  name: string
  permissions: Permission[]
}

// Define permissions
export const PERMISSIONS = {
  // User management
  USERS_VIEW: { resource: "users", action: "view" },
  USERS_CREATE: { resource: "users", action: "create" },
  USERS_UPDATE: { resource: "users", action: "update" },
  USERS_DELETE: { resource: "users", action: "delete" },

  // Covid people management
  COVID_PEOPLE_VIEW: { resource: "covid_people", action: "view" },
  COVID_PEOPLE_CREATE: { resource: "covid_people", action: "create" },
  COVID_PEOPLE_UPDATE: { resource: "covid_people", action: "update" },
  COVID_PEOPLE_DELETE: { resource: "covid_people", action: "delete" },

  // Products management
  PRODUCTS_VIEW: { resource: "products", action: "view" },
  PRODUCTS_CREATE: { resource: "products", action: "create" },
  PRODUCTS_UPDATE: { resource: "products", action: "update" },
  PRODUCTS_DELETE: { resource: "products", action: "delete" },

  // Packages management
  PACKAGES_VIEW: { resource: "packages", action: "view" },
  PACKAGES_CREATE: { resource: "packages", action: "create" },
  PACKAGES_UPDATE: { resource: "packages", action: "update" },
  PACKAGES_DELETE: { resource: "packages", action: "delete" },

  // Orders management
  ORDERS_VIEW: { resource: "orders", action: "view" },
  ORDERS_CREATE: { resource: "orders", action: "create" },
  ORDERS_UPDATE: { resource: "orders", action: "update" },
  ORDERS_DELETE: { resource: "orders", action: "delete" },

  // Payment management
  PAYMENTS_VIEW: { resource: "payments", action: "view" },
  PAYMENTS_CREATE: { resource: "payments", action: "create" },
  PAYMENTS_UPDATE: { resource: "payments", action: "update" },

  // Statistics and reports
  STATISTICS_VIEW: { resource: "statistics", action: "view" },
  REPORTS_VIEW: { resource: "reports", action: "view" },
  REPORTS_EXPORT: { resource: "reports", action: "export" },

  // System settings
  SETTINGS_VIEW: { resource: "settings", action: "view" },
  SETTINGS_UPDATE: { resource: "settings", action: "update" },

  // Treatment locations
  LOCATIONS_VIEW: { resource: "locations", action: "view" },
  LOCATIONS_CREATE: { resource: "locations", action: "create" },
  LOCATIONS_UPDATE: { resource: "locations", action: "update" },
  LOCATIONS_DELETE: { resource: "locations", action: "delete" },
} as const

// Define roles with their permissions
export const ROLES: Record<string, Role> = {
  admin: {
    name: "admin",
    permissions: Object.values(PERMISSIONS),
  },
  manager: {
    name: "manager",
    permissions: [
      PERMISSIONS.COVID_PEOPLE_VIEW,
      PERMISSIONS.COVID_PEOPLE_CREATE,
      PERMISSIONS.COVID_PEOPLE_UPDATE,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.PACKAGES_VIEW,
      PERMISSIONS.PACKAGES_CREATE,
      PERMISSIONS.PACKAGES_UPDATE,
      PERMISSIONS.PACKAGES_DELETE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.STATISTICS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.LOCATIONS_VIEW,
    ],
  },
  user: {
    name: "user",
    permissions: [
      PERMISSIONS.PACKAGES_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_CREATE,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.PAYMENTS_CREATE,
    ],
  },
}

// Check if user has permission
export function hasPermission(userRole: string, permission: Permission): boolean {
  const role = ROLES[userRole]
  if (!role) return false

  return role.permissions.some((p) => p.resource === permission.resource && p.action === permission.action)
}

// Check multiple permissions (user must have ALL)
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

// Check multiple permissions (user must have ANY)
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

// Get all permissions for a role
export function getRolePermissions(userRole: string): Permission[] {
  const role = ROLES[userRole]
  return role ? role.permissions : []
}
