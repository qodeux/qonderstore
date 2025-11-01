//Funcion para cambiar a formato moneda
export const formatMoney = (amount: number, currency: string = 'MXN', locale: string = 'es-MX'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}
