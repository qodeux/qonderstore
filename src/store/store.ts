import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import catalogsReducer from './slices/catalogsSlice'
import categoriesReducer from './slices/categoriesSlice'
import productsReducer from './slices/productsSlice'
import promotionReducer from './slices/promoSlice'
import providersReducer from './slices/providersSlice'

import uiReducer from './slices/uiSlice'
import usersReducer from './slices/usersSlice'

import requestAccessReducer from './slices/requestAccessSlice'

const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    catalogs: catalogsReducer,
    categories: categoriesReducer,
    products: productsReducer,
    providers: providersReducer,
    users: usersReducer,
    promotions: promotionReducer,
    requestAccess: requestAccessReducer
  }
})

// Tipos para usar en tu app
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
