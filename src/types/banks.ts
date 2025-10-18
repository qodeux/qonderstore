export interface Bank {
  id: string
  code: string
  short_name: string
  full_name: string
}

export const accountTypes = [
  { key: 'clabe', label: 'CLABE' },
  { key: 'account', label: 'Cuenta' },
  { key: 'card', label: 'Tarjeta' }
] as const
export type AccountType = (typeof accountTypes)[number]
