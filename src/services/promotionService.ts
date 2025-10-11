import supabase from '../lib/supabase'
import type { Promotions } from '../schemas/promotions.schema'

export const promotionsService = {
  fetchPromotion: async () => {
    const { data: promotions, error } = await supabase.from('promos').select('*')
    if (error) {
      console.error('Error fetching prpmotions:', error)
    }
    return promotions
  },
  createPromotion: async (promotionsData: Promotions) => {
    const { data: promotionInserted, error: promotionError } = await supabase
      .from('promos')
      .insert([
        {
          promo_type: promotionsData.promo_type,
          category: promotionsData.category,
          subcategory: promotionsData.subcategory,
          products: promotionsData.products,
          discount_type: promotionsData.discount_type,
          frequency: promotionsData.frequency,
          date: promotionsData.date,
          week_days: promotionsData.week_days,
          day_month: promotionsData.day_month,
          code: promotionsData.code,
          mode: promotionsData.mode,
          mode_value: promotionsData.mode_value,
          valid_until: promotionsData.valid_until,
          limit: promotionsData.limit,
          condition: promotionsData.condition,
          is_active: true
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
