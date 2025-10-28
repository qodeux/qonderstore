import { Button, Input } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { Link, useNavigate } from 'react-router'
import { createAccountInputSchema } from '../schemas/createAccount.schema'
import { userService } from '../services/userService'

interface RequestAccessData {
  email: string
  phone: string
  alias: string
  email_verified: boolean
}

const CreateAccount = () => {
  const navigate = useNavigate()
  const {
    control,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm({ resolver: zodResolver(createAccountInputSchema), mode: 'all', reValidateMode: 'onChange' })

  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando')
  const [userData, setUserData] = useState<RequestAccessData | null>(null)

  const handleCreateAccount = handleSubmit(async (data) => {
    const response = await userService.registerUser(data)

    console.log(response)

    if (response.error) {
      return
    }

    navigate('/tienda', { replace: true })
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setMessage('')
      return
    }

    // Llamar a tu Netlify Function para validar el token
    fetch('/.netlify/functions/jwt-request-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        //console.log('Status:', res.status)

        const data = await res.json()

        if (res.ok && data) {
          setStatus('success')
          console.log(data)

          setUserData(data)
          //setMessage('¡Todo listo! ')
        } else {
          setStatus('error')
          setMessage(data.error || 'Token inválido o expirado')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Ocurrió un error al verificar')
      })
  }, [])

  useEffect(() => {
    reset({
      email: userData?.email,
      phone: userData?.phone,
      user_name: userData?.alias
    })
  }, [userData, reset])

  return (
    <section className='h-full  flex justify-center items-center'>
      {status === 'error' ? (
        <div className='space-y-2 max-w-xs'>
          <img src='/errors/rest.webp' className='max-h-[300px] mx-auto' alt='' />
          <h2 className='font-bold text-3xl mb-4 text-center'>Página restringida</h2>
          <p className='text-sm mb-8'>
            ¡No deberías estar aqui!... si te has equivocado puedes regresar por donde veniste, o{' '}
            <Link to='/' className='text-primary'>
              solicitar acceso al sitio aqui
            </Link>
          </p>
          <p className='text-danger font-semibold text-center'>{message}</p>
        </div>
      ) : (
        <form className='space-y-2 max-w-xs bg-white p-8 shadow-xl' onSubmit={handleCreateAccount}>
          <h4 className='font-bold text-center text-xl'>Crea tu cuenta</h4>
          <p className='text-sm mb-4'>
            Revisa tus datos y crea una contraseña para acceder al sitio, puedes actualizar o cambiar tu usuario más tarde
          </p>
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
                inputMode='tel'
                label='Teléfono'
                autoComplete='tel'
                classNames={{ inputWrapper: 'bg-white' }}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                variant='bordered'
                size='sm'
                isReadOnly
              />
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
                value={field.value || ''}
                maxLength={30}
                isInvalid={!!errors.user_name}
                errorMessage={errors.user_name?.message as string}
                classNames={{ inputWrapper: 'bg-white' }}
                isReadOnly
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

          <Controller
            name='password_confirm'
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
                label='Confirmar contraseña'
                autoComplete='new-password'
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                size='sm'
                variant='bordered'
                classNames={{ inputWrapper: 'bg-white' }}
              />
            )}
          />

          <Controller name='email_verified' control={control} render={({ field }) => <input {...field} type='text' />} />

          <Button fullWidth color='primary' type='submit'>
            Aceptar
          </Button>
        </form>
      )}
    </section>
  )
}

export default CreateAccount
