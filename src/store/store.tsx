import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slices/uiSlice'

// Aquí puedes importar tus reducers
// import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    ui: uiReducer
  }
})

// Tipos para usar en tu app
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
