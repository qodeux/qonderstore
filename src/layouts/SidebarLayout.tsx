import { Button, Tooltip } from '@heroui/react'
import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'
import ScrollToTopButton from '../components/common/ScrollToTopButton'
import CartSidebar from '../components/store/CartSidebar'
import CatalogSidebar from '../components/store/CatalogSidebar'
import { setCartOpen } from '../store/slices/uiSlice'
import type { RootState } from '../store/store'

const SidebarLayout = () => {
  // Footer solo se mide en mobile (underlay=true)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useDispatch()

  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 768px)').matches
  })
  const [isOpenFilters, setIsOpenFilters] = useState(true) // sidebar abierto/cerrado
  const [underlay, setUnderlay] = useState(false) // reveal del footer (solo mobile)
  const [footerPx, setFooterPx] = useState(0) // alto footer para spacer (mobile)

  const isOpenCart = useSelector((s: RootState) => s.ui.cartOpen)
  // 🔒 Lock de z-index mientras dura la animación
  const [lockZ, setLockZ] = useState(false)

  // refs de elementos que ANIMAN
  const desktopGridRef = useRef<HTMLDivElement | null>(null) // transiciona grid-template-columns
  const mobileDrawerRef = useRef<HTMLElement | null>(null) // transiciona transform

  const desktopScrollRef = useRef<HTMLDivElement | null>(null)
  const mobileScrollRef = useRef<HTMLDivElement | null>(null)

  // Acciones abrir/cerrar con lock
  // const openWithLock = () => {
  //   setLockZ(true)
  //   setIsOpen(true)
  // }
  const closeWithLock = () => {
    setLockZ(true)
    setIsOpenFilters(false)
  }
  const toggleWithLock = () => {
    setLockZ(true)
    setIsOpenFilters((v) => !v)
  }

  // Breakpoint + flags
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      const desktop = mql.matches
      setIsDesktop(desktop)
      setUnderlay(!desktop) // solo mobile usa underlay
      setIsOpenFilters(desktop ? true : false)
      setLockZ(false) // seguridad al cambiar layout
    }
    onChange()
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  // Medición del footer (solo mobile/underlay)
  useEffect(() => {
    if (!underlay) {
      setFooterPx(0)
      return
    }
    let raf = 0
    let ro: ResizeObserver | null = null
    const apply = () => {
      const el = footerRef.current
      if (!el) return
      const h = el.getBoundingClientRect().height
      setFooterPx(Math.round(h))
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(apply)
    }
    if (footerRef.current) {
      ro = new ResizeObserver(() => setTimeout(schedule, 0))
      ro.observe(footerRef.current)
    }
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      try {
        ro?.disconnect()
      } catch {
        console.log('Error')
      }
      ro = null
    }
  }, [underlay])

  // Bloquea scroll del body cuando drawer mobile está abierto
  useEffect(() => {
    if (!isDesktop) document.body.style.overflow = isOpenFilters ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDesktop, isOpenFilters])

  // 🔔 Libera lockZ cuando termina la transición del GRID (desktop)
  useEffect(() => {
    const el = desktopGridRef.current
    if (!el) return
    const onEnd = (e: Event) => {
      const te = e as TransitionEvent
      if (te.propertyName === 'grid-template-columns') setLockZ(false)
    }
    el.addEventListener('transitionend', onEnd as EventListener)
    return () => el.removeEventListener('transitionend', onEnd as EventListener)
  }, [])

  // 🔔 Libera lockZ cuando termina la transición del DRAWER (mobile)
  useEffect(() => {
    const el = mobileDrawerRef.current
    if (!el) return
    const onEnd = (e: Event) => {
      const te = e as TransitionEvent
      if (te.propertyName === 'transform') setLockZ(false)
    }
    el.addEventListener('transitionend', onEnd as EventListener)
    return () => el.removeEventListener('transitionend', onEnd as EventListener)
  }, [])

  const sidebarW = '16rem'
  const reveal = isOpenFilters ? sidebarW : '0px'

  // 👇 z-index del main: encima cuando está cerrado o mientras anima
  const mainZ = !isOpenFilters || lockZ ? 'z-30' : 'z-0'

  return (
    <div className='relative min-h-screen'>
      <Header />

      {/* ===== DESKTOP ===== */}
      {isDesktop && (
        <>
          {/* Sidebar fijo detrás */}
          <div
            className={`fixed left-0 top-16 z-10 h-[calc(100dvh-4rem)] w-64 overflow-hidden bg-white shadow-sm ${!isOpenFilters ? 'pointer-events-none' : ''}`}
          >
            <CatalogSidebar isOpen />
          </div>

          {/* Contenido: usa mainZ para bloquear/soltar interacción */}
          <main className={`relative ${mainZ} h-[100dvh] pt-16 overflow-hidden`}>
            {/* Botón de borde reveal */}
            <div
              className='absolute bottom-2 z-40 transition-all duration-300'
              style={{ left: isOpenFilters ? `calc(${sidebarW} - 0.5rem)` : '0.5rem' }}
            >
              <Tooltip content={isOpenFilters ? 'Cerrar filtros' : 'Abrir filtros'} placement='right'>
                <Button isIconOnly onPress={toggleWithLock} className={`${isOpenFilters && '-rotate-180 '} transition-all duration-300`}>
                  <ChevronRight />
                </Button>
              </Tooltip>
            </div>

            {/* Grid: [espaciador reveal, scroller contenido] */}
            <div
              ref={desktopGridRef}
              className='grid h-[calc(100dvh-4rem)] transition-[grid-template-columns] duration-300'
              style={{ gridTemplateColumns: `${reveal} 1fr` }}
            >
              <div className='pointer-events-none select-none' />
              {/* SOLO aquí hay scroll. El footer va DENTRO del scroller (al final). */}
              <div ref={desktopScrollRef} className='relative overflow-y-auto'>
                <div className='min-h-full w-full bg-gray-100 p-4 '>
                  <Outlet />
                </div>
                <Footer variant='compact' />
              </div>
            </div>
          </main>
        </>
      )}

      {/* ===== MOBILE ===== */}
      {!isDesktop && (
        <>
          {/* Botón para abrir cuando está cerrado */}
          {/* {!isOpen && (
            <button
              type='button'
              onClick={openWithLock}
              className='fixed left-3 top-[4.5rem] z-40 rounded-full border bg-white p-2 shadow'
              aria-label='Abrir filtros'
            >
              <PanelLeft size={18} />
            </button>
          )} */}

          {/* Contenido con scroll + spacer para footer underlay */}
          <main className='relative z-10 h-[100dvh] pt-16 overflow-hidden'>
            <div ref={mobileScrollRef} className='h-[calc(100dvh-4rem)] overflow-y-auto'>
              <div className='min-h-full w-full bg-gray-100 p-4 pt-6'>
                <Outlet />
              </div>
              {/* Spacer transparente para revelar el footer fijo */}
              {underlay && <div aria-hidden style={{ height: `${footerPx}px` }} />}
            </div>
          </main>

          {/* Overlay del drawer */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpenFilters ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            onClick={closeWithLock}
            aria-hidden
          />

          {/* Drawer del sidebar flotante */}
          <aside
            ref={mobileDrawerRef}
            className={`fixed left-0 top-16 z-50 h-[calc(100dvh-4rem)] w-[80vw] max-w-72 bg-white shadow-xl transition-transform duration-300 ${isOpenFilters ? 'translate-x-0' : '-translate-x-full'}`}
            role='dialog'
            aria-modal='true'
          >
            <div className={`absolute bottom-2 z-40 transition-all duration-300 ${isOpenFilters ? '-right-6' : '-right-25 '}`}>
              <Tooltip content={isOpenFilters ? 'Cerrar filtros' : 'Abrir filtros'} placement='right'>
                <Button
                  onPress={toggleWithLock}
                  className={`${!isOpenFilters ? 'rounded-l-none' : '-rotate-180 '} transition-all duration-300`}
                  isIconOnly={isOpenFilters}
                >
                  {!isOpenFilters && 'Filtros'}
                  <ChevronRight />
                </Button>
              </Tooltip>
            </div>
            <CatalogSidebar isOpen />
          </aside>

          {/* Footer FIJO (underlay) solo mobile */}
          <div ref={footerRef} className='fixed inset-x-0 bottom-0 z-0'>
            <Footer />
          </div>
        </>
      )}

      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${isOpenCart ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => dispatch(setCartOpen(false))}
        aria-hidden
      />
      <aside
        //ref={mobileDrawerRef}
        className={`fixed right-0 top-16 z-50 h-[calc(100dvh-4rem)] w-full md:max-w-sm bg-white shadow-xl transition-transform duration-300 ${isOpenCart ? 'translate-x-0' : 'translate-x-full'}`}
        role='dialog'
        aria-modal='true'
      >
        <CartSidebar isOpen={isOpenCart} />
      </aside>

      <ScrollToTopButton targetRef={isDesktop ? desktopScrollRef : mobileScrollRef} />
    </div>
  )
}

export default SidebarLayout
