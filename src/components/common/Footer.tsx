import { faFacebook, faInstagram, faTelegram, faTiktok, faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Divider, Link } from '@heroui/react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'

type Props = { variant?: 'compact' | 'full' }

const Footer = ({ variant = 'full' }: Props) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const year = new Date().getFullYear()

  const AuthenticatedLinks = [
    { href: '/envios', label: 'Información de Envíos' },
    { href: '/faq', label: 'Preguntas Frecuentes' },
    { href: '/terminos', label: 'Términos y condiciones' },
    { href: '/privacidad', label: 'Política de Privacidad' }
  ]

  const PublicLinks = [
    { href: '/privacidad', label: 'Aviso de Privacidad' },
    { href: '/terminos', label: 'Términos y condiciones' },
    { href: '/faq', label: 'Preguntas frecuentes' }
  ]

  const links = isAuthenticated ? AuthenticatedLinks : PublicLinks

  return (
    <footer className='bg-zinc-900 text-white pt-8 pb-4'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Company Info */}

          <div className='max-w-xs mx-auto md:mx-0 text-center md:text-left'>
            <div className='text-center md:text-left'>
              {variant === 'full' && (
                <p className='mb-4 text-gray-300 text-center lg:text-left '>
                  Somos tu club privado de confianza con los mejores productos recreativos y artículos de alta calidad.
                </p>
              )}
              <h3 className='text-lg font-bold mb-1'>Síguenos</h3>
              <div className='flex gap-2 justify-center md:justify-start'>
                <a href='https://facebook.com/semillasshop' target='_blank' rel='noopener' className='text-gray-300 hover:text-white'>
                  <FontAwesomeIcon icon={faFacebook} className='h-7 w-7' />
                </a>
                <a href='https://instagram.com/semillasshop' target='_blank' rel='noopener' className='text-gray-300 hover:text-white'>
                  <FontAwesomeIcon icon={faInstagram} className='h-7 w-7' />
                </a>
                <a href='https://t.me/semillasshop' target='_blank' rel='noopener' className='text-gray-300 hover:text-white'>
                  <FontAwesomeIcon icon={faTelegram} className='h-7 w-7' />
                </a>
                <a href='https://tiktok.com/@semillasshop' target='_blank' rel='noopener' className='text-gray-300 hover:text-white'>
                  <FontAwesomeIcon icon={faTiktok} className='h-7 w-7' />
                </a>
                <a href='https://wa.me/34900123456' target='_blank' rel='noopener' className='text-gray-300 hover:text-white'>
                  <FontAwesomeIcon icon={faWhatsapp} className='h-7 w-7' />
                </a>
              </div>
            </div>
          </div>

          {/* Useful Pages */}
          <div className='w-full min-w-0 flex-1'>
            <h3 className='text-lg font-bold mb-1 text-center md:text-right'>Enlaces Útiles</h3>

            {/* Contenedor responsivo de links */}
            <div
              className={`
                flex w-full min-w-0 overflow-x-hidden
                flex-col 
                ${variant === 'full' ? 'items-center lg:items-end' : 'md:flex-row md:flex-wrap md:justify-end md:text-right items-center justify-center text-center'}
                gap-2 lg:gap-1 
              `}
            >
              {links.map((link, i) => (
                <div key={link.href} className={`flex items-center gap-2 `}>
                  <Link href={link.href} className='text-gray-300 hover:text-white transition-colors whitespace-nowrap'>
                    {link.label}
                  </Link>
                  {/* Separador: solo en desktop y no al final */}
                  {i < links.length - 1 && variant === 'compact' && (
                    <Divider orientation='vertical' className='hidden md:block bg-gray-600 h-4' />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-8 pt-4 border-t border-zinc-800 text-center text-gray-300'>
        <p>&copy; {year} qondestore.</p>
      </div>
    </footer>
  )
}

export default Footer
