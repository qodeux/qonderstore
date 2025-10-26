import { Link } from 'react-router'

const NotFound = () => {
  return (
    <section className=' h-full flex flex-col items-center justify-center'>
      <img src='/errors/404.webp' className='max-h-[500px] mx-auto' alt='' />
      <h2 className='font-bold text-3xl mb-4 text-center text-balance'>Página fuera de órbita</h2>
      <p className='text-sm'>Este enlace se perdió en el espacio.</p>
      <Link className='text-primary pt-4' to='/'>
        Aterriza de nuevo aquí
      </Link>
    </section>
  )
}

export default NotFound
