// RHF_R2Uploader.tsx
import { Button, Tooltip } from '@heroui/react'
import { CircleX } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { type FileRejection, useDropzone } from 'react-dropzone'
import { useFormContext, useWatch } from 'react-hook-form'
import Gallery from './cloudflare-r2/Gallery'

type ItemSigned = {
  key: string
  uploadUrl: string
  publicUrl: string
}

type Props = {
  /** Nombre del campo del form que guarda el array de imágenes (keys o URLs) */
  name: string
  /** Prefijo de almacenamiento en el bucket (ej: "products/uuid") */
  prefix?: string
  /** public = guarda/usa URLs; private = guarda keys y muestra con presigned GET */
  mode?: 'public' | 'private'
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  uploadLabel?: string
  /** Si `mode="public"` y guardas keys, puedes construir la URL con base pública */
  publicBaseUrl?: string
  /** Vida de la presigned GET (segundos) para previews en privado */
  previewExpiresIn?: number
}

const RHF_R2Uploader: React.FC<Props> = ({
  name,
  prefix = 'uploads',
  mode = 'private',
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  disabled,
  uploadLabel = 'Subir archivos',
  publicBaseUrl,
  previewExpiresIn = 60
}) => {
  const {
    setValue,
    getValues,
    formState: { errors },
    control
  } = useFormContext()

  // Observa el valor actual del campo (array de keys o URLs) desde RHF
  const currentField = (useWatch({ control, name }) as string[]) ?? []

  // Estado local de archivos seleccionados (antes de subir)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({}) // key -> 0..100
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [dimensions, setDimensions] = useState<Record<string, { w: number; h: number }>>({})
  const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted?.length) return
    setFiles((prev) => [...prev, ...accepted])
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: true,
    accept,
    maxSize,
    maxFiles,
    disabled: disabled || uploading
  })

  const hasFiles = files.length > 0
  const fieldError = (errors as Record<string, any>)?.[name]?.message as string | undefined

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const copy = [...prev]
      const [removed] = copy.splice(idx, 1)
      if (removed) {
        const k = fileKey(removed)
        setDimensions((d) => {
          const { [k]: _, ...rest } = d
          return rest
        })
      }
      return copy
    })
  }

  // PUT con XHR para progreso
  function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(file)
    })
  }

  const handleUpload = async () => {
    setErrorMsg(null)
    if (!hasFiles) return
    try {
      setUploading(true)
      setProgress({})

      // 1) Solicitar firmas
      const res = await fetch('/.netlify/functions/r2-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, type: f.type })),
          prefix
        })
      })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data?.items)) {
        throw new Error(data?.error || 'No se pudieron obtener URLs firmadas')
      }

      const items: ItemSigned[] = data.items
      if (items.length !== files.length) throw new Error('El servidor no firmó todos los archivos')

      // 2) Subir con progreso
      await Promise.all(
        items.map((it, i) => putWithProgress(it.uploadUrl, files[i], (pct) => setProgress((prev) => ({ ...prev, [it.key]: pct }))))
      )

      // 3) Actualizar form y main_image si no existe
      const valuesToAdd =
        mode === 'public'
          ? items.map((i) => i.publicUrl) // guarda URLs públicas
          : items.map((i) => i.key) // guarda keys privadas

      const next = [...currentField, ...valuesToAdd]
      setValue(name, next, { shouldValidate: true, shouldDirty: true })

      const main = getValues('main_image') as string | undefined
      if (!main && next.length > 0) {
        setValue('main_image', next[0], { shouldDirty: true, shouldValidate: true })
      }

      // 4) Limpiar selección local
      setFiles([])
    } catch (e: unknown) {
      setErrorMsg((e as Error)?.message || 'Error subiendo archivos')
    } finally {
      setUploading(false)
    }
  }

  function getDropzoneErrorMessage(code: string, file: File, maxSizeMB: number) {
    switch (code) {
      case 'file-too-large':
        return `El archivo "${file.name}" supera el tamaño máximo permitido de ${maxSizeMB} MB.`
      case 'file-invalid-type':
        return `El tipo de archivo "${file.type || file.name.split('.').pop()}" no está permitido.`
      case 'too-many-files':
        return `Solo puedes subir hasta ${maxFiles} archivos.`
      default:
        return 'Archivo rechazado por una validación desconocida.'
    }
  }

  return (
    <div className='space-y-2'>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Suelta los archivos aquí…</p>
        ) : (
          <>
            <p className='font-medium'>Arrastra y suelta, o haz clic para seleccionar</p>
            <p className='text-xs text-gray-500'>
              Para mejores resultados, usa imágenes <strong>cuadradas</strong> de mínimo <strong>800px</strong> en formato jpg
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              Hasta {maxFiles} imágenes de máximo <strong>{(maxSize / (1024 * 1024)).toFixed(0)}MB</strong> cada una.
            </p>
          </>
        )}
      </div>

      {/* Rechazos */}
      {fileRejections.length > 0 && (
        <ul className='text-sm text-red-600 space-y-1'>
          {fileRejections.map(({ file, errors }: FileRejection) => (
            <li key={file.name}>
              {errors.map((e) => (
                <div key={e.code}>{getDropzoneErrorMessage(e.code, file, maxSize / (1024 * 1024))}</div>
              ))}
            </li>
          ))}
        </ul>
      )}

      {/* Selección local + progreso */}
      {hasFiles && (
        <ul className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {files.map((file, idx) => {
            const preview = URL.createObjectURL(file)
            const k = fileKey(file)
            const dims = dimensions[k]
            // Indicador simple (si subes varios, puedes mostrar barra por item usando progress[it.key])
            const anyPct = Object.values(progress)[0]
            return (
              <li key={`${file.name}-${idx}`} className='relative'>
                <figure>
                  <Tooltip content='Eliminar archivo'>
                    <button
                      className='text-danger bg-white absolute top-0 right-0 rounded-full rounded-tr-none p-1 hover:bg-danger hover:text-white '
                      onClick={() => removeFile(idx)}
                      disabled={uploading}
                      type='button'
                    >
                      <CircleX />
                    </button>
                  </Tooltip>
                  <img
                    src={preview}
                    alt={file.name}
                    className='h-32 w-full object-cover rounded-xl border-1 border-neutral-300'
                    onLoad={(e) => {
                      // Solo calcular para imágenes y solo en la sección local
                      if (file.type?.startsWith('image/')) {
                        const img = e.currentTarget
                        setDimensions((prev) => ({ ...prev, [k]: { w: img.naturalWidth, h: img.naturalHeight } }))
                      }
                      URL.revokeObjectURL(preview)
                    }}
                  />
                </figure>
                <div className='mt-1 flex flex-col items-center justify-between text-xs'>
                  <span className='whitespace-nowrap'>
                    {file.type?.startsWith('image/') ? (dims ? `${dims.w}×${dims.h} px` : '…') : ''}
                  </span>
                  <span className='text-gray-500 '>
                    {file.size < 1024
                      ? `${file.size} B`
                      : file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(2)} KB`
                        : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  </span>
                </div>
                {uploading && (
                  <div className='mt-1 w-full bg-gray-200 h-2 rounded overflow-hidden'>
                    <div className='h-2 rounded' style={{ width: `${anyPct ?? 0}%`, transition: 'width .2s' }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Errores */}
      {fieldError && <p className='text-sm text-red-600'>{fieldError}</p>}
      {errorMsg && <p className='text-sm text-red-600'>{errorMsg}</p>}

      {/* Botón subir */}
      <div className='flex justify-center'>
        {hasFiles && (
          <Button
            onPress={handleUpload}
            isDisabled={!hasFiles || uploading || disabled}
            isLoading={uploading}
            variant='ghost'
            color='primary'
          >
            {uploading ? 'Subiendo…' : uploadLabel}
          </Button>
        )}
      </div>

      {/* Galería - lee del mismo form (campo `name`) */}
      {currentField.length > 0 && <Gallery mode={mode} publicBaseUrl={publicBaseUrl} expires={previewExpiresIn} />}
    </div>
  )
}

export default RHF_R2Uploader
