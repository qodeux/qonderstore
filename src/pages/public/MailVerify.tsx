import { useEffect, useState } from 'react'
import { Link } from 'react-router'

const MailVerify = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Token no encontrado')
      return
    }

    // 🔹 Llamar a tu Netlify Function para validar el token
    fetch('/.netlify/functions/jwt-email-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        //console.log('Status:', res.status)

        const data = await res.json()

        if (res.ok && data.verified) {
          setStatus('success')
          setMessage('¡Todo listo! ')
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

  return (
    <section className='container mx-auto  h-full items-center justify-center flex'>
      <div className='text-center p-8 bg-white rounded-lg shadow-md max-w-lg'>
        {status === 'success' && (
          <div>
            <img src='/errors/rest.webp' className='max-h-[300px] mx-auto' alt='' />
            <h2 className='font-bold text-3xl mb-4'>Verificación realizada</h2>
            <p className='text-sm mb-8'>
              Gracias por verificar tu correo electrónico. Si todavía no tienes acceso, espera la confirmación de tu solicitud o envíanos un
              mensaje por{' '}
              <Link to='https://wa.me/1234567890' className='text-primary'>
                Whatsapp
              </Link>{' '}
              para atender tu solicitud rápidamente.
            </p>
            <p className='text-green-600 font-semibold'>{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <img src='/errors/houston.webp' className='max-h-[300px] mx-auto' alt='' />
            <h2 className='font-bold text-2xl mb-4'>Houston... tenemos un problema</h2>
            {message === 'Token expirado' && (
              <p className='text-sm mb-8'>
                El enlace de verificación ha caducado. Si tu cuenta ya fue creada, puedes solicitar un nuevo enlace. En caso de no tener una
                cuenta,puedes verificar tu correo una vez que seas aceptado.
              </p>
            )}

            {message === 'Token inválido' && (
              <p className='text-sm mb-8'>
                El enlace de verificación no es válido. ¿Cómo has llegado aquí? Si recibiste este enlace por error, por favor contáctanos.
                Si deseas crear una cuenta en nuestro sitio puedes{' '}
                <Link to='/' className='text-primary '>
                  solicitar tu acceso aquí.
                </Link>
              </p>
            )}
            {message === 'El token ya fue utilizado' && (
              <p className='text-sm mb-8'>
                Ya se ha realizado la verificación de este correo. No es necesario verificarlo nuevamente. Puedes acceder al{' '}
                <Link to='/login' className='text-primary'>
                  sitio aquí.
                </Link>{' '}
                si todavía no tienes acceso, espera la confirmación de tu solicitud o envíanos un mensaje por{' '}
                <Link to='https://wa.me/1234567890' className='text-primary'>
                  Whatsapp
                </Link>{' '}
                para atender tu solicitud rápidamente.
              </p>
            )}

            <p className='text-red-600 font-semibold'>{message}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default MailVerify
