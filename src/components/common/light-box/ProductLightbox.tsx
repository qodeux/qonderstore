// components/ProductGallery.tsx
import { useMemo, useState } from 'react'
import Lightbox, { type Slide } from 'yet-another-react-lightbox'
import Inline from 'yet-another-react-lightbox/plugins/inline'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/styles.css'
import PresignedImage from '../cloudflare-r2/PresignedImage'

/** Extiende el tipo Slide para incluir keyPath que usa tu PresignedImage */
export type SlideWithKeyPath = Slide & {
  keyPath: string
}

/** Props del componente */
type ProductGalleryProps = {
  /** Imagen principal (keyPath) opcional */
  mainImage?: string | null
  /** Lista de imágenes adicionales (keyPath) */
  images?: string[]
  /** Ancho máx opcional para el inline */
  maxWidth?: number
  /** Muestra miniaturas en el modal */
  showThumbnails?: boolean
  /** Clase opcional del wrapper */
  className?: string
}

/** Pixel transparente para cumplir con `Slide.src` sin descargar nada */
const TRANSPARENT_PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

export default function ProductLightboxGallery({
  mainImage,
  images = [],
  maxWidth = 900,
  showThumbnails = true,
  className = ''
}: ProductGalleryProps) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Construye la lista ordenada: primero main_image (si existe), luego el resto únicos
  const ordered = useMemo(() => {
    const set = new Set<string>()
    if (mainImage) set.add(mainImage)
    for (const img of images) set.add(img)
    return Array.from(set)
  }, [mainImage, images])

  // Slides para YARL con keyPath + src requerido
  const slides: SlideWithKeyPath[] = useMemo(
    () =>
      ordered.map((keyPath) => ({
        keyPath,
        src: TRANSPARENT_PX // cumplimos el tipo; renderizamos con PresignedImage
      })),
    [ordered]
  )

  const hasImages = ordered.length > 0

  return (
    <div className={`relative   overflow-hidden ${className}`}>
      {/* Placeholder cuando no hay imagen */}
      {!hasImages && (
        <figure className='w-full aspect-square bg-neutral-100   flex items-center justify-center text-neutral-500 text-lg'>
          Sin imagen
        </figure>
      )}

      {/* Si hay 1 imagen: figura clickeable que abre el modal */}
      {hasImages && ordered.length === 1 && (
        <figure onClick={() => setLightboxOpen(true)} className='cursor-zoom-in'>
          <PresignedImage keyPath={ordered[0]} expires={180} />
        </figure>
      )}

      {/* Si hay +1 imagen: lightbox en modo inline + modal separado */}
      {hasImages && ordered.length > 1 && (
        <>
          <Lightbox
            index={index}
            slides={slides}
            plugins={[Inline]}
            on={{
              view: ({ index: current }) => !lightboxOpen && setIndex(current)
              // ❌ quita el click global; está bloqueando todo
              // click: ({ event }) => {
              //   event?.preventDefault()
              //   event?.stopPropagation()
              //   setLightboxOpen(true)
              // }
            }}
            carousel={{ padding: 0, spacing: 0, imageFit: 'cover', finite: true }}
            inline={{ style: { width: '100%', maxWidth: `${maxWidth}px`, aspectRatio: '1/1', margin: '0 auto' } }}
            styles={{
              button: {
                color: 'black',
                filter: 'none',
                padding: 1,
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              },
              container: { backgroundColor: 'white' }
            }}
            render={{
              slide: ({ slide, rect }) => {
                const s = slide as SlideWithKeyPath
                return (
                  // ✅ Abre el modal SOLO al click sobre la imagen renderizada
                  <div
                    onClick={() => setLightboxOpen(true)}
                    style={{ width: rect.width, height: rect.height, cursor: 'zoom-in' }}
                    // no hacemos stopPropagation aquí: el inline controla este click
                  >
                    <PresignedImage keyPath={s.keyPath} expires={180} />
                  </div>
                )
              }
            }}
          />

          {/* Modal Lightbox */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={index}
            slides={slides}
            on={{
              view: ({ index: current }) => lightboxOpen && setIndex(current)
            }}
            animation={{ fade: 0 }}
            controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
            plugins={showThumbnails ? [Thumbnails] : []}
            styles={{ container: { backgroundColor: 'black' } }}
            carousel={{ finite: true, padding: 0, spacing: 0, imageFit: 'contain' }} // 👈 evita loop
            render={{
              slide: ({ slide }) => {
                const s = slide as SlideWithKeyPath
                return (
                  <div className=' max-w-[800px]'>
                    <PresignedImage keyPath={s.keyPath} expires={180} />
                  </div>
                )
              },
              thumbnail: ({ slide }) => {
                const s = slide as SlideWithKeyPath
                return (
                  <div className='w-20 h-20'>
                    <PresignedImage keyPath={s.keyPath} expires={120} />
                  </div>
                )
              }
            }}
          />
        </>
      )}
    </div>
  )
}
