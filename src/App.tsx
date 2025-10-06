import { HeroUIProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import { useProductBrands } from './hooks/useBrands'
import { useCategories } from './hooks/useCategories'
import AppRoutes from './routes/routes'

function App() {
  const navigate = useNavigate()

  useCategories()
  useProductBrands()
  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AppRoutes />
    </HeroUIProvider>
  )
}

export default App
