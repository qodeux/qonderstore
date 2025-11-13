import { Input, Select, SelectItem, Spinner } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { locationService } from '../../services/locationService'
import type { Neighborhood } from '../../types/location'
import AddressMapPicker, { type AddressResult } from './AddressMapPicker'

export type cpDbData = {
  id: number
  d_codigo: string
  d_asenta: string
  d_tipo_asenta: string
  D_mnpio: string
  d_estado: string
  d_ciudad: string
}

const isFiveDigits = (s?: string) => /^\d{5}$/.test((s ?? '').trim())

const normalize = (s?: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const AddressFinder = () => {
  const { control, watch, setValue, clearErrors, getValues, setError, trigger } = useFormContext()
  const [canShipToCP, setCanShipToCP] = useState<boolean>(false)

  const [neighborhoodsOptions, setNeighborhoodsOptions] = useState<Neighborhood[]>([])

  const [isLoadingCP, setIsLoadingCP] = useState(false)
  const [searchingPostalCode, setSearchingPostalCode] = useState(false)

  const fetchIdRef = useRef(0)

  const watchPostalCodeLookup = watch('postal_code_lookup')

  const getCPData = async (postalCode: string) => {
    try {
      return await locationService.fetchPostalCodeData(postalCode)
    } catch {
      return []
    }
  }

  /** Carga bundle por CP: copia a postal_code, setea estado/municipio, llena colonias y selecciona preferida o primera */
  const loadCPBundle = async (cp: string, preferredColoniaName?: string) => {
    if (!isFiveDigits(cp)) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setError('postal_code_lookup', { type: 'manual', message: 'Código postal inválido' })
      return
    }

    // Copia lookup → postal_code
    setValue('postal_code', cp, { shouldValidate: true, shouldDirty: true })

    const myFetchId = ++fetchIdRef.current
    setIsLoadingCP(true)

    const cpData = await getCPData(cp)

    if (myFetchId !== fetchIdRef.current) return // llegó otra búsqueda más nueva

    setIsLoadingCP(false)

    if (!cpData.length) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setError('postal_code_lookup', { type: 'manual', message: 'El código postal no existe' })
      return
    }

    // Estado / Municipio
    setValue('state', cpData[0]?.d_estado || '', { shouldDirty: true })
    setValue('locality', cpData[0]?.D_mnpio || '', { shouldDirty: true })

    // Colonias
    setNeighborhoodsOptions(cpData)
    setCanShipToCP(true)

    // Selección de colonia: preferida (si matchea por nombre) o la primera
    let selected = cpData[0]?.id?.toString() ?? ''
    if (preferredColoniaName) {
      const hit = cpData.find((n: cpDbData) => normalize(n.d_asenta) === normalize(preferredColoniaName))
      if (hit) selected = String(hit.id)
    }

    setValue('sublocality', selected, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    })
  }

  /** Cambio desde el mapa */
  const handleChange = async (value: AddressResult) => {
    // Campos base
    setValue('street_address', value.components.route || '')
    setValue('street_number', value.components.street_number || '')
    setValue('locality', value.components.locality || '')
    setValue('state', value.components.state || '')

    const newCP = (value.components.postal_code ?? '').trim()

    // Si Google trae CP raro (p.ej. P0001), no toques CP/colonias
    if (!isFiveDigits(newCP)) {
      clearErrors(['street_address', 'street_number', 'postal_code', 'locality', 'state', 'sublocality'])
      return
    }

    const currentCP = getValues('postal_code') ?? ''

    if (newCP !== currentCP) {
      // CP cambió → recarga colonias y luego selecciona colonia del mapa (si existe)
      await loadCPBundle(newCP, value.components.sublocality)
    } else {
      // CP igual → solo intenta seleccionar colonia existente por nombre
      if (neighborhoodsOptions.length) {
        const hit = neighborhoodsOptions.find((n) => normalize(n.d_asenta) === normalize(value.components.sublocality))
        const selected = hit ? String(hit.id) : String(neighborhoodsOptions[0].id)
        setValue('sublocality', selected, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
      }
    }

    clearErrors(['street_address', 'street_number', 'postal_code', 'locality', 'state', 'sublocality'])
  }

  /** Buscar por CP inicial (postal_code_lookup) */
  useEffect(() => {
    const run = async () => {
      const lookup = watchPostalCodeLookup ?? ''
      if (!lookup) return

      const ok = await trigger('postal_code_lookup')
      if (!ok) return

      setSearchingPostalCode(true)
      await loadCPBundle(lookup)
      setSearchingPostalCode(false)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPostalCodeLookup])

  return (
    <div>
      {!canShipToCP && (
        <div className='flex flex-col'>
          <p className='text-sm '>
            Antes de continuar necesitamos saber el código postal para verificar la cobertura en la zona, además de ayudarte a localizar tu
            dirección usaremos esta información para calcular los costos de envío.
          </p>
          <Controller
            control={control}
            name='postal_code_lookup'
            render={({ field, fieldState }) => (
              <PatternFormat
                format='#####'
                customInput={Input}
                label='Código Postal'
                size='sm'
                className='w-full sm:max-w-[180px] my-4'
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v.value)}
                inputMode='numeric'
                isAllowed={(vals) => vals.value.length <= 5}
                isClearable
                onClear={() => field.onChange('')}
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                classNames={{ inputWrapper: 'bg-white' }}
                variant='bordered'
                endContent={searchingPostalCode ? <Spinner size='sm' className='mr-2' /> : undefined}
                isDisabled={searchingPostalCode}
              />
            )}
          />
        </div>
      )}

      {canShipToCP && (
        <>
          <p className='text-sm mb-4'>Busca tu dirección en el mapa</p>
          <AddressMapPicker onChange={handleChange} mapHeight={400} postalCode={watchPostalCodeLookup} />

          <div className='grid grid-cols-1 lg:grid-cols-3 max-w-full gap-2 my-4 items-start'>
            {/* CP (editable si quieres) */}
            <Controller
              control={control}
              name='postal_code'
              render={({ field, fieldState }) => (
                <PatternFormat
                  format='#####'
                  customInput={Input}
                  label='Código Postal'
                  size='sm'
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v.value)}
                  inputMode='numeric'
                  isAllowed={(vals) => vals.value.length <= 5}
                  isClearable
                  onClear={() => field.onChange('')}
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  classNames={{ inputWrapper: 'bg-white' }}
                  variant='bordered'
                />
              )}
            />

            <Controller
              control={control}
              name='state'
              render={({ field, fieldState }) => (
                <Input
                  type='text'
                  label='Estado'
                  {...field}
                  size='sm'
                  classNames={{ inputWrapper: 'bg-white' }}
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  variant='bordered'
                />
              )}
            />

            <Controller
              control={control}
              name='locality'
              render={({ field, fieldState }) => (
                <Input
                  type='text'
                  label='Municipio'
                  {...field}
                  size='sm'
                  classNames={{ inputWrapper: 'bg-white' }}
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  variant='bordered'
                />
              )}
            />

            {/* Colonia */}
            <Controller
              control={control}
              name='sublocality'
              render={({ field, fieldState }) => (
                <Select
                  label='Colonia'
                  size='sm'
                  className='w-full'
                  classNames={{ trigger: 'bg-white' }}
                  items={neighborhoodsOptions}
                  disallowEmptySelection
                  isDisabled={isLoadingCP || neighborhoodsOptions.length === 0}
                  selectedKeys={field.value ? new Set([String(field.value)]) : new Set()}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string | undefined
                    field.onChange(key ?? '')
                  }}
                  variant='bordered'
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  endContent={isLoadingCP ? <Spinner size='sm' className='mr-2' /> : undefined}
                >
                  {(item) => <SelectItem key={item.id}>{item.d_asenta}</SelectItem>}
                </Select>
              )}
            />

            {/* Calle / Número / Interior */}
            <div className='lg:col-span-2 grid grid-cols-2 gap-2 lg:grid-cols-[1fr_100px_100px]'>
              <div className='col-span-2 lg:col-span-1'>
                <Controller
                  control={control}
                  name='street_address'
                  render={({ field, fieldState }) => (
                    <Input
                      type='text'
                      label='Calle'
                      {...field}
                      size='sm'
                      classNames={{ inputWrapper: 'bg-white' }}
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      variant='bordered'
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  control={control}
                  name='street_number'
                  render={({ field, fieldState }) => (
                    <Input
                      type='text'
                      label='Número'
                      {...field}
                      size='sm'
                      classNames={{ inputWrapper: 'bg-white' }}
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      variant='bordered'
                    />
                  )}
                />
              </div>

              <div>
                <Controller
                  control={control}
                  name='interior_number'
                  render={({ field, fieldState }) => (
                    <Input
                      type='text'
                      label='Interior'
                      {...field}
                      size='sm'
                      classNames={{ inputWrapper: 'bg-white' }}
                      errorMessage={fieldState.error?.message}
                      isInvalid={!!fieldState.error}
                      variant='bordered'
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AddressFinder
