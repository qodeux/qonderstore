import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { ProviderCreateInput } from '../schemas/providers.schema'

export const providerService = {
  fetchProviders: async () => {
    const { data: products, error } = await supabase.from('providers_view').select('*')
    if (error) {
      console.error('Error fetching providers:', error)
    }
    return products
  },
  createProvider: async (providerData: ProviderCreateInput) => {
    const { data: providerInserted, error: providerError } = await supabase
      .from('providers')
      .insert([
        {
          alias: providerData.alias,
          name: providerData.name,
          phone: providerData.phone,
          email: providerData.email,
          postal_code: providerData.postal_code,
          address: providerData.address,
          neighborhood: providerData.neighborhood,
          bank: providerData.bank,
          account_type: providerData.account_type,
          account: providerData.account,
          holder_name: providerData.holder_name,
          rfc: providerData.rfc,
          selected_products: providerData.selected_products
        }
      ])
      .select()
      .single()

    if (providerError) {
      console.error('Error inserting provider:', providerError)
      return { error: providerError }
    }

    setTimeout(() => {
      addToast({
        title: 'Proveedor agregado',
        description: `El proveedor "${providerInserted.alias}" ha sido agregado correctamente.`,
        color: 'success',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return providerInserted
  },
  updateProvider: async (id: number, providerData: ProviderCreateInput) => {
    console.log(providerData)

    if (!id) {
      console.error('El id del proveedor es obligatorio para actualizar')
      return
    }
    const { data: providerUpdated, error: providerError } = await supabase
      .from('providers')
      .update({
        alias: providerData.alias,
        name: providerData.name,
        phone: providerData.phone,
        email: providerData.email,
        postal_code: providerData.postal_code || null,
        address: providerData.address || null,
        neighborhood: providerData.neighborhood || null,
        bank: providerData.bank,
        account_type: providerData.account_type,
        account: providerData.account,
        holder_name: providerData.holder_name,
        rfc: providerData.rfc,
        selected_products: providerData.selected_products
      })
      .eq('id', id)
      .select()
      .single()

    if (providerError) {
      console.error('Error updating provider:', providerError)
      return
    }

    setTimeout(() => {
      addToast({
        title: 'Proveedor actualizado',
        description: `El proveedor ${providerUpdated.alias} ha sido actualizado correctamente.`,
        color: 'primary',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)

    return providerUpdated
  },
  deleteProvider: async (id: number) => {
    console.log('Deleting provider with ID:', id)
    const { error } = await supabase.from('providers').delete().eq('id', id)
    if (error) {
      console.error('Error deleting provider:', error)
    }

    setTimeout(() => {
      addToast({
        title: 'Proveedor eliminado',
        description: `El proveedor ha sido eliminado correctamente.`,
        color: 'primary',
        variant: 'bordered',
        shouldShowTimeoutProgress: true,
        timeout: 4000
      })
    }, 1000)
  }
}
