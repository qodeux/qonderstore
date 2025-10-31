/** Galería que:
 * - si mode="public": usa la URL directamente (o la construye con publicBaseUrl + key)
 * - si mode="private": pide presigned GET por cada key y muestra <img src=... />
 */

// Gallery.tsx
import { Tooltip } from '@heroui/react'
import { CircleX } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import PresignedImage from './PresignedImage'

type Props = {
  mode: 'public' | 'private'
  publicBaseUrl?: string
  expires?: number
  onDelete?: (key: string) => void
}

const Gallery = ({ mode, publicBaseUrl, expires, onDelete }: Props) => {
  const {
    control,
    setValue,
    formState: { errors },
    clearErrors
  } = useFormContext()
  const imagesRaw = useWatch({ control, name: 'images' }) as string[] | undefined
  const images = useMemo(() => imagesRaw ?? [], [imagesRaw])

  const mainImageRaw = useWatch({ control, name: 'main_image' }) as string | undefined
  const mainImage = useMemo(() => mainImageRaw ?? '', [mainImageRaw])

  const removeFromForm = (key: string) => {
    const next = images.filter((k) => k !== key)
    setValue('images', next, { shouldDirty: true, shouldValidate: true })
    if (mainImage === key) setValue('main_image', '', { shouldDirty: true, shouldValidate: true })
    onDelete?.(key)
  }

  async function handleRemove(key: string) {
    if (!confirm('¿Seguro que quieres eliminar esta imagen?')) return
    try {
      const res = await fetch('/.netlify/functions/r2-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error eliminando archivo')
      removeFromForm(key)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
  }

  const selectMainImage = (key: string) => {
    setValue('main_image', key, { shouldDirty: true })
    clearErrors('main_image')
  }

  useEffect(() => {
    if (!images.length) {
      if (mainImage) setValue('main_image', '')
      return
    }
    if (!mainImage || !images.includes(mainImage)) {
      setValue('main_image', images[0])
    }
  }, [images, mainImage, setValue])

  if (mode === 'public') {
    return (
      <div>
        <p className='text-xs text-gray-500 mb-2 font-semibold'>Imágenes cargadas</p>
        <ul className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {images.map((val, i) => {
            const src = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${val.replace(/^\//, '')}` : val
            return (
              <li key={`${val}-${i}`} className='relative'>
                <figure>
                  <button
                    className='absolute top-1 right-1 text-danger'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(val)
                    }}
                  >
                    <CircleX />
                  </button>
                  <img src={src} alt='' className='h-32 w-full object-cover rounded-xl' />
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // private
  return (
    <div>
      {/* puede ser hidden; lo dejo visible si quieres depurar */}
      <Controller name='main_image' control={control} render={({ field }) => <input type='hidden' {...field} />} />
      <p className='text-primary mb-5 text-center font-semibold'>Imágenes cargadas</p>
      <ul className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
        {images.map((key, i) => (
          <li key={`${key}-${i}`} className='relative' onClick={() => selectMainImage(key)}>
            <figure className={mainImage === key ? 'ring-4 ring-blue-500 rounded-xl p-1' : 'p-1'}>
              <Tooltip content='Eliminar imagen'>
                <button
                  className='flex items-center gap-1 text-white text-xs absolute -top-3 -right-3 m-1 bg-red-500 rounded-full hover:bg-red-600 z-10'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(key)
                  }}
                >
                  <CircleX />
                </button>
              </Tooltip>
              <PresignedImage keyPath={key} expires={expires} />
            </figure>
          </li>
        ))}
      </ul>
      {errors?.main_image && <p className='text-sm text-red-600 mt-1 text-center'>{String(errors.main_image.message)}</p>}
    </div>
  )
}

export default Gallery
