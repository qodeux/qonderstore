import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { AddressInput } from '../schemas/address.schema'
import type { CreateAccountInput } from '../schemas/createAccount.schema'
import type { UserFav, UserInputCreate, UserInputUpdate } from '../schemas/users.schema'

export const userService = {
  fetchUser: async () => {
    const { data: users, error } = await supabase.from('users').select('*')
    if (error) {
      console.error('Error fetching users:', error)
    }
    return users
  },
  registerUser: async (userData: CreateAccountInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    })

    if (error) {
      console.log(error)
      return { error: 'Error al crear el usuario' }
    }

    if (!data.user) throw 'Error'

    //Una vez agregado en auth.users, insertar en user_profiles
    const { data: userInserted, error: userError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: data.user.id,
          user_name: userData.user_name,
          role: 'customer',
          is_active: true,
          email: userData.email,
          phone: userData.phone,
          email_verified: userData.email_verified
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('Error inserting user:', userError)

      //Rollback y borrar el usuario creado en auth.users
      await fetch(`/.netlify/functions/user-transaction`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: data.user.id })
      })

      return { error: userError }
    }

    return userInserted
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
  },
  fetchAdresses: async () => {
    const { data, error } = await supabase.from('user_addresses_view').select('*')
    if (error) {
      console.error('Error fetching addresses:', error)
      return { error }
    }
    return { data }
  },
  addAddress: async (payload: AddressInput) => {
    const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
      return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k as K))) as Omit<T, K>
    }

    const insertData = omit(payload, ['has_marker', 'locality', 'state', 'postal_code_lookup'])

    const { data: addressInserted, error: addressError } = await supabase.from('user_addresses').insert(insertData).select().single()

    if (addressInserted && payload.is_primary) {
      // Si la nueva dirección es primaria, actualizar las demás para que no lo sean
      const { error } = await supabase.rpc('set_primary_address', { addr_id: addressInserted.id })

      if (error) {
        console.error('Error setting primary address:', error)
      }
    }

    if (addressError) {
      console.error('Error inserting address:', addressError)
      return { error: addressError }
    }
    return addressInserted
  },
  deleteAddress: async (addressId: number) => {
    if (!addressId) {
      console.error('El id de la dirección es obligatorio para eliminar')
      return
    }

    const { error, count } = await supabase.from('user_addresses').delete({ count: 'exact' }).eq('id', addressId)

    if (error) {
      throw error
    }

    if (count === 0) {
      console.error('Delete blocked by RLS or record not found')
      throw new Error('No autorizado o registro inexistente')
    }

    //Seleccionar una nueva dirección primaria si la eliminada era primaria
    const { data: remainingAddresses, error: fetchError } = await supabase
      .from('user_addresses')
      .select('*')
      .order('created_at', { ascending: true })
    if (fetchError) {
      console.error('Error fetching remaining addresses:', fetchError)
      return
    }
    if (remainingAddresses && remainingAddresses.length > 0) {
      const hasPrimary = remainingAddresses.some((addr) => addr.is_primary)
      if (!hasPrimary) {
        const newPrimaryId = remainingAddresses[0].id
        const { error: primaryError } = await supabase.rpc('set_primary_address', { addr_id: newPrimaryId })
        if (primaryError) {
          console.error('Error setting new primary address:', primaryError)
        }
      }
    }
  },
  setPrimaryAddress: async (addressId: number) => {
    if (!addressId) {
      console.error('El id de la dirección es obligatorio para establecer como primaria')
      return
    }
    const { error } = await supabase.rpc('set_primary_address', { addr_id: addressId })

    if (error) {
      console.error('Error setting primary address:', error)
      return { error }
    }
  },
  updateAddress: async (payload: AddressInput) => {
    if (!payload.id) {
      console.error('El id de la dirección es obligatorio para actualizar')
      return
    }
    const { data: addressUpdated, error: addressError } = await supabase
      .from('user_addresses')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single()

    if (addressError) {
      console.error('Error updating address:', addressError)
      return
    }
    return addressUpdated
  },
  fetchUserProductRatings: async (userId: string) => {
    const { data, error } = await supabase.from('product_ratings').select('*').eq('user_id', userId)
    if (error) {
      console.error('Error fetching user ratings:', error)
      return { error }
    }
    return { data }
  },
  fetchUserFavorites: async () => {
    const { data, error } = await supabase.from('user_favs').select('*')
    if (error) {
      console.error('Error fetching user favorites:', error)
      return { error }
    }
    return { data }
  },
  addProductFav: async (payload: UserFav) => {
    const { data: favoriteInserted, error: favoriteError } = await supabase.from('user_favs').insert([payload]).select().single()
    if (favoriteError) {
      console.error('Error inserting favorite:', favoriteError)
      throw { error: favoriteError }
    }
    return favoriteInserted
  },
  removeProductFav: async (payload: UserFav) => {
    const { error } = await supabase.from('user_favs').delete().eq('product_id', payload.product_id)
    if (error) {
      console.error('Error deleting favorite:', error)
      throw { error }
    }
  }
}
