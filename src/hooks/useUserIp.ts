import { useEffect, useState } from 'react'

export const useUserIp = () => {
  const [ip, setIp] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetch('/.netlify/functions/whoami')
    fetch('/.netlify/functions/whoami')
      .then((res) => res.json())
      .then((data) => {
        setIp(data.ip)
        setLoading(false)
      })
      .catch(() => {
        setIp(null)
        setLoading(false)
      })
  }, [])

  return { ip, loading }
}
