import { useEffect, useRef, useState } from 'react'

type Props = {
  keyPath: string // key en R2
  /** segundos de vigencia que le pides a tu función (coincide con ?expires=) */
  expires?: number // default 60
}

/** Cache global por keyPath (persiste entre montajes) */
type CacheEntry = { url: string; /** epoch seconds */ expiresAt: number }
const presignCache = new Map<string, CacheEntry>()

/** Margen antes de expirar para renovar (segundos) */
const RENEW_MARGIN_S = 10
/** Espera mínima por si alguien pone expires muy bajo (ms) */
const MIN_RENEW_DELAY_MS = 15_000

const PresignedImage = ({ keyPath, expires = 60 }: Props) => {
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)

  const renewTimer = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const clearTimers = () => {
    if (renewTimer.current) {
      window.clearTimeout(renewTimer.current)
      renewTimer.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }

  /** ¿La entrada de cache sigue vigente? (con margen) */
  const isValid = (e: CacheEntry | undefined) => {
    if (!e) return false
    const now = Math.floor(Date.now() / 1000)
    return e.expiresAt - now > RENEW_MARGIN_S
  }

  /** Programa una renovación 10s antes de expirar (o 15s mínimo) */
  const scheduleRenew = (entry: CacheEntry) => {
    const nowMs = Date.now()
    const renewAtMs = entry.expiresAt * 1000 - RENEW_MARGIN_S * 1000
    const delay = Math.max(renewAtMs - nowMs, MIN_RENEW_DELAY_MS)
    renewTimer.current = window.setTimeout(() => {
      // fuerza un refetch controlado, pero sin parpadear la imagen
      void renew()
    }, delay)
  }

  /** Realiza el fetch de firma, guarda en cache y estado */
  const fetchAndSet = async () => {
    clearTimers()
    setError(undefined)
    // No limpies setUrl() para evitar parpadeo si ya había una URL vigente
    setLoading((prev) => (url ? prev /* mantiene */ : true))

    try {
      abortRef.current = new AbortController()
      const r = await fetch(`/.netlify/functions/r2-get-url?key=${encodeURIComponent(keyPath)}&expires=${expires}`, {
        signal: abortRef.current.signal
      })
      if (!r.ok) throw new Error(`GET presign failed (${r.status})`)
      const { url: signedUrl } = (await r.json()) as { url: string }

      // Calculamos expiresAt en cliente porque tu endpoint no lo devuelve
      const nowSec = Math.floor(Date.now() / 1000)
      const entry: CacheEntry = { url: signedUrl, expiresAt: nowSec + Number(expires || 0) }

      presignCache.set(keyPath, entry)
      setUrl(signedUrl)
      setLoading(false)
      scheduleRenew(entry)
    } catch (e) {
      const err = e as unknown
      if (err instanceof DOMException && err.name === 'AbortError') return

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('error')
      }

      setLoading(false)
    } finally {
      abortRef.current = null
    }
  }

  /** Renueva solo si ya no hay una URL válida */
  const renew = async () => {
    const cached = presignCache.get(keyPath)
    if (isValid(cached)) {
      // Aún válida → reprograma y no cambies src
      scheduleRenew(cached!)
      return
    }
    await fetchAndSet()
  }

  useEffect(() => {
    clearTimers()

    const cached = presignCache.get(keyPath)
    if (isValid(cached)) {
      // Usa cache inmediatamente y agenda renovación
      setUrl(cached!.url)
      setError(undefined)
      setLoading(false)
      scheduleRenew(cached!)
    } else {
      // No hay cache o está por expirar → firmar
      void fetchAndSet()
    }

    return () => clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyPath, expires])

  if (loading && !url) {
    return <div className='w-full aspect-square animate-pulse rounded-xl bg-gray-200' />
  }
  if (error && !url) {
    return (
      <div className='w-full aspect-square rounded-xl bg-red-50 text-red-600 text-xs flex items-center justify-center p-2'>{error}</div>
    )
  }

  return (
    <img
      src={url}
      alt=''
      className='w-full aspect-square object-cover '
      loading='lazy'
      decoding='async'
      fetchPriority='low'
      referrerPolicy='no-referrer'
      crossOrigin='anonymous'
    />
  )
}

export default PresignedImage
