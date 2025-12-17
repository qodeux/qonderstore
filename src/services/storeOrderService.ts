import supabase from '../lib/supabase'
import type { CheckoutFormInput } from '../schemas/checkout.schema'
import type { ProductRating, StoreOrderRating } from '../schemas/storeOrders.schema'
import type { OrderItem } from '../types/storeOrders'

export type Metadata = {
  ip: string
  user_agent: string
}

export type CreateOrderParams = {
  orderData: CheckoutFormInput
  items: OrderItem[]
  metadata: Metadata
  userId?: string
  cartTotals?: {
    totalPrice: number
    totalQuantity: number
    shippingPrice: number
  }
}

export const storeOrderService = {
  fetchStoreOrders: async () => {
    const { data, error } = await supabase.from('store_orders_view').select('*')
    if (error) {
      console.error('Error fetching orders:', error)
      return { error }
    }
    return { data }
  },
  createOrder: async ({ orderData, items, cartTotals, metadata, userId }: CreateOrderParams) => {
    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as K))) as Omit<T, K>
    }

    const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0]

    const orderReduced = omit(orderData, ['postal_code_lookup', 'state', 'locality'])

    const mappedOrderData = {
      ...orderReduced,
      delivery_date:
        orderReduced.delivery_date === 'today'
          ? toYYYYMMDD(new Date()) // hoy en YYYY-MM-DD
          : toYYYYMMDD(new Date(Date.now() + 24 * 60 * 60 * 1000)) // mañana en YYYY-MM-DD
    }

    const mappedItems = items.map((item) => ({
      id: item.id,
      quantity: Number(item.quantity ?? 1),
      saleType: item.saleType,
      unitSelected: item.unitSelected ?? null,

      price: Number(item.price ?? 0), // subtotal final línea
      discount: Number(item.discount ?? 0), // descuento total línea

      title: item.title,
      image: item.image ?? null,
      base_unit: item.base_unit ?? null
    }))

    const itemsTotal = mappedItems.reduce((sum, it) => sum + (it.price ?? 0), 0)

    const mappedCartTotals = cartTotals
      ? {
          total_price: itemsTotal,
          total_items: mappedItems.length,
          shipping_price: cartTotals.shippingPrice,
          order_total: itemsTotal + cartTotals.shippingPrice
        }
      : undefined

    // const insertData = {
    //   orderData: mappedOrderData,
    //   items: mappedItems,
    //   metadata,
    //   user_id: userId,
    //   cart_totals: mappedCartTotals
    // }

    const insertData = {
      ...mappedOrderData,
      items: mappedItems,
      ...metadata,
      user_id: userId,
      ...mappedCartTotals
    }

    console.log(insertData)

    const { data, error } = await supabase.from('store_orders').insert(insertData).select().single()
    if (error) {
      throw new Error('Error creating order: ' + error.message)
    }
    return data
  },
  getShippingPrice: async (sublocality: number) => {
    const { data, error } = await supabase.from('shipping_prices').select('*').eq('sublocality', sublocality).single()
    if (error) {
      console.error('Error fetching shipping price:', error)
      return { error }
    }
    return { data }
  },
  addShippingPrice: async (postalCode: string, sublocality: number, shipping_price: number) => {
    const { data, error } = await supabase.from('shipping_prices').insert({ cp: postalCode, sublocality, shipping_price }).select().single()
    if (error) {
      console.error('Error adding shipping price:', error)
      return { error }
    }
    return { data }
  },
  async getSublocalityData(sublocalityId: number) {
    const { data, error } = await supabase.from('cp_mexico').select('*').eq('id', sublocalityId).single()
    if (error) {
      console.error('Error fetching sublocality data:', error)
      return { error }
    }
    return { data }
  },
  async updateOrderStatus(orderId: string, status: string) {
    const updateData = { order_status: status, shipment_status: status === 'credited' ? 'pending' : undefined }

    const { data, error } = await supabase.from('store_orders').update(updateData).eq('id', orderId)
    if (error) {
      console.error('Error updating order status:', error)
      return { error }
    }
    return { data }
  },
  async upsertPayment(payload: {
    order_id: string
    payment_proof?: string
    confirm_proof?: string
    status: string
    amount?: number
    reference?: string
  }) {
    let upsertData

    switch (payload.status) {
      case 'credited':
        upsertData = {
          order_id: payload.order_id,
          payment_file_key: payload.payment_proof,
          confirmation_file_key: payload.confirm_proof,
          reference: payload.reference,
          amount: payload.amount,
          last_update: new Date().toISOString()
        }
        break
      default:
        upsertData = {
          order_id: payload.order_id,
          amount: payload.amount,
          payment_file_key: payload.payment_proof
        }
        break
    }

    const { data, error } = await supabase.from('payments_received').upsert(upsertData).select().single()
    if (error) {
      console.error('Error registering payment proof:', error)
      throw { error }
    }

    const { error: statusError } = await this.updateOrderStatus(payload.order_id, payload.status)
    if (statusError) {
      console.error('Error updating order status to paid:', statusError)
      throw { statusError }
    }

    return { data }
  },
  createOrderRating: async (payload: StoreOrderRating) => {
    const { data, error } = await supabase.from('store_order_ratings').insert(payload).select().single()
    if (error) {
      console.error('Error creating order rating:', error)
      throw { error }
    }
    return { data }
  },
  createProductRating: async (payload: ProductRating) => {
    const { data, error } = await supabase.from('product_ratings').insert(payload).select().single()
    if (error) {
      console.error('Error creating product rating:', error)
      throw { error }
    }
    return { data }
  }
}
