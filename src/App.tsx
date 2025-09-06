import { HeroUIProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import AppRoutes from './routes/routes'

function App() {
  const navigate = useNavigate()
  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AppRoutes />
    </HeroUIProvider>
  )
}

export default App
