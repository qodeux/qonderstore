import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '../../schemas/products.schema'

export type ProductBrand = {
  id: string
  name: string
  logo: string | null
}

interface ProductsState {
  items: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: string | null
  isEditing: boolean
  brands: ProductBrand[]
}

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  isEditing: false,
  loading: false,
  error: null,
  brands: []
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
    },
    setProductBrands(state, action: PayloadAction<ProductBrand[]>) {
      state.brands = action.payload
      state.loading = false
      state.error = null
    }
  }
})

export const { setProducts, setSelectedProduct, setProductBrands } = productsSlice.actions

export default productsSlice.reducer
