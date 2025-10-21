import { Handler } from '@netlify/functions'
import { supabaseAdmin } from '../lib/supabase'

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    }
  }

  try {
    const { id, password } = JSON.parse(event.body || '{}')

    console.log('Datos recibidos:', { id, password })

    if (!id || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Se requiere id y password' })
      }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password
    })

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Password actualizado' })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error del servidor: ${err}` })
    }
  }
}

export { handler }
