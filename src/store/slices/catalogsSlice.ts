import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface Bank {
  id: string
  code: string
  short_name: string
  full_name: string
}

interface CatalogsState {
  banks: Bank[]
}

const initialState: CatalogsState = {
  banks: []
}

const catalogsSlice = createSlice({
  name: 'catalogs',
  initialState,
  reducers: {
    setBanks(state, action: PayloadAction<Bank[]>) {
      state.banks = action.payload
    }
  }
})

export const { setBanks } = catalogsSlice.actions
export default catalogsSlice.reducer
