/** Galería que:
 * - si mode="public": usa la URL directamente (o la construye con publicBaseUrl + key)
 * - si mode="private": pide presigned GET por cada key y muestra <img src=... />
 */

import { Tooltip } from '@heroui/react'
import { CircleX } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PresignedImage from './PresignedImage'

type Props = {
  values: string[] // keys o URLs
  mode: 'public' | 'private'
  publicBaseUrl?: string // si usas keys + base pública
  expires?: number // para presigned GET en modo private
  onDelete?: (key: string) => void
}

const Gallery = ({ values, mode, publicBaseUrl, expires, onDelete }: Props) => {
  const {
    setValue,
    control,
    formState: { errors },
    watch,
    clearErrors
  } = useFormContext()

  const mainImage = watch('main_image')

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

      // 🔥 Opcional: elimina del array local (para que desaparezca visualmente)
      // Si recibes `values` como prop, crea un callback `onRemove(key)` desde el uploader padre
      onDelete?.(key)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const selectMainImage = (key: string) => {
    setValue('main_image', key)
    clearErrors('main_image')
  }

  useEffect(() => {
    //Si solo hay una imagen, la selecciona como principal
    if (values.length === 1) {
      setValue('main_image', values[0])
    } else if (!values.includes(mainImage)) {
      setValue('main_image', '')
    } else if (values.length === 0) {
      setValue('main_image', '')
    }
  }, [setValue, values, mainImage])

  if (mode === 'public') {
    return (
      <div>
        <p className='text-xs text-gray-500 mb-2 font-semibold'>Imágenes cargadas:</p>
        <ul className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {values.map((val, i) => {
            // si guardaste keys + base pública, construye la URL:
            const src = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${val.replace(/^\//, '')}` : val // si ya guardaste URLs completas
            return (
              <li key={`${val}-${i}`} className='relative'>
                <figure>
                  <button
                    className='flex items-center gap-1 text-danger'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(val)
                    }}
                  ></button>
                  <img src={src} alt='' className='h-32 w-full object-cover rounded-xl' />
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  // mode = 'private' → keys → presigned GET
  return (
    <div>
      <Controller name='main_image' control={control} render={({ field }) => <input type='hidden' {...field} />} />
      <p className=' text-primary mb-5 text-center font-semibold'>Imágenes cargadas</p>
      <ul className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
        {values.map((key, i) => (
          <li key={`${key}-${i}`} className='relative' onClick={() => selectMainImage(key)}>
            <figure className={mainImage === key ? 'ring-4 ring-blue-500 rounded-xl p-1' : 'p-1'}>
              <Tooltip content='Eliminar imagen'>
                <button
                  className='flex items-center gap-1 text-white text-xs absolute -top-3 -right-3 m-1 bg-red-500 rounded-full  hover:bg-red-600 hover:text-gray-200 z-10 cursor-pointer '
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
      {errors?.main_image && <p className='text-sm text-red-600 mt-1 text-center'>{errors.main_image.message as string}</p>}
    </div>
  )
}

export default Gallery
