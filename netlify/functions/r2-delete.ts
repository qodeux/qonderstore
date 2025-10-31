import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { key } = JSON.parse(event.body || '{}')
    if (!key) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing key' }) }
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, key })
    }
  } catch (e: any) {
    console.error('Error deleting object:', e)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message || 'Error deleting object' })
    }
  }
}
