import { useEffect, useState } from 'react'

// Type guard para Safari viejo (donde addListener existe).
function hasLegacyMediaQueryListeners(mql: MediaQueryList): mql is MediaQueryList & {
  addListener(listener: (ev: MediaQueryListEvent) => void): void
  removeListener(listener: (ev: MediaQueryListEvent) => void): void
} {
  return 'addListener' in mql && 'removeListener' in mql
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    if (typeof mql.addEventListener === 'function') {
      // Navegadores modernos
      mql.addEventListener('change', handler)
    } else if (hasLegacyMediaQueryListeners(mql)) {
      // Safari viejo, pero tipado correctamente
      mql.addListener(handler)
    }

    // Estado inicial
    setMatches(mql.matches)

    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', handler)
      } else if (hasLegacyMediaQueryListeners(mql)) {
        mql.removeListener(handler)
      }
    }
  }, [query])

  return matches
}
