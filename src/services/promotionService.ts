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
          promo_type: promotionData.promo_type,
          promo_type_target_id: promotionData.promo_type_target_id,
          discount_type: promotionData.discount_type,
          code: promotionData.code,
          frequency: promotionData.frequency || 'once',
          frequency_value: {},
          mode: promotionData.mode,
          mode_value: promotionData.mode_value,
          valid_until: promotionData.valid_until,
          is_active: true,
          is_limited: false,
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
      return
    }
    return promotionInserted
  },
  deletePromotion: async (id: number) => {
    console.log('Deleting promotion with ID:', id)
    const { error } = await supabase.from('promos').delete().eq('id', id)
    if (error) {
      console.error('Error deleting promotion:', error)
    }
  }
}
