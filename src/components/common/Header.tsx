import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react'
import { Power } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import Logo from '../../assets/logo-full-Q.svg?react'
import { logoutUser } from '../../store/slices/authSlice'
import type { AppDispatch, RootState } from '../../store/store'

const Header = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'

  const handleLogout = () => {
    // Aquí puedes agregar la lógica para manejar el cierre de sesión
    console.log('Cerrando sesión...')
    dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <Navbar className='bg-black text-white fixed top-0 z-50 h-16' maxWidth={isAuthenticated ? 'full' : '2xl'}>
      <NavbarBrand>
        <Link href={isAuthenticated ? '/admin' : '/'}>
          <Logo className='h-10 text-white max-w-48' />
        </Link>
      </NavbarBrand>
      {/* {isAuthenticated && (
        <NavbarContent className='hidden sm:flex gap-4 ' justify='center'>
          <NavbarItem>
            <Link href='/'>Home</Link>
          </NavbarItem>
          <NavbarItem>
            <Link href='/tienda'>Tienda</Link>
          </NavbarItem>
          <NavbarItem>
            <Link href='/admin'>Admin</Link>
          </NavbarItem>
        </NavbarContent>
      )} */}
      <NavbarContent justify='end'>
        <NavbarItem>
          {isAuthenticated ? (
            <>
              <span className='mr-4'> Hola, {user?.full_name?.split(' ')[0] || user?.email}</span>
              <Button color='danger' size='sm' onPress={handleLogout}>
                Logout
                <Power size={16} />
              </Button>
            </>
          ) : (
            !isLoginPage && (
              <Button size='sm' as={Link} color='primary' href='/login' variant='ghost'>
                Login
              </Button>
            )
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}

export default Header
