import supabase from '../lib/supabase'
import type { ConfigDB } from '../schemas/config.schema'

export const configService = {
  createPaymentMethod: async (paymentMethodData: ConfigDB) => {
    const { data: paymentMethodInserted, error: paymentMethodError } = await supabase.from('config').insert([
      {
        type: paymentMethodData.data.type,
        bank: paymentMethodData.data.bank,
        account: paymentMethodData.data.account,
        holder_name: paymentMethodData.data.holder_name
      }
    ])

    if (paymentMethodError) {
      console.error('Error inserting payment method:', paymentMethodError)
      return { error: paymentMethodError }
    }
    return paymentMethodInserted
  },
  updatePaymentMethod: async (paymentMethodData: ConfigDB) => {
    if (!paymentMethodData.id) {
      console.error('El id del método de pago es obligatorio para actualizar')
      return
    }
    const { data: paymentMethodUpdated, error: paymentMethodError } = await supabase
      .from('config')
      .update({
        type: paymentMethodData.data.type,
        bank: paymentMethodData.data.bank,
        account: paymentMethodData.data.account,
        holder_name: paymentMethodData.data.holder_name,
        last_update: new Date().toISOString()
      })
      .eq('id', paymentMethodData.id)
      .select()
      .single()
    if (paymentMethodError) {
      console.error('Error updating payment method:', paymentMethodError)
      return
    }
    return paymentMethodUpdated
  }
}
