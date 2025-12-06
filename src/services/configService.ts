import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { InputPaymentMethod } from '../schemas/config.schema'

export const configService = {
  createPaymentMethod: async (paymentMethodData: InputPaymentMethod) => {
    try {
      const { data, error } = await supabase
        .from('config')
        .insert([
          {
            module: 'payment_methods',
            data: paymentMethodData
          }
        ])
        .select()
        .single()

      if (error) {
        throw error
      }
      return data
    } catch (error) {
      console.error('Error inserting payment method:', error)
      //return null
    }
  },
  deletePaymentMethod: async (id: number) => {
    const { error } = await supabase.from('config').delete().eq('id', id)
    if (error) {
      console.error('Error deleting payment method:', error)
      return
    }

    setTimeout(() => {
      addToast({
        title: 'Método de pago eliminado',
        description: `El método de pago ha sido eliminado.`,
        color: 'danger',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)
  },
  updatePaymentMethod: async (payload: InputPaymentMethod) => {
    if (!payload.id) {
      console.error('El id del método de pago es obligatorio para actualizar')
      return
    }

    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as K))) as Omit<T, K>
    }

    const accountData = omit(payload, ['id'])

    const { data, error } = await supabase
      .from('config')
      .update({
        data: accountData,
        last_update: new Date().toISOString()
      })
      .eq('id', payload.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment method:', error)
      return
    }
    return data
  }
}
