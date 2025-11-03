import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem
} from '@heroui/react'
import { Power } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import Logo from '../../assets/logo-full-Q.svg?react'
import { logoutUser } from '../../store/slices/authSlice'
import { openModal, setEditMode, setModal } from '../../store/slices/uiSlice'
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

  const handleAccountModalOpen = () => {
    // Aquí puedes agregar la lógica para abrir el modal de cuenta
    console.log('Abriendo modal de cuenta...')
    dispatch(setModal('account'))
    dispatch(setEditMode(true))
    dispatch(openModal())
  }

  return (
    <Navbar className='bg-black text-white fixed top-0 z-50 h-16' maxWidth={isAuthenticated ? 'full' : '2xl'}>
      <NavbarBrand>
        <Link href={isAuthenticated ? (user && ['admin', 'staff'].includes(user.role) ? '/admin' : '/tienda') : '/'}>
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
              <Dropdown placement='bottom-start'>
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as='button'
                    className='transition-transform'
                    src={`https://api.dicebear.com/9.x/shapes/svg?seed=${user?.user_name || 'guest'}`}
                    size='sm'
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label='User Actions' variant='flat'>
                  <DropdownItem key='profile' className='h-14 gap-2'>
                    <p>{user?.full_name || user?.email}</p>
                    <p className='font-bold'>{user?.email}</p>
                    <p className='font-bold'>{user?.role}</p>
                  </DropdownItem>
                  <DropdownItem key='account' onPress={handleAccountModalOpen}>
                    Mi perfil
                  </DropdownItem>
                  <DropdownItem key='help_and_feedback'>Ayuda y soporte</DropdownItem>
                  <DropdownItem key='logout' color='danger' onPress={handleLogout}>
                    <div className='flex items-center gap-2'>
                      <Power size={16} />
                      Cerrar sesión
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
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
