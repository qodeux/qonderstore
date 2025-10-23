import { toRecord } from './helpers'

export const userRoles = [
  { key: 'admin', label: 'Administrador' },
  { key: 'staff', label: 'Staff' },
  { key: 'customer', label: 'Cliente' }
]
export type UserRole = (typeof userRoles)[number]['key']
export const userRoleMap = toRecord(userRoles)
