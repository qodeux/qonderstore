import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { UserInputCreate, UserInputUpdate } from '../schemas/users.schema'

export const userService = {
  fetchUser: async () => {
    const { data: users, error } = await supabase.from('users').select('*')
    if (error) {
      console.error('Error fetching users:', error)
    }
    return users
  },
  createUser: async (userData: UserInputCreate) => {
    //Primero insertar en la tabla auth.users

    const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || 'http://localhost:8888'

    const response = await fetch(`${baseUrl}/.netlify/functions/user-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error creating auth user:', errorData)
      return { error: errorData.error }
    }

    const userAuth = await response.json()

    //Una vez agregado en auth.users, insertar en user_profiles
    const { data: userInserted, error: userError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userAuth.user.id,
          user_name: userData.user_name,
          role: userData.role,
          is_active: true,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('Error inserting user:', userError)

      //Rollback y borrar el usuario creado en auth.users
      await fetch(`${baseUrl}/.netlify/functions/user-transaction`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: userAuth.user.id })
      })

      return { error: userError }
    }

    setTimeout(() => {
      addToast({
        title: 'Usuario agregado',
        description: `El usuario "${userInserted.user_name}" ha sido agregado correctamente.`,
        color: 'success',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return userInserted
  },
  updateUser: async (id: string, userData: UserInputUpdate) => {
    if (!id) {
      console.error('El id del usuario es obligatorio para actualizar')
      return
    }

    if (userData.password) {
      // Actualizar la contraseña en auth.users
      const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || 'http://localhost:8888'
      const response = await fetch(`${baseUrl}/.netlify/functions/user-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          password: userData.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error updating auth user:', errorData)
        return { error: errorData.error }
      }
    }

    const { data: userUpdated, error: userError } = await supabase
      .from('user_profiles')
      .update({
        user_name: userData.user_name,
        role: userData.role,
        //last_activity: userData.last_activity,
        is_active: userData.is_active,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone
      })
      .eq('id', id)
      .select()
      .single()

    if (userError) {
      console.error('Error updating category:', userError)
      return
    }

    setTimeout(() => {
      addToast({
        title: 'Usuario actualizado',
        description: `El usuario ${userUpdated.user_name} ha sido actualizado correctamente.`,
        color: 'primary',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return userUpdated
  },
  deleteUser: async (id: string) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || 'http://localhost:8888'
    console.log('Deleting user with ID:', id)

    // Primero eliminar de auth.users
    const response = await fetch(`${baseUrl}/.netlify/functions/user-transaction`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error deleting auth user:', errorData)
      return { error: errorData.error }
    }

    // Luego eliminar de user_profiles

    const { error } = await supabase.from('user_profiles').delete().eq('id', id)
    if (error) {
      console.error('Error deleting user:', error)
    }

    setTimeout(() => {
      addToast({
        title: 'Usuario eliminado',
        description: `El usuario ha sido eliminado correctamente.`,
        color: 'danger',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)
  }
}
