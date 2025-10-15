import { Autocomplete, AutocompleteItem, Input, Spinner, Switch } from '@heroui/react'
import { useEffect, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { locationService } from '../../../../services/locationService'
import type { Neighborhood } from '../../../../types/location'

const ContactDataForm = () => {
  const { control, watch, trigger, setValue, setError, clearErrors } = useFormContext()
  const [SearchingPostalCode, setSearchingPostalCode] = useState(false)
  const [neighborhoodsOptions, setNeighborhoodsOptions] = useState<Neighborhood[]>([])

  const addAddress = watch('switchAddAddress', false)

  const postalCode = useWatch({ control, name: 'postal_code' })
  const neighborhood = useWatch({ control, name: 'neighborhood' })

  useEffect(() => {
    const check = async () => {
      // Dispara la validación del campo postal_code
      const isValid = await trigger('postal_code')

      if (isValid) {
        console.log('Código postal válido:', postalCode)
        cpLookupData(postalCode)
      }
    }

    const cpLookupData = async (cp: string) => {
      clearErrors('city_state')
      setSearchingPostalCode(true)

      const cpData: Neighborhood[] = await locationService.fetchPostalCodeData(cp)

      if (cpData && cpData.length > 0) {
        const data = cpData[0]

        setNeighborhoodsOptions(cpData)

        setValue('city_state', `${data.D_mnpio}, ${data.d_estado}`)

        setValue('neighborhood', cpData[0].id)
      } else {
        setError('city_state', { message: 'El código postal no existe' })
        setNeighborhoodsOptions([])
      }

      setSearchingPostalCode(false)
    }

    if (postalCode?.length === 5) {
      check()
    }
  }, [postalCode, trigger, setValue, setError, clearErrors])

  useEffect(() => {
    // Si el usuario borra la colonia, limpia el campo oculto
    if (!neighborhood) {
      setValue('neighborhood_data', '')
    } else {
      setValue('neighborhood_data', JSON.stringify(neighborhoodsOptions.find((n) => n.id == neighborhood) || null))
    }
  }, [neighborhood, setValue, neighborhoodsOptions])

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
                value={field.value ?? ''} // controla siempre el valor
                onValueChange={(val) => {
                  const onlyDigits = val.replace(/\D/g, '').slice(0, 5)
                  field.onChange(onlyDigits) // avisa a RHF
                }}
                onClear={() => {
                  // Limpia el form y fuerza validación/dirty si lo necesitas
                  field.onChange('') // mejor '' que undefined para inputs controlados
                  setValue('city_state', '', { shouldDirty: true, shouldValidate: true })
                  setNeighborhoodsOptions([])
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

          {neighborhoodsOptions && neighborhoodsOptions.length > 0 && (
            <>
              <Controller
                name='neighborhood'
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label='Selecciona una colonia'
                    size='sm'
                    variant='bordered'
                    classNames={{ base: 'bg-white' }}
                    selectedKey={String(field.value) || ''}
                    onSelectionChange={(sel) => {
                      console.log(sel)
                      field.onChange(sel)
                    }}
                  >
                    {neighborhoodsOptions.map((neighborhood: Neighborhood) => (
                      <AutocompleteItem key={neighborhood.id}>{neighborhood.d_asenta}</AutocompleteItem>
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
