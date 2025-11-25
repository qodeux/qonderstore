import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Brand } from '../../schemas/brand.schema'
import type { Product } from '../../schemas/products.schema'
import type { ProductRating } from '../../schemas/storeOrders.schema'
import type { SaleType } from '../../types/products'

export type ProductsState = {
  items: Product[]
  selectedProduct: Product | null
  selectedBrand?: Brand | null
  saleType: SaleType | null
  loading: boolean
  error: string | null
  isEditing: boolean
  brands: Brand[]
  productRatings?: ProductRating[]
}

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  saleType: null,
  isEditing: false,
  loading: false,
  error: null,
  brands: []
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setEditMode(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload
    },
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload
      state.loading = false
      state.error = null
    },
    setSelectedProduct(state, action: PayloadAction<number | null>) {
      state.selectedProduct = state.items.find((item) => item.id === action.payload) || null
      state.loading = false
      state.error = null
    },
    setSaleType(state, action: PayloadAction<SaleType | null>) {
      state.saleType = action.payload
    },
    setProductBrands(state, action: PayloadAction<Brand[]>) {
      state.brands = action.payload
      state.loading = false
      state.error = null
    },
    setSelectedBrand(state, action: PayloadAction<number | null>) {
      state.selectedBrand = state.brands.find((brand) => brand.id === action.payload) || null
      state.loading = false
      state.error = null
    },
    setProductRatings(state, action: PayloadAction<ProductRating[]>) {
      state.productRatings = action.payload
      state.loading = false
      state.error = null
    }
  }
})

export const { setProducts, setSelectedProduct, setProductBrands, setEditMode, setSaleType, setSelectedBrand, setProductRatings } =
  productsSlice.actions
export default productsSlice.reducer
