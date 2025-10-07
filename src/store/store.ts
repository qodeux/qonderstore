import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import categoriesReducer from './slices/categoriesSlice'
import uiReducer from './slices/uiSlice'
import usersReducer from './slices/usersSlice'

const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    categories: categoriesReducer,
    users: usersReducer
  }
})

// Tipos para usar en tu app
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
