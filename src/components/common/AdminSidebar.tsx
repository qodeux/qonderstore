import React, { useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, LayoutDashboard, Package, Percent, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { logoutUser } from '../../store/slices/authSlice'
import type { AppDispatch, RootState } from '../../store/store'

interface AdminSidebarProps {
  isOpen: boolean
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href?: string
  submenu?: {
    label: string
    href: string
    icon?: React.ReactNode
  }[]
  allowedRoles?: string[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className='w-5 h-5' />,
    href: '/admin'
  },
  {
    label: 'Catálogo',
    icon: <Package className='w-5 h-5' />,
    submenu: [
      { label: 'Categorías', href: '/admin/categorias' },
      { label: 'Productos', href: '/admin/productos' },
      { label: 'Promociones', href: '/admin/promociones', icon: <Percent className='w-4 h-4' /> }
    ]
  },
  //   {
  //     label: 'Pedidos',
  //     icon: <ShoppingBag className='w-5 h-5' />,
  //     href: '/admin/pedidos'
  //   },
  //   {
  //     label: 'Solicitudes',
  //     icon: <ClipboardList className='w-5 h-5' />,
  //     href: '/admin/solicitudes'
  //   },
  {
    label: 'Proveedores',
    icon: <Users className='w-5 h-5' />,
    href: '/admin/proveedores'
  },
  {
    label: 'Usuarios',
    icon: <Users className='w-5 h-5' />,
    href: '/admin/usuarios',
    allowedRoles: ['admin']
  }
  //   {
  //     label: 'Mensajes',
  //     icon: <MessageSquare className='w-5 h-5' />,
  //     href: '/admin/mensajes'
  //   },
  //   {
  //     label: 'Chat',
  //     icon: <MessageCircle className='w-5 h-5' />,
  //     href: '/admin/chat'
  //   },
  //   {
  //     label: 'Configuración',
  //     icon: <Settings className='w-5 h-5' />,
  //     submenu: [
  //       { label: 'Medios de Pago', href: '/admin/configuracion/pagos', icon: <CreditCard className='w-4 h-4' /> },
  //       { label: 'Zonas de Envío', href: '/admin/configuracion/envios', icon: <Truck className='w-4 h-4' /> },
  //       { label: 'Preguntas Frecuentes', href: '/admin/configuracion/faq', icon: <HelpCircle className='w-4 h-4' /> },
  //       { label: 'Datos de Contacto', href: '/admin/configuracion/contacto', icon: <Phone className='w-4 h-4' /> },
  //       { label: 'Enlaces Útiles', href: '/admin/configuracion/enlaces', icon: <LinkIcon className='w-4 h-4' /> }
  //     ]
  //   }
]

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const { user } = useSelector((state: RootState) => state.auth)

  const toggleExpand = (label: string) => {
    setExpandedItem(expandedItem === label ? null : label)
  }

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const isSubmenuActive = (submenu: { href: string }[]) => {
    return submenu.some((item) => isActive(item.href))
  }

  return (
    <aside
      className={`
        sticky top-0 bg-white border-r w-64 
        transition-transform duration-300 z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-64'}
      `}
    >
      <nav className='p-4'>
        <ul className='space-y-2'>
          {/* Solo mostrar items permitidos por rol */}
          {menuItems
            //.filter((item) => !item.allowedRoles || item.allowedRoles.includes(user?.role))
            .map((item, index) => (
              <li key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`
                      flex items-center w-full gap-2 px-4 py-2 rounded
                      transition-colors duration-200
                      ${isSubmenuActive(item.submenu) ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                    >
                      {item.icon}
                      <span className='flex-1'>{item.label}</span>
                      <motion.div animate={{ rotate: expandedItem === item.label ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className='w-4 h-4' />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expandedItem === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className='overflow-hidden'
                        >
                          <div className='ml-4 mt-2 space-y-1'>
                            {item.submenu.map((subItem, subIndex) => (
                              <button
                                key={subIndex}
                                onClick={() => navigate(subItem.href)}
                                className={`
                                flex items-center w-full gap-2 px-4 py-2 rounded
                                transition-colors duration-200
                                ${isActive(subItem.href) ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-100'}
                              `}
                              >
                                {subItem.icon}
                                <span>{subItem.label}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(item.href!)}
                    className={`
                    flex items-center w-full gap-2 px-4 py-2 rounded
                    transition-colors duration-200
                    ${isActive(item.href!) ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          {/* <li>
            <button
              onClick={handleLogout}
              className='flex items-center w-full gap-2 px-4 py-2 text-red-600 rounded hover:bg-red-50 transition-colors duration-200'
            >
              <LogOut className='w-5 h-5' />
              <span>Cerrar Sesión</span>
            </button>
          </li> */}
        </ul>
      </nav>
    </aside>
  )
}

export default AdminSidebar
