import { Avatar, Chip, Tab, Tabs } from '@heroui/react'
import { Bell, Heart, Package, Settings2, User } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import UserDataForm from '../../components/forms/customer/UserDataForm'
import AccountData from '../../components/user/AccountData'
import Favs from '../../components/user/Favs'
import Notifications from '../../components/user/Notifications'
import OrderHistory from '../../components/user/OrderHistory'
import { useAppSelector } from '../../store/store'

const Account = () => {
  const { user, favs } = useAppSelector((state) => state.auth)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'general'

  const handleTabChange = (key: React.Key) => {
    // Update URL when tab changes
    if (key === 'overview') {
      navigate('/mi-cuenta')
    } else {
      navigate(`/mi-cuenta?tab=${key}`)
    }
  }

  useEffect(() => {
    document.title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - Qonder Store`
  }, [activeTab])

  return (
    <div className='container mx-auto p-2 md:p-8 space-y-6'>
      <section className='flex gap-4 items-center'>
        <Avatar className='w-26 h-26 text-large' src='https://i.pravatar.cc/150?u=a04258114e29026708c' />
        <div>
          <h1 className='text-xl md:text-2xl font-bold items-start md:items-center gap-2 flex flex-col md:flex-row leading-4 mb-2'>
            {user?.user_name}
            <Chip color='primary' variant='bordered'>
              Usuario nuevo
            </Chip>
          </h1>

          <div className='text-gray-600'>
            {user?.email}
            <p className='text-xs'>Correo electrónico verificado</p>
          </div>
          <div className='text-gray-600'>
            {user?.phone}
            <p className='text-xs'>Teléfono</p>
          </div>
        </div>
      </section>

      <section>
        <Tabs aria-label='Options' variant='underlined' fullWidth selectedKey={activeTab} onSelectionChange={handleTabChange}>
          <Tab
            key='general'
            title={
              <div className='flex items-center gap-2'>
                <User size={18} />
                <span className='hidden sm:block'>General</span>
              </div>
            }
          >
            <AccountData />
          </Tab>
          <Tab
            key='pedidos'
            title={
              <div className='flex items-center gap-2'>
                <Package size={18} />
                <span className='hidden sm:block'>Pedidos</span>
              </div>
            }
            className='flex flex-col gap-2'
          >
            <OrderHistory />
          </Tab>
          {favs.length > 0 && (
            <Tab
              key='favoritos'
              title={
                <div className='flex items-center gap-2'>
                  <Heart size={18} />
                  <span className='hidden sm:block'>Favoritos</span>
                </div>
              }
            >
              <Favs />
            </Tab>
          )}
          <Tab
            key='notificaciones'
            title={
              <div className='flex items-center gap-2'>
                <Bell size={18} />
                <span className='hidden sm:block'>Notificaciones</span>
              </div>
            }
            className='flex flex-col gap-2'
          >
            <Notifications />
          </Tab>
          {/* <Tab
            key='messages'
            title={
              <div className='flex items-center gap-2'>
                <MessageSquare size={18} />
                <span className='hidden sm:block'>Mensajes</span>
              </div>
            }
          ></Tab> */}
          <Tab
            key='ajustes'
            title={
              <div className='flex items-center gap-2'>
                <Settings2 size={18} />
                <span className='hidden sm:block'>Ajustes</span>
              </div>
            }
          >
            <section className='grid grid-cols-1 md:grid-cols-2'>
              <div className='space-y-4'>
                <h3 className='text-xl font-bold'>Datos de mi cuenta</h3>
                <UserDataForm />
              </div>
              <div>
                <h3 className='text-xl font-bold'>Configuración de la cuenta</h3>
                <p className='text-gray-600 mb-4'>Administra las configuraciones de tu cuenta.</p>
              </div>
            </section>
          </Tab>
        </Tabs>
      </section>
    </div>
  )
}

export default Account
