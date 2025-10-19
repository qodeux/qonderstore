import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { logoutUser } from '../../store/slices/authSlice'
import type { AppDispatch, RootState } from '../../store/store'

const Header = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Aquí puedes agregar la lógica para manejar el cierre de sesión
    console.log('Cerrando sesión...')
    dispatch(logoutUser())
    navigate('/')
  }

  return (
    <Navbar className='bg-black text-white'>
      <NavbarBrand>
        <p className='font-bold text-inherit'>qonderstore</p>
      </NavbarBrand>
      {isAuthenticated && (
        <NavbarContent className='hidden sm:flex gap-4' justify='center'>
          <NavbarItem>
            <Link color='foreground' href='/'>
              Home
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href='/tienda'>Tienda</Link>
          </NavbarItem>
          <NavbarItem>
            <Link color='foreground' href='/admin'>
              Admin
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}
      <NavbarContent justify='end'>
        <NavbarItem>
          {isAuthenticated ? (
            <>
              <span className='mr-4'>Hola, {user?.full_name || user?.email}</span>
              <Button color='danger' onPress={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button as={Link} color='primary' href='/login' variant='flat'>
              Login
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}

export default Header
