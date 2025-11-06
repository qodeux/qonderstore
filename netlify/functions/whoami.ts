// netlify/functions/whoami.ts
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  // Preferible en la API moderna:
  const ipFromContext = (context as any)?.ip as string | undefined

  // Fallback a cabeceras si fuera necesario:
  const hdr = event.headers
  const ipFromHeader =
    hdr['x-nf-client-connection-ip'] ||
    hdr['x-forwarded-for']?.split(',')[0]?.trim() || // por compatibilidad
    undefined

  const ip = ipFromContext || ipFromHeader || 'unknown'
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ip })
  }
}
