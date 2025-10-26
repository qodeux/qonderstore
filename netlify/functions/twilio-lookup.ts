// netlify/functions/twilio-lookup.ts
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
    const body = event.body ? JSON.parse(event.body) : {}
    const phone: string | undefined = body.phone

    if (!phone) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Phone number is required' })
      }
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Twilio credentials are not configured' })
      }
    }

    const client = twilio(accountSid, authToken)
    // Normaliza a MX (+52) si no viene con prefijo. Además, limpia no-dígitos.
    const digits = phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('+') ? phone : `+52${digits}`

    const lookupResult = await client.lookups.v2.phoneNumbers(formattedPhone).fetch({ fields: ['line_type_intelligence'] })

    const response = {
      isValid: (lookupResult as any).valid ?? Boolean((lookupResult as any).phoneNumber),
      isMobile: lookupResult.lineTypeIntelligence?.type === 'mobile',
      carrier: lookupResult.carrier?.name,
      countryCode: lookupResult.countryCode
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message ?? 'Internal error' })
    }
  }
}
