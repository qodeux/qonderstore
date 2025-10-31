import { useEffect, useState } from 'react'

export function usePresignedImages(keys?: string[], expires = 200) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!keys?.length) return
    let cancelled = false
    setLoading(true)
    Promise.all(
      keys.map(async (key) => {
        const res = await fetch(`/.netlify/functions/r2-get-url?key=${encodeURIComponent(key)}&expires=${expires}`)
        if (!res.ok) throw new Error('Error fetching URL')
        const { url } = await res.json()
        return { key, url }
      })
    )
      .then((results) => {
        if (cancelled) return
        const map: Record<string, string> = {}
        for (const { key, url } of results) map[key] = url
        setUrls(map)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [keys?.join('|'), expires])

  return { urls, loading }
}
