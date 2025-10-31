// netlify/functions/r2-get-url.ts
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Handler } from '@netlify/functions'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  // TODO: valida sesión y permisos aquí (JWT/cookie, lookup en DB, etc.)
  // if (!isLoggedIn(event)) return { statusCode: 401, body: 'Unauthorized' }

  const key = event.queryStringParameters?.key
  const expires = parseInt(event.queryStringParameters?.expires ?? '60', 10) // segundos
  if (!key) return { statusCode: 400, body: 'Missing key' }

  const bucket = process.env.R2_BUCKET!
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key
    // Opcionales útiles para inline/descarga con nombre:
    // ResponseContentDisposition: 'inline', // o attachment; filename="archivo.jpg"
    // ResponseContentType: 'image/jpeg',
  })

  const url = await getSignedUrl(s3, cmd, { expiresIn: Math.min(Math.max(expires, 10), 600) }) // 10–600s
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, expiresIn: Math.min(Math.max(expires, 10), 600) })
  }
}
