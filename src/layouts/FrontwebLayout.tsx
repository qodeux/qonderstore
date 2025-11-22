import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'
import ScrollToTopButton from '../components/common/ScrollToTopButton'
import CartSidebar from '../components/store/CartSidebar'
import { useStoreOrders } from '../hooks/useStoreOrders'
import { useUserFavs } from '../hooks/useUserFavs'
import { setCartOpen } from '../store/slices/uiSlice'
import type { RootState } from '../store/store'

const FrontwebLayout = () => {
  useStoreOrders()

  useUserFavs()

  const footerRef = useRef<HTMLDivElement | null>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)
  const [underlay, setUnderlay] = useState(true)
  const dispatch = useDispatch()
  const isOpenCart = useSelector((s: RootState) => s.ui.cartOpen)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Detecta si es mobile o desktop
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const update = () => setUnderlay(!mql.matches)
    update()
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [])

  // Ajusta la altura del spacer (versión idempotente y defensiva)
  useEffect(() => {
    let raf = 0
    let ro: ResizeObserver | null = null

    const apply = () => {
      const footerEl = footerRef.current
      const spacerEl = spacerRef.current
      if (!footerEl || !spacerEl) return

      // usa getBoundingClientRect para medidas más fiables en fixed/relative
      const h = footerEl.getBoundingClientRect().height
      spacerEl.style.height = underlay ? `${h}px` : '0px'
    }

    // ejecuta en el próximo frame para asegurar DOM actualizado
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }

    // observa cambios de tamaño del footer (si existe)
    if (footerRef.current) {
      ro = new ResizeObserver(() => {
        // evitar "ResizeObserver loop limit exceeded" en Safari/Chrome
        setTimeout(schedule, 0)
      })
      ro.observe(footerRef.current)
    }

    // escucha resize de ventana
    window.addEventListener('resize', schedule)

    // primera medición (post-mount)
    schedule()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      if (ro) {
        try {
          ro.disconnect()
        } catch {
          // noop
        }
        ro = null
      }
    }
  }, [underlay]) // 👈 se recalcula solo cuando cambia underlay

  return (
    <div className='relative min-h-screen'>
      {/* Contenido principal */}
      <Header />
      <main className='relative flex min-h-[100dvh] flex-col z-10'>
        {/* Header fijo/normal */}

        {/* Contenido */}
        <section className='flex-1 flex min-h-0'>
          <div className='flex-1 flex min-h-screen'>
            {/* Fondo y contenido*/}
            <div key={location.pathname + location.search} ref={scrollRef} className='h-full w-full bg-gray-100 pt-16 '>
              {/* Padding top ajustado para el alto del header + el padding del contenedor */}
              <Outlet />
            </div>
          </div>
        </section>

        {/* Spacer: solo visible en mobile */}
        <div ref={spacerRef} className='block md:hidden w-full' />
      </main>

      <div
        className={`fixed inset-0 z-10 bg-black/40 transition-opacity duration-300 ${isOpenCart ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => dispatch(setCartOpen(false))}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-16 z-50 h-[calc(100dvh-4rem)] w-full md:max-w-sm bg-white shadow-xl transition-transform duration-300 ${isOpenCart ? 'translate-x-0' : 'translate-x-full'}`}
        role='dialog'
        aria-modal='true'
      >
        <CartSidebar isOpen={isOpenCart} />
      </aside>

      <ScrollToTopButton />

      {/* Footer: underlay en mobile, normal en desktop */}
      <div ref={footerRef} className={underlay ? 'fixed inset-x-0 bottom-0 z-0' : 'relative z-0'}>
        <Footer variant={underlay ? 'full' : 'compact'} />
      </div>
    </div>
  )
}

export default FrontwebLayout
