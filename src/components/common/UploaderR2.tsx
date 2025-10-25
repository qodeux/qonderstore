import { CircleX } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFormContext } from 'react-hook-form'
import Gallery from './cloudflare-r2/Gallery'

type ItemSigned = {
  key: string
  uploadUrl: string
  publicUrl: string
}

type Props = {
  name: string
  prefix?: string
  mode?: 'public' | 'private' // public = guarda/usa URLs; private = guarda keys y muestra presigned GET
  accept?: { [mime: string]: string[] }
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  uploadLabel?: string
  /** Solo para mode="public" si quieres construir URL a partir de key */
  publicBaseUrl?: string // ej: https://cdn.tu-dominio.com
  /** Vida de la presigned GET (segundos) para previews en privado */
  previewExpiresIn?: number // default 60
}

export default function RHF_R2Uploader({
  name,
  prefix = 'uploads',
  mode = 'private',
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  disabled,
  uploadLabel = 'Subir archivos',
  publicBaseUrl, // si usas keys + base pública
  previewExpiresIn = 60
}: Props) {
  const {
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({}) // key → %
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // valor actual del campo (urls o keys según mode)
  const currentField = (getValues(name) as string[] | undefined) ?? []

  const onDrop = useCallback((accepted: File[]) => {
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

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  // PUT con XHR para progreso
  function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (e) => {
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

      // 1) firmar
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

      // 2) subir con progreso por key
      await Promise.all(
        items.map((it, i) => putWithProgress(it.uploadUrl, files[i], (pct) => setProgress((prev) => ({ ...prev, [it.key]: pct }))))
      )

      // 3) actualizar el valor RHF
      const valuesToAdd =
        mode === 'public'
          ? items.map((i) => i.publicUrl) // público: guarda URLs públicas
          : items.map((i) => i.key) // privado: guarda keys

      setValue(name, [...currentField, ...valuesToAdd], { shouldValidate: true, shouldDirty: true })

      // 4) limpiar selección local
      setFiles([])
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error subiendo archivos')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    console.log('Eliminar imagen ')

    const currentField = (getValues(name) as string[] | undefined) ?? []

    console.log(currentField)

    const next = currentField.filter((v) => v !== key)
    setValue(name, next, { shouldDirty: true, shouldValidate: true })
  }

  const fieldError = (errors as any)?.[name]?.message as string | undefined

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
    <div className='space-y-4'>
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
            <p className='text-xs text-gray-500 mt-1'>
              {Object.keys(accept).join(', ')} · máx. {(maxSize / (1024 * 1024)).toFixed(0)}MB · hasta {maxFiles} archivos
            </p>
          </>
        )}
      </div>

      {/* Rechazos */}
      {fileRejections.length > 0 && (
        <ul className='text-sm text-red-600 space-y-1'>
          {fileRejections.map(({ file, errors }) => (
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
            const pctAny = Object.values(progress)[0] // indicativo visual mientras firmamos
            return (
              <li key={`${file.name}-${idx}`} className='relative'>
                <figure>
                  <button className='flex items-center gap-1 text-danger' onClick={() => removeFile(idx)} disabled={uploading}>
                    <CircleX /> Remover
                  </button>
                  <img
                    src={preview}
                    alt={file.name}
                    className='h-32 w-full object-cover rounded-xl'
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                </figure>
                <div className='mt-1 flex items-center justify-between text-xs'>
                  <span className='truncate'>{file.name}</span>
                </div>
                <div>
                  <span className='text-xs text-gray-500'>
                    {file.size < 1024
                      ? `${file.size} B`
                      : file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  </span>
                </div>
                {uploading && (
                  <div className='mt-1 w-full bg-gray-200 h-2 rounded overflow-hidden'>
                    <div className='h-2 rounded' style={{ width: `${pctAny ?? 0}%`, transition: 'width .2s' }} />
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
      <div className='flex gap-2'>
        {hasFiles && (
          <button
            type='button'
            onClick={handleUpload}
            disabled={!hasFiles || uploading || disabled}
            className='rounded-xl border px-4 py-2'
          >
            {uploading ? 'Subiendo…' : uploadLabel}
          </button>
        )}
      </div>
      {/* Galería de lo que YA quedó en el formulario */}
      {currentField.length > 0 && (
        <Gallery values={currentField} mode={mode} publicBaseUrl={publicBaseUrl} expires={previewExpiresIn} onDelete={handleDelete} />
      )}
    </div>
  )
}
