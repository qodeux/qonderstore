import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ConfigDB, ContactValue, FAQ, PaymentMethod } from '../../schemas/config.schema'

export type ConfigState = {
  paymentMethods: PaymentMethod[] | null
  faq?: FAQ[] | null
  contact_data?: ContactValue[] | null
  isEditing: boolean
  selectedPaymentMethod?: PaymentMethod | null
  config: PaymentMethod[]
  selectedFAQ?: FAQ | null
}

const initialState: ConfigState = {
  paymentMethods: null,
  faq: null,
  contact_data: null,
  isEditing: false,
  config: []
}

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig(state, action: PayloadAction<ConfigDB[]>) {
      state.paymentMethods = action.payload
        .filter((item) => item.module === 'payment_methods')
        .map((item) => ({ id: item.id, ...item.data }) as PaymentMethod)
      state.faq = action.payload.filter((item) => item.module === 'faq').map((item) => ({ id: item.id, ...item.data }) as FAQ)
      state.contact_data = action.payload.filter((item) => item.module === 'contact_data').map((item) => item.data as ContactValue)
    },
    setEditMode(state, action: PayloadAction<boolean>) {
      state.isEditing = action.payload
    },
    setSelectedPaymentMethod(state, action: PayloadAction<number | null>) {
      state.selectedPaymentMethod = state.paymentMethods?.find((pm) => pm.id === action.payload) || null
    },
    setSelectedFAQ(state, action: PayloadAction<number | null>) {
      state.selectedFAQ = state.faq?.find((pm) => pm.id === action.payload) || null
    }
  }
})

export const { setConfig, setSelectedPaymentMethod, setSelectedFAQ } = configSlice.actions

export default configSlice.reducer
