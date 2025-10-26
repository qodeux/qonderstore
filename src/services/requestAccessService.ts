import supabase from '../lib/supabase'
import type { RequestInput } from '../schemas/request.schema'

export const requestAccessService = {
  fetchCategories: async () => {
    const { data: products, error } = await supabase.from('categories_view').select('*')
    if (error) {
      console.error('Error fetching categories:', error)
    }
    return products
  },
  verifyPhoneExists: async (phone: string) => {
    //Comprobamos que el teléfono no exista ya en la base de datos de usuarios
    const { data, error } = await supabase.rpc('check_user_phone_exists', { in_phone: phone })
    if (error) {
      console.error('Error verifying phone existence:', error)
      return { exists: false, error }
    }

    if (data) {
      return { exists: data, msg: 'El número de teléfono ya está en uso' }
    }

    //Comprobamos que el teléfono no exista ya en la base de datos de solicitudes de acceso
    const { data: requestData, error: requestError } = await supabase.rpc('check_request_access_phone_exists', { in_phone: phone })

    if (requestError) {
      console.error('Error verifying request access phone existence:', requestError)
      return { exists: false, error: requestError }
    }

    if (requestData) {
      return { exists: requestData, msg: 'Este número de teléfono ya tiene una solicitud activa' }
    }

    return { exists: false, error: null }
  },
  validatePhone: async (phone: string) => {
    try {
      //Primero verificamos que el teléfono no exista ya en la base de datos
      const { exists, error: verifyError } = await requestAccessService.verifyPhoneExists(phone)

      if (verifyError) {
        return { ok: false, error: 'Error verificando el número de teléfono' }
      }

      if (exists) {
        return { ok: false, error: 'El número de teléfono ya está registrado' }
      }

      const response = await fetch('/.netlify/functions/twilio-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      }).then((r) => r.json())

      return response
    } catch (error) {
      console.error('Error looking up phone number:', error)
      return { error }
    }
  },
  sendOTP: async (phone: string, channel: 'sms' | 'whatsapp' = 'sms', locale: string = 'es') => {
    try {
      const response = await fetch('/.netlify/functions/twilio-otp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel, locale })
      }).then((r) => r.json())
      return response
    } catch (error) {
      console.error('Error sending OTP:', error)
      return { error }
    }
  },
  checkOTP: async (phone: string, code: string) => {
    try {
      const response = await fetch('/.netlify/functions/twilio-otp-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      }).then((r) => r.json())
      return response
    } catch (error) {
      console.error('Error checking OTP:', error)
      return { error }
    }
  },
  sendWelcomeEmail: async (email: string, username: string) => {
    try {
      const response = await fetch('/.netlify/functions/jwt-send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      }).then((r) => r.json())
      return response
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { error }
    }
  },
  createRequest: async (requestAccessData: RequestInput) => {
    const { phone, alias, email } = requestAccessData
    const insertData = { phone, alias, email }

    const { data: requestAccessInserted, error: requestAccessError } = await supabase.from('request_access').insert(insertData)

    if (requestAccessError) {
      console.error('Error inserting requestAccess:', requestAccessError)
      return { error: requestAccessError }
    }
    return {
      data: requestAccessInserted,
      error: null,
      status: 201,
      statusText: 'Created'
    }
  },
  deleteRequest: async (id: number) => {
    console.log('Deleting requestAccess with ID:', id)
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      console.error('Error deleting requestAccess:', error)
    }
  }
}
