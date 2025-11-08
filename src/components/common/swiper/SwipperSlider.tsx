import { CircleChevronLeft, CircleChevronRight } from 'lucide-react'
import { useId, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper/types'
import './autoplay-progress.css'

type SwipperSliderProps = {
  children: React.ReactNode
  showProgress?: boolean
  showSeconds?: boolean
  showNavigation?: boolean
  showPagination?: boolean
  autoplay?: number
}

const SwipperSlider = ({ children, showProgress, showSeconds, showNavigation, showPagination, autoplay }: SwipperSliderProps) => {
  const uid = useId().replace(/:/g, '-')
  const progressCircle = useRef<SVGSVGElement | null>(null)
  const progressContent = useRef<HTMLSpanElement | null>(null)

  const onAutoplayTimeLeft = (_s: SwiperType, time: number, progress: number) => {
    if (progressCircle.current) progressCircle.current.style.setProperty('--progress', `${1 - progress}`)
    if (progressContent.current && showSeconds) progressContent.current.textContent = `${Math.ceil(time / 1000)}`
  }

  const pagesCls = `pages-${uid}`
  const prevCls = `prev-${uid}`
  const nextCls = `next-${uid}`

  return (
    <div>
      <Swiper
        slidesPerView={1}
        spaceBetween={24}
        autoplay={autoplay ? { delay: autoplay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        loop
        navigation={showNavigation ? { prevEl: `.${prevCls}`, nextEl: `.${nextCls}`, enabled: true } : false}
        pagination={showPagination ? { el: `.${pagesCls}`, clickable: true } : false}
        onAutoplayTimeLeft={onAutoplayTimeLeft}
        breakpoints={{ 640: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }}
        modules={[Pagination, Autoplay, Navigation]}
      >
        {children}
        {showProgress && (
          <div className='autoplay-progress' slot='container-end'>
            <svg viewBox='0 0 48 48' ref={progressCircle}>
              <circle cx='24' cy='24' r='20' />
            </svg>
            <span ref={progressContent}></span>
          </div>
        )}
      </Swiper>

      {(showPagination || showNavigation) && (
        <footer className='flex pt-4 items-center justify-between'>
          {showPagination && <div className={`swiper-pages ${pagesCls}`} />}
          {showNavigation && (
            <div className='flex gap-1'>
              <div className={`cursor-pointer ${prevCls}`}>
                <CircleChevronLeft size={32} className='text-primary' />
              </div>
              <div className={`cursor-pointer ${nextCls}`}>
                <CircleChevronRight size={32} className='text-primary' />
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  )
}

export default SwipperSlider
