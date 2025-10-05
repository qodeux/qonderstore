import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '../../schemas/products.schema'

interface ProductsState {
  items: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: string | null
  isEditing: boolean
}

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  isEditing: false,
  loading: false,
  error: null
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload
      state.loading = false
      state.error = null
    }
  }
})

export const { setProducts, setSelectedProduct } = productsSlice.actions

export default productsSlice.reducer
