import { toRecord } from './helpers'

export const request_status = [
  { key: 'accepted', label: 'Aceptado' },
  { key: 'rejected', label: 'Rechazado' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'deleted', label: 'Eliminado' }
] as const

export type RequestStatus = (typeof request_status)[number]['key']
export const requestStatusMap = toRecord(request_status)
