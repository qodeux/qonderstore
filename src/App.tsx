import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import { useProductBrands } from './hooks/useBrands'
import { useCategories } from './hooks/useCategories'
import { useProducts } from './hooks/useProducts'
import AppRoutes from './routes/routes'

function App() {
  const navigate = useNavigate()

  useCategories()
  useProducts()
  useProductBrands()
  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider toastProps={{ classNames: { title: 'font-bold' } }} />
      <AppRoutes />
    </HeroUIProvider>
  )
}

export default App
