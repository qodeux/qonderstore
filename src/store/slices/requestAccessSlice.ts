import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RequestDraftPartial } from '../../schemas/request.schema'

interface RequestAccessState {
  requestData: RequestDraftPartial | null
  loading: boolean
  error: string | null
  currentStep: number
}

const initialState: RequestAccessState = {
  requestData: null,
  loading: false,
  error: null,
  currentStep: 0
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
    }
  }
})

export const { patchRequest, setLoading, setError, setCurrentStep } = requestAccessSlice.actions
export default requestAccessSlice.reducer
