import { toRecord } from './helpers'

export const userProfiles = [
  { key: 'admin', label: 'Administrador' },
  { key: 'staff', label: 'Staff' },
  { key: 'customer', label: 'Cliente' }
]
export type UserProfile = (typeof userProfiles)[number]['key']
export const userProfileMap = toRecord(userProfiles)
