import { Input } from '@heroui/react'
import { Eye, EyeOff, RotateCcwKey } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'

const UserDataForm = () => {
  const {
    control,
    setValue,
    clearErrors,
    resetField,
    reset,
    getValues,
    formState: { dirtyFields }
  } = useForm()

  const [showPass, setShowPass] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  // Usuario a minúsculas, sin espacios ni caracteres especiales excepto - _
  const handleUserNameChange = (value: string) => {
    const formattedValue = value
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-_]/g, '')
    return formattedValue
  }

  // Determina si lo único sucio es 'password'
  const onlyPasswordDirty = () => {
    const keys = Object.keys(dirtyFields ?? {})
    return keys.length === 1 && !!(dirtyFields as Record<string, unknown>).password
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
  return (
    <form className='space-y-2'>
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
            isReadOnly
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            classNames={{ inputWrapper: 'bg-white' }}
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

      <Controller
        name='full_name'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Nombre completo'
            type='text'
            size='sm'
            variant='bordered'
            isInvalid={!!fieldState.error}
            classNames={{ inputWrapper: 'bg-white' }}
            errorMessage={fieldState.error?.message}
            {...field}
          />
        )}
      />

      <Controller
        name='user_name'
        control={control}
        render={({ field, fieldState }) => (
          <Input
            label='Usuario'
            type='text'
            size='sm'
            variant='bordered'
            onChange={(e) => field.onChange(handleUserNameChange(e.target.value))}
            value={field.value || ''}
            maxLength={30}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message as string}
            classNames={{ inputWrapper: 'bg-white' }}
          />
        )}
      />

      {changePassword && (
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
                </div>
              }
            />
          )}
        />
      )}

      <button type='button' className='flex items-center text-sm gap-1' onClick={handleToggleChangePassword}>
        <RotateCcwKey size='20' />
        {changePassword ? 'Cancelar cambio' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

export default UserDataForm
