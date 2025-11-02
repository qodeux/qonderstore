// store/slices/catalogFiltersSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ProductTypeTag = 'new' | 'sale' | 'featured' | 'popular'
export type SortBy = 'relevance' | 'price' | 'name' | 'newest' | 'discount' | 'popularity' | 'rating'
export type SortDir = 'asc' | 'desc'

export type ProductFiltersState = {
  // UI
  query: string
  // filtros
  types: ProductTypeTag[] // ['new','sale',...]
  categorySlugs: string[] // e.g. ['gomitas','flores']
  brandIds: number[] // e.g. [3,5]
  priceMin: number | null // null = sin mínimo
  priceMax: number | null // null = sin máximo
  // ordenamiento
  sortBy: SortBy
  sortDir: SortDir
}

const initialState: ProductFiltersState = {
  query: '',
  types: [],
  categorySlugs: [],
  brandIds: [],
  priceMin: null,
  priceMax: null,
  sortBy: 'relevance',
  sortDir: 'desc'
}

const productFiltersSlice = createSlice({
  name: 'productFilters',
  initialState,
  reducers: {
    setQuery: (state, a: PayloadAction<string>) => {
      state.query = a.payload.trim()
    },
    setTypes: (state, a: PayloadAction<ProductTypeTag[]>) => {
      state.types = a.payload
    },
    clearTypes: (state) => {
      state.types = []
    },
    setCategorySlugs: (state, a: PayloadAction<string[]>) => {
      state.categorySlugs = a.payload
    },
    clearCategorySlugs: (state) => {
      state.categorySlugs = []
    },
    setBrandIds: (state, a: PayloadAction<number[]>) => {
      state.brandIds = a.payload
    },
    clearBrandIds: (state) => {
      state.brandIds = []
    },
    setPriceRange: (state, a: PayloadAction<{ min: number | null; max: number | null }>) => {
      state.priceMin = a.payload.min
      state.priceMax = a.payload.max
    },

    setSort: (state, a: PayloadAction<{ by: SortBy; dir?: SortDir }>) => {
      state.sortBy = a.payload.by
      if (a.payload.dir) state.sortDir = a.payload.dir
      // defaults útiles
      if (a.payload.by === 'price' && !a.payload.dir) state.sortDir = 'asc'
      if (a.payload.by === 'popularity' && !a.payload.dir) state.sortDir = 'desc'
      if (a.payload.by === 'rating' && !a.payload.dir) state.sortDir = 'desc'
    },
    resetFilters: () => initialState
  }
})

export const {
  setQuery,
  setTypes,
  setCategorySlugs,
  setBrandIds,
  setPriceRange,
  setSort,
  resetFilters,
  clearTypes,
  clearBrandIds,
  clearCategorySlugs
} = productFiltersSlice.actions

export default productFiltersSlice.reducer
