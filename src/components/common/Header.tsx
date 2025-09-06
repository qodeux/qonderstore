import { Button, Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { logout } from '../../store/slices/authSlice'
import type { RootState } from '../../store/store'

const Header = () => {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isAuthenticated)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Aquí puedes agregar la lógica para manejar el cierre de sesión
    console.log('Cerrando sesión...')
    dispatch(logout())
    navigate('/')
  }

  return (
    <Navbar className='bg-black text-white'>
      <NavbarBrand>
        <p className='font-bold text-inherit'>qonderstore</p>
      </NavbarBrand>
      {isLoggedIn && (
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
          {isLoggedIn ? (
            <Button color='danger' onPress={handleLogout}>
              Logout
            </Button>
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
