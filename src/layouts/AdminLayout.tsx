import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation } from 'react-router'
import AdminFooter from '../components/common/AdminFooter'
import AdminSidebar from '../components/common/AdminSidebar'
import Header from '../components/common/Header'
import { useProviders } from '../hooks/useProviders'
import { setLayoutOutletHeight } from '../store/slices/uiSlice'
import type { AppDispatch } from '../store/store'

const AdminLayout = () => {
  useProviders()
  const dispatch = useDispatch<AppDispatch>()
  const contentRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

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

  // Animar cuando cambie la ruta
  useEffect(() => {
    if (!contentRef.current) return

    const el = contentRef.current
    // Reset opacity a 0
    el.style.opacity = '0'
    el.style.transition = 'none'

    // Fuerza reflow para aplicar el opacity 0
    void el.offsetHeight

    // Trigger animation
    el.style.transition = 'opacity 0.400s ease-out'
    el.style.opacity = '1'

    return () => {
      el.style.transition = 'none'
    }
  }, [location.pathname, location.search])

  return (
    <main className='flex min-h-screen flex-col'>
      <Header />
      <section className='flex h-[calc(100vh)] flex-row bg-gray-100 pt-16 overflow-hidden'>
        <div className='flex-shrink-0'>
          <AdminSidebar isOpen={true} />
        </div>
        <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div ref={contentRef} className='flex-1 overflow-auto p-5'>
            <Outlet />
          </div>
          <AdminFooter />
        </div>
      </section>
    </main>
  )
}

export default AdminLayout
