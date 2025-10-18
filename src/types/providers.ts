export type supplyOrderStatus = 'pending' | 'completed' | 'canceled'

export type FormDataType = {
  items?: Record<string, { qty?: string } | undefined>
}

export type SupplyFormUpdate = {
  order: number
  items?: Record<string, { qty?: string } | undefined>
}

export interface OrderItem {
  id: number
  qty: number
}

export type OrderItemReceived = Omit<OrderItem, 'qty'> & {
  qty_received: number
}

export interface SupplyOrder {
  id: number
  provider_id: number
  provider_name: string
  items: OrderItem[]
  created_at: string
  status: supplyOrderStatus
  lastPayment?: string | null
}

export type SupplyOrderInputCreate = Omit<SupplyOrder, 'id' | 'created_at' | 'lastPayment' | 'status'>
export type SupplyOrderInputUpdate = Partial<SupplyOrderInputCreate> & { id: number }
