import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import catalogsReducer from './slices/catalogsSlice'
import categoriesReducer from './slices/categoriesSlice'
import productsReducer from './slices/productsSlice'
import providersReducer from './slices/providersSlice'
import uiReducer from './slices/uiSlice'
import usersReducer from './slices/usersSlice'

const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    catalogs: catalogsReducer,
    categories: categoriesReducer,
    products: productsReducer,
    providers: providersReducer,
    users: usersReducer
  }
})

// Tipos para usar en tu app
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
