/* eslint-disable @typescript-eslint/no-explicit-any */
import { addToast } from '@heroui/react'
import type { ReactNode } from 'react'
import supabase from '../lib/supabase'

export type EntityKind = 'products' | 'categories' | 'providers'

export type MenuAction<T> = {
  key: string
  label: string
  onPress: (row: T) => void | Promise<void>
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  icon?: ReactNode
  section?: string
  disabled?: boolean | ((row: T) => boolean)
  hidden?: boolean | ((row: T) => boolean)
}

export type EntityAdapter<T> = {
  table: string
  getId: (row: T) => string | number
  fields?: { active?: keyof T & string; featured?: keyof T & string }
  update?: (id: string | number, patch: Record<string, any>, row: T) => Promise<void>
  delete?: (id: string | number) => Promise<void>
  edit?: (row: T) => void
  onRequestDelete?: (id: string | number, row: T) => void
  afterChange?: () => void
  actions?: MenuAction<T>[] // estáticas
  rowActions?: (row: T) => MenuAction<T>[] // por fila (dinámicas)
}

export const entityRegistry: Record<EntityKind, EntityAdapter<any>> = {
  products: {
    table: 'products',
    getId: (r) => r.id,
    fields: { active: 'is_active', featured: 'featured' },
    update: async (id, patch, row) => {
      await supabase.from('products').update(patch).eq('id', id)

      setTimeout(() => {
        // to see the toast after the table refresh
        addToast({
          title: 'Producto actualizado',
          description: `El producto "${row.name}" ha sido actualizado correctamente.`,
          color: 'primary',
          variant: 'bordered',
          timeout: 4000,
          shouldShowTimeoutProgress: true
        })
      }, 1000)
    },
    actions: [
      // { key: "export", label: "Exportar", onPress: (row) => ... }
    ]
  },
  categories: {
    table: 'categories',
    getId: (r) => r.id,
    fields: { active: 'is_active' }, // sin featured
    update: async (id, patch) => {
      await supabase.from('categories').update(patch).eq('id', id)
    },
    delete: async (id) => {
      await supabase.from('categories').delete().eq('id', id)
    }
  },
  providers: {
    table: 'providers',
    getId: (r) => r.id,
    fields: { active: 'is_active' },
    update: async (id, patch) => {
      await supabase.from('providers').update(patch).eq('id', id)
    },
    delete: async (id) => {
      await supabase.from('providers').delete().eq('id', id)
    },
    actions: [
      // { key: "export", label: "Exportar", onPress: (row) => ... }
    ]
  }
}
