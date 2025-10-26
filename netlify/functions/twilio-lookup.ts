import type { Handler } from '@netlify/functions'
import twilio, { type Twilio } from 'twilio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

type LookupResult = {
  phoneNumber?: string
  valid?: boolean
  countryCode?: string
  carrier?: { name?: string }
  lineTypeIntelligence?: { type?: string }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: 'ok' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }
  }

  try {
    const body = event.body ? (JSON.parse(event.body) as { phone?: string }) : {}
    const phone = body.phone

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

    const client: Twilio = twilio(accountSid, authToken)

    // Normaliza a formato E.164 (México por defecto)
    const digits = phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('+') ? phone : `+52${digits}`

    const lookupResult = (await client.lookups.v2.phoneNumbers(formattedPhone).fetch({ fields: 'line_type_intelligence' })) as LookupResult

    const response = {
      isValid: lookupResult.valid ?? Boolean(lookupResult.phoneNumber),
      isMobile: lookupResult.lineTypeIntelligence?.type === 'mobile',
      carrier: lookupResult.carrier?.name,
      countryCode: lookupResult.countryCode
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message })
    }
  }
}
