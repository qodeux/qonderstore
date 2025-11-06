// hooks/useAddressComplete.ts
import { useMemo } from 'react'
import { useWatch, type Control, type FieldErrors } from 'react-hook-form'
import type { CheckoutFormInput } from '../schemas/checkout.schema'
import type { Neighborhood } from '../types/location'

const isFiveDigits = (s?: string) => /^\d{5}$/.test((s ?? '').trim())

type UseAddressCompleteArgs = {
  control: Control<CheckoutFormInput>
  neighborhoods: Neighborhood[]
  canShipToCP: boolean
  isLoadingCP: boolean
  errors?: FieldErrors<CheckoutFormInput> // opcional
}

export function useAddressComplete({ control, neighborhoods, canShipToCP, isLoadingCP, errors }: UseAddressCompleteArgs) {
  const [postal_code, state, locality, sublocality, street_address, street_number] = useWatch({
    control,
    name: ['postal_code', 'state', 'locality', 'sublocality', 'street_address', 'street_number']
  })

  const sublocalityExists = neighborhoods.some((n) => String(n.id) === String(sublocality))

  const noFieldErrors =
    !errors?.postal_code && !errors?.state && !errors?.locality && !errors?.sublocality && !errors?.street_address && !errors?.street_number

  const isComplete = useMemo(() => {
    if (isLoadingCP) return false
    if (!canShipToCP) return false
    if (!isFiveDigits(postal_code)) return false
    if (!state?.trim()) return false
    if (!locality?.trim()) return false
    if (!street_address?.trim()) return false
    if (!street_number?.trim()) return false
    if (!sublocality || !sublocalityExists) return false
    // opcional: exige que no haya errores
    if (errors && !noFieldErrors) return false
    return true
  }, [
    isLoadingCP,
    canShipToCP,
    postal_code,
    state,
    locality,
    street_address,
    street_number,
    sublocality,
    sublocalityExists,
    errors,
    noFieldErrors
  ])

  return isComplete
}
