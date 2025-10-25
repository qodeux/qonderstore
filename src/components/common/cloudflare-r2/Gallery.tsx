/** Galería que:
 * - si mode="public": usa la URL directamente (o la construye con publicBaseUrl + key)
 * - si mode="private": pide presigned GET por cada key y muestra <img src=... />
 */

import { Tooltip } from '@heroui/react'
import { CircleX } from 'lucide-react'
import { useState } from 'react'
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
  const [mainImage, setMainImage] = useState<string | null>(null)

  const { setValue, control } = useFormContext()

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
      alert('Imagen eliminada correctamente')
      onDelete?.(key)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const selectMainImage = (key: string) => {
    setMainImage(key)
    setValue('main_image', key)
  }

  if (mode === 'public') {
    return (
      <div>
        <p className='text-xs text-gray-500 mb-2'>Imágenes subidass:</p>
        <ul className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {values.map((val, i) => {
            // si guardaste keys + base pública, construye la URL:
            const src = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${val.replace(/^\//, '')}` : val // si ya guardaste URLs completas
            return (
              <li key={`${val}-${i}`} className='relative'>
                <figure>
                  <button className='flex items-center gap-1 text-danger' onClick={() => handleRemove(val)}></button>
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
      <Controller name='main_image' control={control} render={({ field }) => <input type='text' {...field} />} />
      <p className='text-xs text-gray-500 mb-2'>Imágenes subidas:</p>
      <ul className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {values.map((key, i) => (
          <li key={`${key}-${i}`} className='relative' onClick={() => selectMainImage(key)}>
            <figure className={mainImage === key ? 'ring-4 ring-blue-500 rounded-xl p-1' : 'p-1'}>
              <Tooltip content='Eliminar imagen'>
                <button
                  className='flex items-center gap-1 text-white text-xs absolute -top-3 -right-3 m-1 bg-red-500 rounded-full  hover:bg-red-600 hover:text-gray-200 z-10 cursor-pointer '
                  onClick={() => handleRemove(key)}
                >
                  <CircleX />
                </button>
              </Tooltip>
              <PresignedImage keyPath={key} expires={expires} />
            </figure>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Gallery
