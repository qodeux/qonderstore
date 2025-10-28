import { toRecord } from './helpers'

export const request_status = [
  { key: 'accepted', label: 'Aceptado', color: 'success' },
  { key: 'rejected', label: 'Rechazado', color: 'danger' },
  { key: 'pending', label: 'Pendiente', color: 'primary' },
  { key: 'deleted', label: 'Eliminado', color: 'danger' }
] as const

export type RequestStatus = (typeof request_status)[number]['key']
export const requestStatusMap = toRecord(request_status)
