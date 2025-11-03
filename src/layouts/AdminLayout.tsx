import { useDisclosure } from '@heroui/react'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router'
import AdminFooter from '../components/common/AdminFooter'
import AdminSidebar from '../components/common/AdminSidebar'
import Header from '../components/common/Header'
import AccountModal from '../components/modals/admin/AccountModal'
import { useProviders } from '../hooks/useProviders'
import { useRequests } from '../hooks/useRequests'
import { useSupplyOrders } from '../hooks/useSupplyOrders'
import { setLayoutOutletHeight } from '../store/slices/uiSlice'
import type { AppDispatch, RootState } from '../store/store'

const AdminLayout = () => {
  useProviders()
  useRequests()
  useSupplyOrders()
  const dispatch = useDispatch<AppDispatch>()
  const contentRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
  const { modalName, modalOpen } = useSelector((state: RootState) => state.ui)

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

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />
      <section className='flex h-[calc(100vh)] flex-row bg-gray-100 pt-16 overflow-hidden'>
        <div className='flex-shrink-0'>
          <AdminSidebar isOpen={true} />
        </div>
        <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div ref={contentRef} className='flex-1 overflow-auto p-5'>
            <div key={location.pathname + location.search} className='route-fade'>
              <Outlet />
            </div>
          </div>
          <AdminFooter />
        </div>
      </section>
      <AccountModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </main>
  )
}

export default AdminLayout
