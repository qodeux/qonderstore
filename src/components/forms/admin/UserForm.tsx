import { Input, Select, SelectItem, Switch, Tooltip } from '@heroui/react'
import { Eye, EyeOff, RotateCcwKey } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'
import { userProfiles } from '../../../types/users'

const colorsOptions = [
  { label: 'Rojo', key: 'red' },
  { label: 'Azul', key: 'blue' },
  { label: 'Verde', key: 'green' },
  { label: 'Amarillo', key: 'yellow' },
  { label: 'Negro', key: 'black' }
]

const UserForm = () => {
  const usersProfiles = useSelector((state: RootState) => state.users.usersProfiles) ?? []
  //const editMode = useSelector((state: RootState) => state.categories.editMode)

  const {
    control,
    formState: { errors }
  } = useFormContext()

  const categoryName = useWatch({ control, name: 'name' })
  //const categorySelected = categories.find((cat) => cat.name === categoryName)
  //const hasChildren = categorySelected ? categories.some((cat) => cat.parent === categorySelected.id) : false

  const [showPass, setShowPass] = useState(false)

  return (
    <form className='space-y-2'>
      <Controller
        name='role'
        control={control}
        render={({ field, fieldState }) => (
          <Select
            label='Tipo de usuario'
            size='sm'
            variant='bordered'
            selectedKeys={field.value ? [String(field.value)] : []}
            onSelectionChange={(keys) => {
              const rawValue = Array.from(keys)[0]
              const parsedValue = rawValue ? Number(rawValue) : undefined
              field.onChange(parsedValue)
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            disallowEmptySelection
          >
            {userProfiles
              .filter((profile) => profile.key != 'customer')
              .map((profile) => (
                <SelectItem key={profile.key}>{profile.name}</SelectItem>
              ))}
          </Select>
        )}
      />
      <Controller
        name='user_name'
        control={control}
        render={({ field }) => (
          <Input
            label='Usuario'
            type='text'
            size='sm'
            variant='bordered'
            maxLength={30}
            isInvalid={!!errors.user_name}
            errorMessage={errors.user_name?.message as string}
            {...field}
          />
        )}
      />
      <Controller
        name='email'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type='email'
            label='Correo electrónico'
            variant='bordered'
            //placeholder='nombre@ejemplo.com'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name='password'
        control={control}
        rules={{
          required: 'La contraseña es obligatoria',
          minLength: { value: 8, message: 'Mínimo 8 caracteres' },
          pattern: {
            // Al menos 1 letra y 1 número. (agrega símbolos si lo necesitas > /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
            value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
            message: 'Debe incluir letras y números'
          }
        }}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type={showPass ? 'text' : 'password'}
            label='Contraseña'
            //placeholder='••••••••'
            autoComplete='new-password'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            variant='bordered'
            endContent={
              <div className='flex space-x-1'>
                <button
                  type='button'
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPass((v) => !v)}
                  className='focus:outline-none'
                >
                  {showPass ? <EyeOff /> : <Eye />}
                </button>
                <Tooltip content='Generar nueva contraseña' placement='top'>
                  <button
                    type='button'
                    //onClick={() => setShowPass((v) => !v)}
                    className='focus:outline-none'
                  >
                    <RotateCcwKey />
                  </button>
                </Tooltip>
              </div>
            }
          />
        )}
      />
      <Controller
        name='full_name'
        control={control}
        render={({ field }) => (
          <Input
            label='Nombre completo'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!errors.full_name}
            errorMessage={errors.full_name?.message as string}
            {...field}
          />
        )}
      />
      <Controller
        name='phone'
        control={control}
        rules={{
          required: 'El teléfono es obligatorio',
          // Formato internacional E.164 (+528112345678). Cambia por /^\d{10}$/ si quieres MX de 10 dígitos.
          pattern: {
            value: /^\+?[1-9]\d{7,14}$/,
            message: 'Formato inválido. Ej: +528121234567 (entre 8 y 15 dígitos sin espacios).'
          }
        }}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type='tel'
            inputMode='tel'
            label='Teléfono'
            maxLength={10}
            //placeholder='+528121234567'
            autoComplete='tel'
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            variant='bordered'
            //description='Usa código de país. Ej: +52 para México.'
          />
        )}
      />

      <Switch aria-label='Activo' size='sm' defaultChecked={true}>
        Activo
      </Switch>
    </form>
  )
}

export default UserForm
