// netlify/functions/user.ts
import type { Handler } from '@netlify/functions'
import { supabaseAdmin } from '../lib/supabase'

type CreateBody = { email?: string; password?: string; full_name?: string }
type DeleteBody = { id?: string }

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

const json = (statusCode: number, payload: unknown) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(payload)
})

const safeParse = <T = unknown>(body?: string | null): T | null => {
  if (!body) return null
  try {
    return JSON.parse(body) as T
  } catch {
    return null
  }
}

const createUser = async (rawBody?: string | null) => {
  const { email, password, full_name } = (safeParse<CreateBody>(rawBody) ?? {}) as CreateBody

  if (!email || !password) {
    return json(400, { error: 'Email y password son requeridos' })
  }

  console.log('Creando usuario:', { email, full_name })

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true
  })

  if (error) {
    console.error('Error al crear el usuario:', error.message)
    return json(500, { error: error.message })
  }

  return json(200, { user: data.user })
}

const deleteUser = async (rawBody?: string | null, query?: Record<string, string>) => {
  const body = safeParse<DeleteBody>(rawBody) ?? {}
  const id = body.id || query?.id

  if (!id) {
    return json(400, { error: 'Se requiere el ID del usuario' })
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    console.error('Error al eliminar usuario:', error.message)
    return json(400, { error: error.message })
  }

  return json(200, { success: true, message: 'Usuario eliminado' })
}

export const handler: Handler = async (event) => {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: JSON_HEADERS,
        body: ''
      }
    }

    switch (event.httpMethod) {
      case 'POST':
        // Crear usuario
        return await createUser(event.body)

      case 'DELETE':
        // Eliminar usuario (id por query ?id=... o body JSON { "id": "..." })
        return await deleteUser(event.body)

      default:
        return json(405, { error: 'Método no permitido. Usa POST o DELETE.' })
    }
  } catch (err) {
    console.error('Excepción no controlada:', err)
    return json(500, { error: 'Error inesperado en el servidor' })
  }
}
