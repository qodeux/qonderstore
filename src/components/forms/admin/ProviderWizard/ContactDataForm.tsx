import { Autocomplete, AutocompleteItem, Input, Spinner, Switch } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { locationService } from '../../../../services/locationService'
import type { Neighborhood } from '../../../../types/location'

const ContactDataForm = () => {
  const { control, watch, trigger, setValue, setError, clearErrors, getValues } = useFormContext()
  const [SearchingPostalCode, setSearchingPostalCode] = useState(false)
  const [neighborhoodsOptions, setNeighborhoodsOptions] = useState<Neighborhood[]>([])

  // Concurrencia / control
  const fetchVersionRef = useRef(0) // incrementa por cada búsqueda
  const pendingDesiredRef = useRef('') // colonia deseada capturada antes de limpiar
  const clearVersionRef = useRef(0) // para remounts durante limpiezas
  const prevAddAddressRef = useRef<boolean | null>(null) // <-- para detectar transición true→false

  // Remount del Autocomplete cuando cambian CP/opciones o cuando limpiamos todo
  const [autoKey, setAutoKey] = useState('')

  const addAddress = watch('switchAddAddress', false)
  const postalCodeRaw = useWatch({ control, name: 'postal_code' })
  const postalCode = postalCodeRaw && postalCodeRaw.length === 5 ? postalCodeRaw : undefined
  const neighborhood = useWatch({ control, name: 'neighborhood' }) // string | undefined

  // ---------- LIMPIEZAS CUANDO NO HAY CP VÁLIDO ----------
  useEffect(() => {
    // Si el CP se borra o es inválido (<5), limpiamos ciudad/estado, colonias y selección
    if (!postalCodeRaw || postalCodeRaw.length !== 5) {
      setNeighborhoodsOptions([])
      setValue('city_state', '', { shouldDirty: false })
      setValue('neighborhood', undefined, { shouldDirty: false, shouldValidate: true })
      setValue('neighborhood_data', '', { shouldDirty: false })
      setAutoKey(`auto-clear-${++clearVersionRef.current}`)
    }
  }, [postalCodeRaw, setValue])

  // ---------- SOLO limpiar TODO cuando el usuario apaga el switch (true → false) ----------
  useEffect(() => {
    const prev = prevAddAddressRef.current
    prevAddAddressRef.current = addAddress
    if (prev === true && addAddress === false) {
      // cancelar fetch en curso e indicadores
      fetchVersionRef.current++
      setSearchingPostalCode(false)

      // limpiar TODOS los campos de dirección (incluye CP)
      setNeighborhoodsOptions([])
      setValue('postal_code', '', { shouldDirty: true, shouldValidate: true })
      setValue('city_state', undefined, { shouldDirty: true })
      setValue('neighborhood', undefined, { shouldDirty: true, shouldValidate: true })
      setValue('neighborhood_data', '', { shouldDirty: true })
      setValue('address', '', { shouldDirty: true, shouldValidate: true })
      setAutoKey(`auto-switch-off-${++clearVersionRef.current}`)
    }
  }, [addAddress, setValue])

  // Si activan "Agregar dirección" sin CP válido, limpia para no arrastrar datos del edit anterior
  useEffect(() => {
    if (addAddress) {
      const pc = getValues('postal_code')

      if (!pc || pc.length !== 5) {
        setNeighborhoodsOptions([])
        setValue('city_state', '', { shouldDirty: false })
        setValue('neighborhood', undefined, { shouldDirty: false, shouldValidate: true })
        setValue('neighborhood_data', '', { shouldDirty: false })
        setAutoKey(`auto-add-${++clearVersionRef.current}`)
      }
    }
  }, [addAddress, getValues, setValue])

  // ---------- FETCH POR CP ----------
  useEffect(() => {
    const run = async () => {
      if (!postalCode) return

      // Captura lo que el formulario "quiere" antes de limpiar
      const desiredBeforeClear = getValues('neighborhood')
      pendingDesiredRef.current = desiredBeforeClear == null ? '' : String(desiredBeforeClear)

      // Limpia dependencias para evitar rebotes mientras buscamos
      setValue('neighborhood', undefined, { shouldDirty: false, shouldValidate: false })
      setNeighborhoodsOptions([])
      setValue('city_state', '', { shouldDirty: false })

      const isValid = await trigger('postal_code')
      if (!isValid) return

      const myVersion = ++fetchVersionRef.current
      setSearchingPostalCode(true)

      let cpData: Neighborhood[] = []
      try {
        cpData = await locationService.fetchPostalCodeData(postalCode)
      } catch {
        cpData = []
      }

      // Otra búsqueda más nueva ya corrió
      if (fetchVersionRef.current !== myVersion) return

      setSearchingPostalCode(false)

      if (!cpData?.length) {
        setError('city_state', { message: 'El código postal no existe' })
        setNeighborhoodsOptions([])
        setAutoKey(`auto-${postalCode}-${myVersion}-empty`)
        return
      }

      // Publica ciudad/estado y opciones
      const first = cpData[0]
      setValue('city_state', `${first.D_mnpio}, ${first.d_estado}`, { shouldDirty: false })
      setNeighborhoodsOptions(cpData)

      // Forzamos remount del Autocomplete para que respete selectedKey con nuevas opciones
      setAutoKey(`auto-${postalCode}-${myVersion}`)
    }

    run()
  }, [postalCode, trigger, setValue, setError, getValues])

  // ---------- SELECCIÓN DETERMINISTA AL CAMBIAR OPCIONES ----------
  useEffect(() => {
    if (!neighborhoodsOptions.length) return

    // Prioridad: (a) valor más reciente en el form (por si reset() lo metió),
    //            (b) valor capturado antes de limpiar,
    //            (c) primera opción
    const newestDesired = getValues('neighborhood')
    const candidates = [newestDesired == null ? '' : String(newestDesired), pendingDesiredRef.current].filter(Boolean) as string[]

    let next = ''
    for (const cand of candidates) {
      if (neighborhoodsOptions.some((n) => String(n.id) === String(cand))) {
        next = String(cand)
        break
      }
    }
    if (!next) next = String(neighborhoodsOptions[0].id)

    // Solo escribe si es diferente o inválido
    if (!neighborhoodsOptions.some((n) => String(n.id) === String(neighborhood))) {
      setValue('neighborhood', next, { shouldDirty: false, shouldValidate: true })
      clearErrors(['neighborhood'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neighborhoodsOptions])

  // ---------- Sincroniza hidden con la colonia actual ----------
  useEffect(() => {
    const key = neighborhood == null ? '' : String(neighborhood)
    const n = neighborhoodsOptions.find((nn) => String(nn.id) === key) ?? null
    setValue('neighborhood_data', n ? JSON.stringify(n) : '', { shouldDirty: false })
  }, [neighborhood, neighborhoodsOptions, setValue])

  return (
    <form className='space-y-2'>
      <Controller
        name='alias'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Alias'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      <Controller
        name='name'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Nombre'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      <Controller
        name='phone'
        control={control}
        render={({ field, fieldState }) => (
          <PatternFormat
            customInput={Input}
            format='## #### ####'
            label='Teléfono'
            type='text'
            variant='bordered'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      <Controller
        name='email'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Email'
            type='text'
            variant='bordered'
            size='sm'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            {...field}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      <Controller
        name='switchAddAddress'
        control={control}
        render={({ field }) => (
          <Switch
            size='sm'
            isSelected={!!field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            name={field.name}
          >
            ¿Agregar dirección?
          </Switch>
        )}
      />

      {addAddress && (
        <>
          <Controller
            name='postal_code'
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label='Código Postal'
                type='text'
                variant='bordered'
                size='sm'
                maxLength={5}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                classNames={{ inputWrapper: 'bg-white' }}
                endContent={SearchingPostalCode && <Spinner size='sm' />}
                isDisabled={SearchingPostalCode}
                isClearable
                value={field.value ?? ''}
                onValueChange={(val) => {
                  const onlyDigits = val.replace(/\D/g, '').slice(0, 5)
                  field.onChange(onlyDigits)
                }}
                onClear={() => {
                  field.onChange('')
                  setNeighborhoodsOptions([])
                  setValue('city_state', '', { shouldDirty: true, shouldValidate: true })
                  setValue('neighborhood', undefined, { shouldDirty: true, shouldValidate: true })
                  setValue('neighborhood_data', '', { shouldDirty: true })
                  setAutoKey(`auto-clear-${++clearVersionRef.current}`)
                }}
                onBlur={field.onBlur}
                inputMode='numeric'
                pattern='\d*'
              />
            )}
          />

          <Controller
            name='city_state'
            control={control}
            render={({ field, fieldState }) => (
              <p className={`text-xs ml-2 ${fieldState.error ? 'text-danger' : 'text-primary'}`}>
                {fieldState.error ? fieldState.error.message : field.value}
              </p>
            )}
          />

          {!!neighborhoodsOptions.length && (
            <>
              <Controller
                key={autoKey} // remonta cuando cambiamos CP/opciones o cuando limpiamos todo
                name='neighborhood'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label='Selecciona una colonia'
                    size='sm'
                    variant='bordered'
                    classNames={{ base: 'bg-white' }}
                    selectedKey={field.value === undefined || field.value === null || field.value === '' ? undefined : String(field.value)}
                    onSelectionChange={(key) => {
                      const k = key == null ? '' : String(key)
                      field.onChange(k)
                    }}
                  >
                    {neighborhoodsOptions.map((n) => (
                      <AutocompleteItem key={String(n.id)}>{n.d_asenta}</AutocompleteItem>
                    ))}
                  </Autocomplete>
                )}
              />
              <Controller name='neighborhood_data' control={control} render={({ field }) => <input {...field} type='hidden' />} />
            </>
          )}

          <Controller
            name='address'
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label='Calle y número'
                type='text'
                variant='bordered'
                size='sm'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message as string}
                {...field}
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />
        </>
      )}
    </form>
  )
}

export default ContactDataForm
