import { Button, Input } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { loginSchema } from '../../schemas/auth'
import { loginSuccess } from '../../store/slices/authSlice'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const handleLogin = handleSubmit(
    async (data) => {
      console.log(data)

      // Aquí puedes agregar la lógica para manejar el inicio de sesión simulado
      const loginData = data
      console.log('Login data:', loginData)

      if (loginData.identifier === 'kevin' && loginData.password === '1234') {
        alert('Inicio de sesión exitoso')

        dispatch(
          loginSuccess({
            user: {
              id: '1',
              name: 'Kevin',
              email: 'kevin@example.com'
            },
            token: 'fake-jwt-token'
          })
        )

        navigate('/admin') // Redirige al usuario a la página de administración después del inicio de sesión exitoso

        return
      } else {
        alert('Usuario o contraseña incorrectos')
      }
    },
    (onerrors) => {
      console.log('Error en el formulario:')
      console.log(onerrors)
    }
  )

  return (
    <section className='flex flex-col items-center justify-center min-h-full space-y-8'>
      <h1 className='text-4xl font-bold'>Login</h1>

      <div className=' max-w-md bg-white p-8 rounded shadow-lg'>
        <form className='space-y-6' onSubmit={handleLogin}>
          <Input
            label='Usuario'
            type='text'
            fullWidth
            {...register('identifier', { required: true })}
            isInvalid={!!errors.identifier}
            errorMessage={errors.identifier?.message}
          />
          <Input
            label='Password'
            type='password'
            fullWidth
            {...register('password', { required: true })}
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
          />
          <Button type='submit' color='primary' fullWidth>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </section>
  )
}

export default Login
