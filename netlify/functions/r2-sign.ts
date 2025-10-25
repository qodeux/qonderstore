import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Handler } from '@netlify/functions'
import { v4 as uuid } from 'uuid'

/**
 * Env vars requeridas (en Netlify):
 * - R2_ACCOUNT_ID       (tu account id de Cloudflare)
 * - R2_ACCESS_KEY_ID    (Access Key para R2)
 * - R2_SECRET_ACCESS_KEY(Secret Key para R2)
 * - R2_BUCKET           (nombre del bucket)
 * - PUBLIC_R2_BASE_URL  (URL pública base, ej: https://cdn.tu-dominio.com  ó  https://<accountid>.r2.cloudflarestorage.com/<bucket>)
 */

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string
  }
})

type FileInput = { name: string; type?: string }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { files, prefix = 'uploads' } = JSON.parse(event.body || '{}') as { files: FileInput[]; prefix?: string }

    if (!Array.isArray(files) || files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'files[] requerido' }) }
    }

    const bucket = process.env.R2_BUCKET as string
    const publicBase = (process.env.PUBLIC_R2_BASE_URL as string)?.replace(/\/$/, '')

    console.log(bucket)

    const items = await Promise.all(
      files.map(async (f) => {
        const ext = f.name.includes('.') ? f.name.substring(f.name.lastIndexOf('.')) : ''
        const key = `${prefix}/${uuid()}${ext}`

        const putCmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: f.type || 'application/octet-stream'
        })

        // URL firmada (PUT) válida ~5 min
        const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: 60 * 5 })

        // URL pública resultante
        // Si usas dominio propio para el bucket público: PUBLIC_R2_BASE_URL = https://cdn.tu-dominio.com
        // Si usas la URL directa de R2: PUBLIC_R2_BASE_URL = https://<accountid>.r2.cloudflarestorage.com/<bucket>
        const publicUrl = `${publicBase}/${key}`

        return { key, uploadUrl, publicUrl }
      })
    )

    return { statusCode: 200, body: JSON.stringify({ items }) }
  } catch (e: any) {
    console.error(e)
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Internal Error' }) }
  }
}
