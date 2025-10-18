import supabase from '../lib/supabase'
import type { PromotionsInput } from '../schemas/promotions.schema'

export const promotionsService = {
  fetchPromotion: async () => {
    const { data: promotions, error } = await supabase.from('promos').select('*')
    if (error) {
      console.error('Error fetching prpmotions:', error)
    }
    return promotions
  },
  createPromotion: async (promotionsData: PromotionsInput) => {
    const { data: promotionInserted, error: promotionError } = await supabase
      .from('promos')
      .insert([
        {
          promo_type: promotionsData.promo_type,
          promo_type_target_id: promotionsData.promo_type_target_id,
          discount_type: promotionsData.discount_type,
          code: promotionsData.code,
          frequency: promotionsData.frequency || 'once',
          frequency_value: {},
          mode: promotionsData.mode,
          mode_value: promotionsData.mode_value,
          valid_until: promotionsData.valid_until,
          is_active: true,
          is_limited: false,
          limit_type: promotionsData.limit_type,
          limit: promotionsData.limit,
          is_conditioned: promotionsData.is_conditioned,
          condition_type: promotionsData.condition_type,
          condition: promotionsData.condition,
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
  deletePromotion: async (promoID: string) => {
    console.log('Deleting promotion with ID:', promoID)
    const { error } = await supabase.from('promos').delete().eq('id', promoID)
    if (error) {
      console.error('Error deleting promotion:', error)
    }
  }
}
