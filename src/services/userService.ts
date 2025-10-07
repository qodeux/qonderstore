import supabase from '../lib/supabase'
import type { UserInput } from '../schemas/users.schema'

export const userService = {
  fetchUser: async () => {
    const { data: users, error } = await supabase.from('users').select('*')
    if (error) {
      console.error('Error fetching users:', error)
    }
    return users
  },
  createUser: async (userData: UserInput) => {
    const { data: userInserted, error: userError } = await supabase
      .from('users')
      .insert([
        {
          user_name: userData.user_name,
          role: userData.role,
          last_activity: userData.last_activity,
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
      return { error: userError }
    }
    return userInserted
  },
  updateUser: async (userData: UserInput) => {
    if (!userData.id) {
      console.error('El id del usuario es obligatorio para actualizar')
      return
    }
    const { data: userUpdated, error: userError } = await supabase
      .from('categories')
      .update({
        user_name: userData.user_name,
        role: userData.role,
        last_activity: userData.last_activity,
        is_active: true,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone
      })
      .eq('id', userData.id)
      .select()
      .single()

    if (userError) {
      console.error('Error updating category:', userError)
      return
    }
    return userUpdated
  },
  deleteUser: async (id: number) => {
    console.log('Deleting user with ID:', id)
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) {
      console.error('Error deleting user:', error)
    }
  }
}
