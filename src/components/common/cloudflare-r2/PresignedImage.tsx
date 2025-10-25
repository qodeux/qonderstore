import { useEffect, useState } from 'react'

type Props = {
  keyPath: string // key en R2
  expires?: number // segundos hasta caducidad del presigned GET
}
const PresignedImage = ({ keyPath, expires = 60 }: Props) => {
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stop = false

    async function fetchUrl() {
      setLoading(true)
      setError(undefined)
      try {
        const r = await fetch(`/.netlify/functions/r2-get-url?key=${encodeURIComponent(keyPath)}&expires=${expires}`)
        if (!r.ok) throw new Error(`GET presign failed (${r.status})`)
        const { url } = await r.json()
        if (!stop) setUrl(url)
      } catch (e: any) {
        if (!stop) setError(e?.message || 'error')
      } finally {
        if (!stop) setLoading(false)
      }
    }

    fetchUrl()

    // refresca automáticamente 10s antes de caducar
    const interval = setInterval(fetchUrl, Math.max((expires - 10) * 1000, 15000))
    return () => {
      stop = true
      clearInterval(interval)
    }
  }, [keyPath, expires])

  if (loading) {
    return <div className='h-32 w-full animate-pulse rounded-xl bg-gray-200' />
  }
  if (error) {
    return <div className='h-32 w-full rounded-xl bg-red-50 text-red-600 text-xs flex items-center justify-center p-2'>{error}</div>
  }
  return <img src={url} alt='' className='h-32 w-full object-cover rounded-xl' />
}

export default PresignedImage
