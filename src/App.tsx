import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import { AuthOverlay } from './components/AuthOverlay'
import ScrollToTop from './components/common/ScrollToTop'
import { SessionBootstrapper } from './components/SessionBootstraper'
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
      <ScrollToTop />
      <SessionBootstrapper />
      <ToastProvider toastProps={{ classNames: { title: 'font-bold' } }} />
      <AuthOverlay />
      <AppRoutes />
    </HeroUIProvider>
  )
}

export default App
