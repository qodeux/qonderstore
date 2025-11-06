import { useMemo } from 'react'
import { UAParser } from 'ua-parser-js'

export function useDevice() {
  return useMemo(() => {
    // Si estamos en servidor, no hay navigator → retorna desktop por defecto
    if (typeof navigator === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        type: 'desktop',
        os: null,
        browser: null
      }
    }

    const parser = new UAParser(navigator.userAgent)
    const device = parser.getDevice() // { type: 'mobile' | 'tablet' | undefined }
    const os = parser.getOS()
    const browser = parser.getBrowser()

    const type = device.type ?? 'desktop'

    return {
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      type,
      os,
      browser
    }
  }, [])
}
