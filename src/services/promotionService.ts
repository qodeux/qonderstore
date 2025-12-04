import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { PromotionsInput } from '../schemas/promotions.schema'

export const promotionService = {
  fetchPromotion: async () => {
    const { data: promotions, error } = await supabase.from('promos').select('*')
    if (error) {
      console.error('Error fetching prpmotions:', error)
    }
    return promotions
  },
  createPromotion: async (promotionData: PromotionsInput) => {
    const { data: promotionInserted, error: promotionError } = await supabase
      .from('promos')
      .insert([
        {
          name: promotionData.name,
          promo_type: promotionData.promo_type,
          promo_type_target_id: promotionData.promo_type_target_id,
          discount_type: promotionData.discount_type,
          code: promotionData.code,
          frequency: promotionData.frequency || 'once',
          frequency_value: promotionData.frequency_value,
          mode: promotionData.mode,
          mode_value: promotionData.mode_value,
          valid_until: promotionData.valid_until,
          is_active: promotionData.is_active,
          is_limited: promotionData.is_limited,
          limit_type: promotionData.limit_type,
          limit: promotionData.limit,
          is_conditioned: promotionData.is_conditioned,
          condition_type: promotionData.condition_type,
          condition: promotionData.condition,
          condition_product: null
        }
      ])
      .select()
      .single()

    if (promotionError) {
      console.error('Error inserting promotion:', promotionError)
      return { error: promotionError }
    }

    setTimeout(() => {
      addToast({
        title: 'Promoción agregada',
        description: `La promoción ${promotionInserted.name} ha sido agregada correctamente.`,
        color: 'success',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return promotionInserted
  },
  updatePromotion: async (id: number, payload: PromotionsInput) => {
    if (!id) return

    const { data: promoUpdated, error: promotionError } = await supabase
      .from('promos')
      .update({
        name: payload.name,
        promo_type: payload.promo_type,
        promo_type_target_id: payload.promo_type_target_id,
        product_unit: payload.product_unit,
        discount_type: payload.discount_type,
        code: payload.code,
        frequency: payload.frequency,
        frequency_value: payload.frequency_value,
        mode: payload.mode,
        mode_value: payload.mode_value,
        valid_until: payload.valid_until,
        is_active: payload.is_active,
        is_limited: payload.is_limited,
        limit_type: payload.limit_type,
        limit: payload.limit,
        is_conditioned: payload.is_conditioned,
        condition_type: payload.condition_type,
        condition: payload.condition,
        condition_product: null
      })
      .eq('id', id)
      .select()
      .single()

    if (promotionError) {
      console.error('Error actualizando la promocion', promotionError)
      return { error: promotionError }
    }

    setTimeout(() => {
      addToast({
        title: 'Promoción actualizada',
        description: `La promoción ${promoUpdated.name} ha sido actualizada correctamente.`,
        color: 'primary',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return promoUpdated
  },
  deletePromotion: async (id: number) => {
    console.log('Deleting promotion with ID:', id)
    const { error } = await supabase.from('promos').delete().eq('id', id)
    if (error) {
      console.error('Error deleting promotion:', error)
    }

    setTimeout(() => {
      addToast({
        title: 'Promoción eliminada',
        description: `La promoción ha sido eliminada correctamente.`,
        color: 'danger',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)
  }
}
