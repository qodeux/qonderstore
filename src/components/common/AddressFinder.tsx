import { Alert, Checkbox, Input, Select, SelectItem, Spinner } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
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

type AddressFinderProps = {
  finderModule?: 'checkout' | 'manageAddress'
}
const AddressFinder = ({ finderModule }: AddressFinderProps) => {
  const { control, setValue, clearErrors, getValues, setError, trigger } = useFormContext()

  const [canShipToCP, setCanShipToCP] = useState<boolean>(false)
  const [neighborhoodsOptions, setNeighborhoodsOptions] = useState<Neighborhood[]>([])
  const [isLoadingCP, setIsLoadingCP] = useState(false)
  const [isBannedCP, setIsBannedCP] = useState(false)
  const [searchingPostalCode, setSearchingPostalCode] = useState(false)
  const [hasMarker, setHasMarker] = useState(false)

  const fetchIdRef = useRef(0)

  // 🔹 watchers
  const watchPostalCodeLookup = useWatch({ control, name: 'postal_code_lookup' })
  const watchPostalCode = useWatch({ control, name: 'postal_code' })

  // const [street, streetNumber, locality, state, postalCode] = useWatch({
  //   control,
  //   name: ['street_address', 'street_number', 'locality', 'state', 'postal_code']
  // })

  // // 🔹 Dirección construida desde el formulario → se usa para mover el mapa
  // const addressForMap = useMemo(
  //   () => [street, streetNumber, locality, state, postalCode].filter(Boolean).join(', '),
  //   [street, streetNumber, locality, state, postalCode]
  // )

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

    if (cpData[0]?.is_banned) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setValue('postal_code_lookup', '', { shouldValidate: true, shouldDirty: true })

      setHasMarker(false)

      setIsBannedCP(true)
      return
    }

    // Estado / Municipio
    setValue('state', cpData[0]?.d_estado || '', { shouldDirty: true })
    setValue('locality', cpData[0]?.d_mnpio || '', { shouldDirty: true })

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

  /** Cambio desde el mapa → llena campos */
  const handleChange = async (value: AddressResult) => {
    // Siempre calle y número del mapa
    setValue('street_address', value.components.route || '')
    setValue('street_number', value.components.street_number || '')

    const newCP = (value.components.postal_code ?? '').trim()
    const currentCP = getValues('postal_code') ?? ''

    const currentState = getValues('state') ?? ''
    const currentLocality = getValues('locality') ?? ''

    setValue('google_location', value.coords)

    // ⚠️ Solo toma estado/municipio de Google si TODAVÍA no tienes CP cargado
    // (o sea, si aún no viene de tu BD).
    const hasValidCPBundle = isFiveDigits(currentCP)

    if (!hasValidCPBundle) {
      setValue('state', value.components.state || currentState || '')
      setValue('locality', value.components.locality || currentLocality || '')
    }

    // Si Google trae CP raro (p.ej. P0001), no toques CP/colonias
    if (!isFiveDigits(newCP)) {
      clearErrors(['street_address', 'street_number', 'postal_code', 'locality', 'state', 'sublocality'])
      return
    }

    // A partir de aquí, CP es válido → manda la verdad la BD
    if (newCP !== currentCP) {
      // CP cambió → recarga bundle (estado/municipio/colonias) desde tu BD
      await loadCPBundle(newCP, value.components.sublocality)
    } else {
      // CP igual → NO tocamos estado/municipio, solo colonia
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

  const handleMarkerChange = (hasMarker: boolean) => {
    if (!hasMarker) {
      setHasMarker(false)
    } else {
      setHasMarker(true)
    }
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

  useEffect(() => {
    return () => {
      setCanShipToCP(false)
      setIsBannedCP(false)
      setNeighborhoodsOptions([])
      setValue('postal_code_lookup', '', { shouldValidate: false, shouldDirty: false })
    }
  }, [setValue])

  useEffect(() => {
    if (!hasMarker) {
      //Si no hay marca se borran los campos de dirección
      setValue('postal_code', '', { shouldValidate: true, shouldDirty: true })
      setValue('state', '', { shouldValidate: true, shouldDirty: true })
      setValue('locality', '', { shouldValidate: true, shouldDirty: true })
      setValue('sublocality', '', { shouldValidate: true, shouldDirty: true })
      setValue('street_address', '', { shouldValidate: true, shouldDirty: true })
      setValue('street_number', '', { shouldValidate: true, shouldDirty: true })
      setValue('interior_number', '', { shouldValidate: true, shouldDirty: true })
    }
  }, [hasMarker, setValue])

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

      {!canShipToCP && isBannedCP && (
        <div className='flex justify-center'>
          <Alert className='mt-4 max-w-lg' variant='faded' color='warning'>
            <p>
              Desafortunadamente no realizamos envíos para ese código postal. Intenta con otro código o contáctanos para más información.
            </p>
          </Alert>
        </div>
      )}

      {canShipToCP && (
        <>
          <p className='text-sm mb-4'>Busca tu dirección en el mapa</p>

          <AddressMapPicker
            onChange={handleChange}
            mapHeight={400}
            postalCode={watchPostalCode} // 🔹 ahora CP “real”
            //searchAddress={addressForMap} // 🔹 NUEVO: dirección construida desde el form
            onMarkerChange={handleMarkerChange}
          />

          {hasMarker && (
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
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    classNames={{ inputWrapper: 'bg-white' }}
                    variant='bordered'
                    readOnly
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
                    readOnly
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
                    readOnly
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

              <div className='col-span-3'>
                {finderModule === 'manageAddress' && (
                  <Controller
                    name='is_primary'
                    control={control}
                    defaultValue={false}
                    render={({ field }) => <Checkbox {...field}>Marcar como dirección principal</Checkbox>}
                  />
                )}
              </div>

              <Controller
                control={control}
                name='google_location'
                render={({ field }) => <input type='hidden' value={JSON.stringify(field.value)} />}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AddressFinder
