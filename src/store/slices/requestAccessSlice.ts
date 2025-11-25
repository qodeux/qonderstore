import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Request, RequestDraftPartial } from '../../schemas/request.schema'

export type RequestAccessState = {
  requestData: RequestDraftPartial | null
  loading: boolean
  error: string | null
  currentStep: number
  items: Request[]
  selectedRequest: Request | null
}

const initialState: RequestAccessState = {
  requestData: null,
  loading: false,
  error: null,
  currentStep: 0,
  items: [],
  selectedRequest: null
}

const requestAccessSlice = createSlice({
  name: 'requestAccess',
  initialState,
  reducers: {
    patchRequest(state, action: PayloadAction<RequestDraftPartial>) {
      state.requestData = { ...state.requestData, ...action.payload }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload
    },
    resetRequest(state) {
      state.requestData = null
      state.loading = false
      state.error = null
      state.currentStep = 0
    },
    setAccessRequests(state, action: PayloadAction<Request[]>) {
      state.items = action.payload
    },
    setSelectedRequest(state, action: PayloadAction<number>) {
      state.selectedRequest = state.items.find((item) => item.id === action.payload) || null
    }
  }
})

export const { patchRequest, setLoading, setError, setCurrentStep, setAccessRequests, setSelectedRequest } = requestAccessSlice.actions
export default requestAccessSlice.reducer
