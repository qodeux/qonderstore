import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Promotion } from '../../schemas/promotions.schema'

interface promotionState {
  isEditing: boolean
  loading: boolean
  error: string | null
  selectedPromotion: Promotion | null
  items: Promotion[]
}

const initialState: promotionState = {
  isEditing: false,
  loading: false,
  error: null,
  selectedPromotion: null,
  items: []
}

const promotionSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    setIsEditing(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload
    },
    setPromotions(state, action) {
      state.items = action.payload
    },
    setSelectedPromotion(state, action: PayloadAction<number>) {
      state.selectedPromotion = state.items.find((item) => item.id === action.payload) || null
    }
  }
})
export const { setIsEditing, setPromotions, setSelectedPromotion } = promotionSlice.actions

export default promotionSlice.reducer
