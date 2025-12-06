import { Button, Tooltip, useDisclosure } from '@heroui/react'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router'
import AdminFooter from '../components/common/AdminFooter'
import AdminSidebar from '../components/common/AdminSidebar'
import Header from '../components/common/Header'
import AccountModal from '../components/modals/admin/AccountModal'
import CartSidebar from '../components/store/CartSidebar'
import { useConfig } from '../hooks/useConfig'
import { useDeviceScreen } from '../hooks/useDeviceScreen'
import { useProviders } from '../hooks/useProviders'
import { useRequests } from '../hooks/useRequests'
import { useStoreOrders } from '../hooks/useStoreOrders'
import { useSupplyOrders } from '../hooks/useSupplyOrders'
import { setCartOpen, setLayoutOutletHeight } from '../store/slices/uiSlice'
import type { AppDispatch, RootState } from '../store/store'

const AdminLayout = () => {
  useProviders()
  useRequests()
  useSupplyOrders()
  useStoreOrders()
  useConfig()
  const dispatch = useDispatch<AppDispatch>()
  const contentRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { isOpen, onOpenChange, onOpen } = useDisclosure()
  const { modalName, modalOpen } = useSelector((state: RootState) => state.ui)
  const isOpenCart = useSelector((s: RootState) => s.ui.cartOpen)
  const { isDesktop } = useDeviceScreen()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const updateSize = () => {
      if (!contentRef.current) return
      const { offsetHeight } = contentRef.current
      dispatch(setLayoutOutletHeight(offsetHeight))
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [dispatch])

  useEffect(() => {
    if (modalName === 'account' && modalOpen) {
      onOpen()
    }
  }, [modalName, modalOpen, onOpen])

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
  }, [isDesktop])

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />

      {/* DESKTOP LAYOUT */}
      {isDesktop && (
        <section className='flex h-[calc(100vh)] flex-row bg-gray-100 pt-16 overflow-hidden'>
          {/* Sidebar en columna izquierda */}
          <div
            className={`
              relative flex-shrink-0
              transition-[width] duration-300
              ${sidebarOpen ? 'w-64' : 'w-0'}
            `}
          >
            <AdminSidebar isOpen={sidebarOpen} />

            <Tooltip content={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'} placement='right'>
              <Button
                isIconOnly
                className={`transition-all duration-300 absolute z-40 bottom-1 ${sidebarOpen ? '-right-7' : '-right-11 rotate-180'} hover:!opacity-100 data-[hover=true]:opacity-100`}
                onPress={() => setSidebarOpen((prev) => !prev)}
                aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <ChevronLeft className={`w-5 h-5 `} />
              </Button>
            </Tooltip>
          </div>

          {/* Contenido */}
          <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div ref={contentRef} className='flex-1 overflow-auto p-5'>
              <div key={location.pathname + location.search} className='route-fade'>
                <Outlet />
              </div>
            </div>
            <AdminFooter />
          </div>
        </section>
      )}

      {/* MOBILE / TABLET LAYOUT */}
      {!isDesktop && (
        <section className='flex h-[calc(100vh)] flex-col bg-gray-100 pt-16 overflow-hidden'>
          {/* Contenido siempre a todo el ancho */}
          <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div ref={contentRef} className='flex-1 overflow-auto p-4'>
              <div key={location.pathname + location.search} className='route-fade'>
                <Outlet />
              </div>
            </div>
            <AdminFooter />
          </div>

          {/* Sidebar como overlay */}
          <div
            className={`
              fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64
              bg-white shadow-xl transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <AdminSidebar isOpen={sidebarOpen} />
            <Button
              isIconOnly
              className={`transition-all duration-300 absolute z-40 bottom-1 ${sidebarOpen ? '-right-7' : '-right-11 rotate-180'}`}
              onPress={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <ChevronLeft className={`w-5 h-5 `} />
            </Button>
          </div>

          {/* Backdrop */}
          <div
            className={`
              fixed inset-0 top-16 z-40 bg-black/40
              transition-opacity duration-300
              ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}
            `}
            onClick={() => setSidebarOpen(false)}
          />
        </section>
      )}

      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
          isOpenCart ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => dispatch(setCartOpen(false))}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-16 z-50 h-[calc(100dvh-4rem)] w-full md:max-w-sm bg-white shadow-xl transition-transform duration-300 ${
          isOpenCart ? 'translate-x-0' : 'translate-x-full'
        }`}
        role='dialog'
        aria-modal='true'
      >
        <CartSidebar isOpen={isOpenCart} />
      </aside>

      <AccountModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </main>
  )
}

export default AdminLayout
