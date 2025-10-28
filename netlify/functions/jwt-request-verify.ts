import type { Handler } from '@netlify/functions'
import { supabaseAdmin } from '../lib/supabase'
import { cors, verifyEmailToken } from './_jwt'

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: 'ok' }
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' }

    const { token } = JSON.parse(event.body || '{}')
    if (!token) return { statusCode: 400, headers: cors(), body: 'Missing token' }

    // 1) Verifica firma/exp
    const payload = await verifyEmailToken<{ email: string; jti: string; purpose: string }>(token)

    //console.log('Payload', payload)

    if (payload.purpose !== 'create_account') {
      return { statusCode: 400, headers: cors(), body: 'Invalid purpose' }
    }

    // 2) Revisa jti en BD y single-use
    const { data: rows, error } = await supabaseAdmin.from('email_tokens').select('*').eq('jti', payload.jti).limit(1)
    if (error) throw error

    const rec = rows?.[0]
    if (!rec) return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'El token no fue encontrado' }) }
    if (rec.used_at) return { statusCode: 409, headers: cors(), body: JSON.stringify({ error: 'El token ya fue utilizado' }) }
    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return { statusCode: 410, headers: cors(), body: JSON.stringify({ error: 'El token ha expirado' }) }
    }
    if (rec.email !== payload.email) {
      return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'El token no coincide' }) }
    }

    // 3) Marca como usado + verifica email (transacción sencilla)
    const { error: upd1 } = await supabaseAdmin
      .from('email_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('jti', payload.jti)
      .is('used_at', null) // asegura single-use
    if (upd1) throw upd1

    const { data, error: requestAccessError } = await supabaseAdmin.from('request_access').select('*').eq('email', payload.email).single()

    if (requestAccessError) throw requestAccessError

    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Invalid token'
    return {
      statusCode: 401,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: message })
    }
  }
}
