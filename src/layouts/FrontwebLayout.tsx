import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'

const FrontwebLayout = () => {
  const footerRef = useRef<HTMLDivElement | null>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)
  const [underlay, setUnderlay] = useState(true)

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
      <main className='relative z-10 flex min-h-[100dvh] flex-col'>
        {/* Header fijo/normal */}
        <Header />

        {/* Contenido */}
        <section className='flex-1 flex min-h-0'>
          <div className='flex-1 flex min-h-screen'>
            {/* Fondo y contenido */}
            <div className='h-full w-full bg-gray-100 p-8 pt-26 md:py-0'>
              <Outlet />
            </div>
          </div>
        </section>

        {/* Spacer: solo visible en mobile */}
        <div ref={spacerRef} className='block md:hidden w-full' />
      </main>

      {/* Footer: underlay en mobile, normal en desktop */}
      <div ref={footerRef} className={underlay ? 'fixed inset-x-0 bottom-0 z-0' : 'relative z-0'}>
        <Footer />
      </div>
    </div>
  )
}

export default FrontwebLayout
