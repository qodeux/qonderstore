import { createSlice } from '@reduxjs/toolkit'
import type { Category } from '../../schemas/category.schema'

export type CategoriesState = {
  isEditing: boolean
  selectedCategory?: Category | null
  items: Category[]
}

const initialState: CategoriesState = {
  isEditing: false,
  selectedCategory: null,
  items: []
}

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setEditMode(state, action) {
      state.isEditing = action.payload
      if (!action.payload) {
        state.selectedCategory = null
      }
    },
    setCategories(state, action) {
      state.items = action.payload
    },

    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload
    }
  }
})
export const { setEditMode, setSelectedCategory, setCategories } = categorySlice.actions

export default categorySlice.reducer
