import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle
} from '@heroui/react'
import { Heart, HelpCircle, HomeIcon, Power, Settings, ShoppingCart, Truck, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import Logo from '../../assets/logo-full-Q.svg?react'
import { logoutUser } from '../../store/slices/authSlice'
import { setCartOpen } from '../../store/slices/uiSlice'
import type { AppDispatch, RootState } from '../../store/store'

const Header = () => {
  const { isAuthenticated, user, favs } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()

  const { items } = useSelector((state: RootState) => state.cart)

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isLoginPage = location.pathname === '/login'
  const isCheckoutPage = location.pathname === '/tienda/checkout'

  const isOpenCart = useSelector((state: RootState) => state.ui.cartOpen)

  const handleLogout = () => {
    console.log('Cerrando sesión...')
    dispatch(logoutUser())
    navigate('/login')
  }

  // const handleAccountModalOpen = () => {
  //   console.log('Abriendo modal de cuenta...')
  //   dispatch(setModal('account'))
  //   dispatch(setEditMode(true))
  //   dispatch(openModal())
  // }

  const handleToggleCart = () => {
    console.log('Abriendo carrito...')
    dispatch(setCartOpen(!isOpenCart))
    // Lógica para abrir el carrito
  }

  const handleGoToFavs = () => {
    navigate('/mi-cuenta?tab=favoritos')
    // Lógica para navegar a la página de favoritos
  }

  const menuItems = [
    { icon: <HomeIcon />, label: 'Tienda', link: '/tienda' },
    { icon: <ShoppingCart />, label: 'Productos', link: '/tienda/productos' },
    { icon: <User />, label: 'Mi cuenta', link: '/mi-cuenta' },
    { icon: <Settings />, label: 'Configuracion', link: '/configuracion' },
    { icon: <Truck />, label: 'Envios', link: '/envios' },
    { icon: <HelpCircle />, label: 'Ayuda y soporte', link: '/ayuda' },
    { icon: <Power />, label: 'Cerrar sesión', link: '/logout' }
  ]

  useEffect(() => {
    //dispatch(setIsMenuOpen(false))
    dispatch(setCartOpen(false))
  }, [location, dispatch])

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      className='bg-black text-white fixed top-0 z-40 h-16'
      maxWidth={isAuthenticated ? 'full' : '2xl'}
    >
      <NavbarMenuToggle aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} className='sm:hidden' />
      <NavbarBrand>
        <Link href={isAuthenticated ? (user && ['admin', 'staff'].includes(user.role) ? '/admin' : '/tienda') : '/'}>
          <Logo className='h-6 md:h-10 text-white max-w-48' />
        </Link>
      </NavbarBrand>

      <NavbarContent justify='end' className='gap-1'>
        {isAuthenticated ? (
          <>
            <div className='hidden md:flex gap-4 mr-4'>
              <NavbarItem>
                <Link href='/tienda' className='text-white'>
                  Tienda
                </Link>
              </NavbarItem>
              <NavbarItem>
                <Link href='/tienda/productos' className='text-white'>
                  Productos
                </Link>
              </NavbarItem>
              <NavbarItem>
                <Link href='/mi-cuenta' className='text-white'>
                  Mi cuenta
                </Link>
              </NavbarItem>
            </div>
            {!isCheckoutPage && (
              <NavbarItem>
                <Badge
                  className='dark'
                  color='danger'
                  content={items.length}
                  shape='circle'
                  classNames={{ badge: 'absolute bottom-3' }}
                  placement='bottom-right'
                  isInvisible={items.length === 0}
                >
                  <Button isIconOnly variant='light' onPress={handleToggleCart} className='text-white' radius='full'>
                    <ShoppingCart />
                  </Button>
                </Badge>
              </NavbarItem>
            )}
            {favs.length > 0 && (
              <NavbarItem>
                <Badge
                  className='dark'
                  color='danger'
                  content={favs.length}
                  shape='circle'
                  classNames={{ badge: 'absolute bottom-3' }}
                  placement='bottom-right'
                  isInvisible={favs.length === 0}
                >
                  <Button isIconOnly variant='light' onPress={handleGoToFavs} className='text-white' radius='full'>
                    <Heart />
                  </Button>
                </Badge>
              </NavbarItem>
            )}
            {/* <NavbarItem>
              <Badge
                className='dark'
                color='danger'
                content={items.length}
                shape='circle'
                classNames={{ badge: 'absolute bottom-3' }}
                placement='bottom-right'
                isInvisible={items.length === 0}
              >
                <Button isIconOnly variant='light' onPress={handleToggleCart} className='text-white' radius='full'>
                  <Bell />
                </Button>
              </Badge>
            </NavbarItem> */}
            <NavbarItem className='hidden md:block ml-4'>
              <Dropdown placement='bottom-start' classNames={{ content: 'mt-5 ' }}>
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
                  {/* <DropdownItem key='account' onPress={handleAccountModalOpen}>
                    Mi perfil
                  </DropdownItem> */}
                  <DropdownItem key='orders'>Mis pedidos</DropdownItem>
                  <DropdownItem key='settings'>Ajustes</DropdownItem>
                  <DropdownItem key='help_and_feedback'>Ayuda y soporte</DropdownItem>
                  <DropdownItem key='logout' color='danger' onPress={handleLogout}>
                    <div className='flex items-center gap-2'>
                      <Power size={16} />
                      Cerrar sesión
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          !isLoginPage && (
            <NavbarItem>
              <Button size='sm' as={Link} color='primary' href='/login' variant='ghost'>
                Login
              </Button>
            </NavbarItem>
          )
        )}
      </NavbarContent>
      <NavbarMenu className='dark bg-black/90 h-auto max-h-fit z-70'>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.label}-${index}`}>
            <Link
              className='w-full gap-2'
              color={index === 2 ? 'primary' : index === menuItems.length - 1 ? 'danger' : 'foreground'}
              href={item.link}
              size='lg'
            >
              {item.icon} {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  )
}

export default Header
