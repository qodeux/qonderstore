import { Input, Select, SelectItem, Switch, Tooltip } from '@heroui/react'
import { Eye, EyeOff, RotateCcwKey } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { RootState } from '../../../store/store'
import { userRoles } from '../../../types/users'

const UserForm = () => {
  const {
    control,
    formState: { errors, dirtyFields },
    setValue,
    clearErrors,
    reset,
    resetField,
    getValues
  } = useFormContext()

  const [showPass, setShowPass] = useState(false)
  const isEditing = useSelector((state: RootState) => state.users.isEditing)
  const [changePassword, setChangePassword] = useState(false)

  // Determina si lo único sucio es 'password'
  const onlyPasswordDirty = () => {
    const keys = Object.keys(dirtyFields ?? {})
    return keys.length === 1 && !!(dirtyFields as Record<string, unknown>).password
  }

  // Usuario a minúsculas, sin espacios ni caracteres especiales excepto - _
  const handleUserNameChange = (value: string) => {
    const formattedValue = value
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-_]/g, '')
    return formattedValue
  }

  const handleToggleChangePassword = (e?: React.MouseEvent) => {
    e?.preventDefault()
    setChangePassword((prev) => {
      const next = !prev

      if (next) {
        // Al ACTIVAR: muestra el campo sin marcar dirty todavía
        setValue('password', '', { shouldDirty: false, shouldTouch: false })
        clearErrors('password')
        setShowPass(false)
      } else {
        // Al CANCELAR: limpia el campo y su estado dirty/touched/error
        clearErrors('password')
        resetField('password', {
          defaultValue: '',
          keepDirty: false,
          keepTouched: false,
          keepError: false
        })

        // Si lo ÚNICO sucio era 'password', limpia el dirty global
        if (onlyPasswordDirty()) {
          // Fija los valores actuales como defaults -> isDirty=false
          reset(getValues())
        }

        setShowPass(false)
      }

      return next
    })
  }

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&*'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    // Generar password SÍ debe marcar dirty (cambio real)
    setValue('password', password, { shouldDirty: true, shouldTouch: true })
    clearErrors('password')
  }

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
              field.onChange(rawValue)
            }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            disallowEmptySelection
            classNames={{ base: 'bg-white' }}
          >
            {userRoles
              .filter((profile) => profile.key !== 'customer')
              .map((profile) => (
                <SelectItem key={profile.key}>{profile.label}</SelectItem>
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
            onChange={(e) => field.onChange(handleUserNameChange(e.target.value))}
            value={field.value || ''}
            maxLength={30}
            isInvalid={!!errors.user_name}
            errorMessage={errors.user_name?.message as string}
            classNames={{ inputWrapper: 'bg-white' }}
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
            size='sm'
            autoComplete='email'
            isReadOnly={isEditing}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      {(changePassword || !isEditing) && (
        <Controller
          name='password'
          control={control}
          rules={{
            required: 'La contraseña es obligatoria',
            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
            pattern: {
              // Al menos 1 letra y 1 número.
              value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
              message: 'Debe incluir letras y números'
            }
          }}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              type={showPass ? 'text' : 'password'}
              label='Contraseña'
              autoComplete='new-password'
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              size='sm'
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
              endContent={
                <div className='flex space-x-1'>
                  <button
                    type='button'
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPass((v) => !v)}
                    className='focus:outline-none'
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff /> : <Eye />}
                  </button>
                  <Tooltip content='Generar nueva contraseña' placement='top'>
                    <button type='button' onClick={handleGeneratePassword} className='focus:outline-none' tabIndex={-1}>
                      <RotateCcwKey />
                    </button>
                  </Tooltip>
                </div>
              }
            />
          )}
        />
      )}

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
            classNames={{ inputWrapper: 'bg-white' }}
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
          // E.164 (ej: +528121234567) o cambia a /^\d{10}$/ para 10 dígitos MX
          pattern: {
            value: /^\+?[1-9]\d{7,14}$/,
            message: 'Formato inválido. Ej: +528121234567 (entre 8 y 15 dígitos sin espacios).'
          }
        }}
        render={({ field, fieldState }) => (
          <PatternFormat
            {...field}
            customInput={Input}
            format='## #### ####'
            allowEmptyFormatting
            type='tel'
            inputMode='tel'
            label='Teléfono'
            autoComplete='tel'
            classNames={{ inputWrapper: 'bg-white' }}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            variant='bordered'
            size='sm'
          />
        )}
      />

      <div className='flex justify-between items-center p-1'>
        <Controller
          name='is_active'
          control={control}
          render={({ field }) => (
            <Switch {...field} aria-label='Activo' size='sm' onChange={(isSelected) => field.onChange(isSelected)} isSelected={field.value}>
              Activo
            </Switch>
          )}
        />
        {isEditing && (
          <button type='button' className='flex items-center text-sm gap-1' onClick={handleToggleChangePassword}>
            <RotateCcwKey size='20' />
            {changePassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
          </button>
        )}
      </div>
    </form>
  )
}

export default UserForm
