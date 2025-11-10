import { CircleChevronLeft, CircleChevronRight } from 'lucide-react'
import { useId, useRef } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper/types'
import { useDeviceScreen } from '../../../hooks/useDeviceScreen'
import PresignedImage from '../cloudflare-r2/PresignedImage'
import './autoplay-progress.css'

type MainBannerProps = {
  showProgress?: boolean
  showSeconds?: boolean
  showNavigation?: boolean
  showPagination?: boolean
  autoplay?: number
}

const images = ['banners/1.jpg', 'banners/2.jpg', 'banners/3.jpg', 'banners/placeholder.jpg']

const MainBanner = ({ showProgress, showSeconds, showNavigation, showPagination, autoplay }: MainBannerProps) => {
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

  const { isMobile } = useDeviceScreen()

  return (
    <section className='w-full max-w-screen sm:my-8 '>
      <Swiper
        slidesPerView={1}
        autoplay={autoplay ? { delay: autoplay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        loop
        navigation={showNavigation ? { prevEl: `.${prevCls}`, nextEl: `.${nextCls}`, enabled: true } : false}
        pagination={showPagination ? { el: `.${pagesCls}`, clickable: true } : false}
        onAutoplayTimeLeft={onAutoplayTimeLeft}
        modules={[Pagination, Autoplay, Navigation]}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={`banner-${idx}`}>
            <figure className='w-full aspect-[3/4] md:aspect-[16/6] bg-neutral-800 flex items-center justify-center text-sm drop overflow-hidden  '>
              <PresignedImage keyPath={img} expires={600} imgSize={'contain'} aspect={'free'} />
            </figure>
          </SwiperSlide>
        ))}
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
        <footer className={!showPagination && showNavigation ? `flex pt-4 items-center justify-between` : 'text-center pt-2'}>
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
    </section>
  )
}

export default MainBanner
