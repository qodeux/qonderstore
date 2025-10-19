import { Button, Checkbox, Form, Input, Link } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { loginSchema } from '../../schemas/auth'
import { loginUser } from '../../store/slices/authSlice'
import type { AppDispatch, RootState } from '../../store/store'
import LoggedUser from './LoggedUser'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, error } = useSelector((state: RootState) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const handleLogin = handleSubmit(
    async (data) => {
      const loginData = data
      dispatch(loginUser({ email: loginData.identifier, password: loginData.password }))
    },
    (onerrors) => {
      console.log('Error en el formulario:')
      console.log(onerrors)
    }
  )

  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/')
    }
  }, [isAuthenticated, navigate])

  return (
    <section className='flex flex-col h-full w-full items-center justify-center pt-8'>
      <div className='rounded-large flex w-full max-w-sm flex-col gap-4'>
        <div className='flex flex-col items-center pb-6'>
          {/* <AcmeIcon size={60} /> */}
          <p className='text-xl font-medium'>Bienvenido</p>
          <p className='text-small text-default-500'>Inicia sesión en tu cuenta para continuar</p>
        </div>
        <Form className='flex flex-col gap-3' onSubmit={handleLogin}>
          <Input
            label='Correo electrónico o teléfono'
            variant='bordered'
            {...register('identifier')}
            isInvalid={!!errors.identifier}
            errorMessage={errors.identifier?.message as string}
          />
          <Input
            {...register('password')}
            endContent={
              <button type='button' onClick={toggleVisibility}>
                {isVisible ? <EyeOff /> : <Eye />}
              </button>
            }
            label='Contraseña'
            name='password'
            //placeholder='Enter your password'
            type={isVisible ? 'text' : 'password'}
            variant='bordered'
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message as string}
          />
          {error && <p className='text-danger'>{error}</p>}
          <div className='flex w-full items-center justify-between px-1 py-2'>
            <Checkbox name='remember' size='sm'>
              Recordarme
            </Checkbox>
            <Link className='text-default-500' href='#' size='sm'>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Button className='w-full' color='primary' type='submit'>
            Iniciar Sesión
          </Button>
        </Form>

        <p className='text-small text-center'>
          ¿Quieres tener una cuenta?&nbsp;
          <Link href='#' size='sm'>
            Solicita tu acceso aquí
          </Link>
        </p>
      </div>

      <LoggedUser />
    </section>
  )
}

export default Login
