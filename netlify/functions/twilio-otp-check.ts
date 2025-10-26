import type { Handler } from '@netlify/functions'
import twilio from 'twilio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: 'ok' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !verifyServiceSid) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Twilio env vars are not configured' })
      }
    }

    const { phone, code } = event.body ? JSON.parse(event.body) : {}
    if (!phone || !code) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Phone number and code are required' })
      }
    }

    // Normaliza a E.164: si no trae prefijo, asumimos +52 y limpiamos no-dígitos
    const digits = String(phone).replace(/\D/g, '')
    const formattedPhone = String(phone).startsWith('+') ? String(phone) : `+52${digits}`

    const client = twilio(accountSid, authToken)

    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formattedPhone, code: String(code) })

    const approved = verificationCheck.status === 'approved'

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: approved,
        status: verificationCheck.status // 'approved' | 'pending' | 'canceled' | ...
      })
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message ?? 'Internal error' })
    }
  }
}
