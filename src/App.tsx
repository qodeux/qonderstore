import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { I18nProvider } from '@react-aria/i18n'
import { useHref, useNavigate } from 'react-router'
import { AuthOverlay } from './components/AuthOverlay'
import ScrollToTop from './components/common/ScrollToTop'
import { SessionBootstrapper } from './components/SessionBootstraper'
import { useProductBrands } from './hooks/useBrands'
import { useCategories } from './hooks/useCategories'
import { useProducts } from './hooks/useProducts'
import { usePromotions } from './hooks/usePromotions'
import AppRoutes from './routes/routes'

function App() {
  const navigate = useNavigate()

  useCategories()
  useProducts()
  useProductBrands()
  usePromotions()

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ScrollToTop />
      <SessionBootstrapper />
      <ToastProvider toastProps={{ classNames: { title: 'font-bold' } }} />
      <AuthOverlay />
      <I18nProvider locale='es-MX'>
        <AppRoutes />
      </I18nProvider>
    </HeroUIProvider>
  )
}

export default App
