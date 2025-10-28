import type { Handler } from '@netlify/functions'
import { render } from '@react-email/render'
import { randomUUID } from 'crypto'
import * as React from 'react'
import { Resend } from 'resend'
import AcceptedRequestEmail from '../../emails/AcceptedRequestEmail'
import RejectedRequestEmail from '../../emails/RejectedRequestEmail'
import { supabaseAdmin } from '../lib/supabase'
import { cors, signEmailToken } from './_jwt'

const resend = new Resend(process.env.RESEND_API_KEY)

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: 'ok' }
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' }

    const body = JSON.parse(event.body || '{}')
    const { email, username, status } = body
    if (!email || !username || !status) return { statusCode: 400, headers: cors(), body: 'Missing parameters' }

    let createAccountLink
    if (status === 'accepted') {
      const jti = randomUUID()
      //const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72) // 72h (3 Días)
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10min Testing

      // 1) Guarda jti en BD
      const { error: insertErr } = await supabaseAdmin.from('email_tokens').insert({
        jti,
        email,
        purpose: 'create_account',
        expires_at: expiresAt.toISOString()
      })
      if (insertErr) throw insertErr

      // 2) Firma JWT
      const token = await signEmailToken(
        {
          email,
          purpose: 'create_account',
          jti
        },
        '72h'
      )

      // 3) Arma URL de verificación
      const siteUrl = process.env.PUBLIC_BASE_URL! // e.g. https://app.tu-dominio.com
      createAccountLink = `${siteUrl}/crear-cuenta?token=${encodeURIComponent(token)}`
    }

    // 4) Render email
    const emailElement = createAccountLink
      ? React.createElement(AcceptedRequestEmail, { username, email, createAccountLink })
      : React.createElement(RejectedRequestEmail, { email })
    const html = await render(emailElement)

    console.log('Enviando correo a ', process.env.DEV_MODE ? process.env.TEST_MAILBOX : email)

    // 5) Envía correo
    await resend.emails.send({
      from: 'Qonderstore <no-responder@notificaciones.qodeux.tech>',
      to: process.env.DEV_MODE ? process.env.TEST_MAILBOX : email,
      subject: 'Actualización de tu solicitud',
      html
    })

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true }) }
  } catch (err: unknown) {
    console.log(err)

    return { statusCode: 500, headers: cors(), body: (err as Error)?.message || 'Error' }
  }
}
