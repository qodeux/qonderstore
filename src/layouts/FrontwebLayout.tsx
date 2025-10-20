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

  // Ajusta la altura del spacer
  useEffect(() => {
    if (!footerRef.current || !spacerRef.current) return
    const apply = () => {
      const h = footerRef.current!.offsetHeight
      spacerRef.current!.style.height = underlay ? `${h}px` : '0px'
    }
    const ro = new ResizeObserver(apply)
    ro.observe(footerRef.current)
    window.addEventListener('resize', apply)
    apply()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [underlay])

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
