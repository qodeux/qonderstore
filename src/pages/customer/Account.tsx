import { Avatar, Button, Card, Chip, Tab, Tabs, useDisclosure } from '@heroui/react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Heart, Package, Settings2, Shield, Star, Trophy, User } from 'lucide-react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router'
import CustomAlert from '../../components/common/CustomAlert'
import UserDataForm from '../../components/forms/customer/UserDataForm'
import ManageAddressModal from '../../components/modals/customer/ManageAddressModal'
import OrderDetailsModal from '../../components/modals/customer/OrderDetailsModal'
import ProductItem from '../../components/store/ProductItem'
import { useProductRatings } from '../../hooks/useProductRatings'
import type { Product } from '../../schemas/products.schema'
import { selectProductsWithBestPromo } from '../../store/selectors/productsWithPromo'
import { setSelectedOrder } from '../../store/slices/storeOrdersSlice'
import { useAppSelector } from '../../store/store'
import { storeOrder_status, storeShipment_status } from '../../types/storeOrders'
import { formatDate } from '../../utils/date'
import { formatMoney } from '../../utils/money'

const Account = () => {
  const dispatch = useDispatch()
  const { user, favs } = useAppSelector((state) => state.auth)
  const products = useSelector(selectProductsWithBestPromo)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useProductRatings({ userId: user?.id })

  // Get the active tab from URL query parameter or default to "overview"
  const activeTab = searchParams.get('tab') || 'general'

  const { items: orders, selectedOrder } = useAppSelector((state) => state.storeOrders)

  const { isOpen: isAddressModalOpen, onOpenChange: onAddressModalOpenChange, onOpen: onAddressModalOpen } = useDisclosure()
  const { isOpen: isOrderDetailsOpen, onOpenChange: onOrderDetailsOpenChange, onOpen: onOrderDetailsOpen } = useDisclosure()

  const favoriteProducts: Product[] = products.filter((product: Product) => favs.find((fav) => fav.product_id === product.id))

  const medals = [
    { id: '1', name: 'Primera Compra', icon: <Star className='w-6 h-6' />, description: 'Realizaste tu primera compra' },
    { id: '2', name: 'Cannasieur', icon: <Star className='w-6 h-6' />, description: 'Haz comprado mas de 10 variedades de flor' },
    { id: '3', name: 'Money Maker', icon: <Star className='w-6 h-6' />, description: 'Realizaste una compra de mas de 10k ' },
    { id: '4', name: 'Comprador Frecuente', icon: <Trophy className='w-6 h-6' />, description: '5 compras realizadas' }
  ]

  const notifications = [
    {
      id: '1',
      title: 'Pedido recibido',
      date: '2000-01-23T01:23:45.678+09:00',
      message: 'Tu pedido ha sido recibido y está siendo procesado.',
      order: '99ce52ff',
      color: 'primary' as const,
      icon: 'Bike'
    },
    {
      id: '2',
      title: 'Pedido enviado',
      date: '2000-01-23T01:23:45.678+09:00',
      message: 'Tu pedido ha sido enviado en la ruta de las 11:00',
      order: '99ce52ff',
      color: 'success' as const,
      icon: 'Truck'
    },
    {
      id: '3',
      title: 'Pedido cancelado',
      date: '2000-01-23T01:23:45.678+09:00',
      message: 'Tu pedido ha sido ha sido cancelado por falta de pago',
      order: '99ce52ff',
      color: 'danger' as const,
      icon: 'CircleOff'
    },
    {
      id: '4',
      title: 'Pago pendiente',
      date: '2000-01-23T01:23:45.678+09:00',
      message: 'Tienes un pago pendiente para el pedido, puedes subir el comprobante aquí',
      order: '99ce52ff',
      color: 'warning' as const,
      icon: 'CreditCard',
      type: 'payment'
    },
    {
      id: '5',
      title: 'Problema con el pedido',
      date: '2000-01-23T01:23:45.678+09:00',
      message: 'Tu pedido ha tenido un problema y  contacta con soporte',
      order: '99ce52ff',
      color: 'danger' as const,
      icon: 'TriangleAlert'
    }
  ]

  const handleAddAddress = () => {
    onAddressModalOpen()
  }

  const handleTabChange = (key: React.Key) => {
    // Update URL when tab changes
    if (key === 'overview') {
      navigate('/mi-cuenta')
    } else {
      navigate(`/mi-cuenta?tab=${key}`)
    }
  }

  const handleOpenOrderDetails = (orderId: string) => {
    dispatch(setSelectedOrder(orderId))
    onOrderDetailsOpen()
  }

  useEffect(() => {
    if (selectedOrder) {
      dispatch(setSelectedOrder(selectedOrder.id))
    }
  }, [dispatch, orders, selectedOrder])

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
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              className='grid grid-cols-1 md:grid-cols-2 space-y-4'
            >
              <div className='space-y-4'>
                <h2 className='font-bold text-xl mb-4'>Datos de mi cuenta</h2>
                <div className='flex items-center gap-2'>
                  <Calendar />
                  <div>
                    <p>{formatDate(user?.created_at, 'short')}</p>
                    <p className=' text-xs'>Miembro desde</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield />
                  <div>
                    <p>Nuevo astronauta </p>
                    <p className=' text-xs'>Nivel de experiencia</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Star />
                  <div>
                    <p className='text-xl'>150</p>
                    <p className=' text-xs'>Puntos</p>
                  </div>
                </div>
              </div>
              <div className=''>
                <h2 className='font-bold text-xl mb-4'>Direcciones de envío</h2>

                <div className='border-1 border-gray-300 rounded-md p-3 mb-2'>
                  <p className='font-semibold'>Principal</p>
                  <p className='text-sm'> Calle Principal 123, Int. 98</p>
                  <p className='text-sm'>Colonia nueva</p>
                  <p className='text-sm'>Azcapotzalco, Ciudad de México</p>
                  <p className='text-sm'>CP 00000</p>
                </div>

                <Button size='sm' variant='light' onPress={handleAddAddress}>
                  Agregar dirección
                </Button>
              </div>

              {medals.length > 0 && (
                <div className='md:col-span-2 '>
                  <h2 className='font-bold text-xl mb-4'>Logros</h2>
                  <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                    {medals.map((medal) => (
                      <div key={medal.id} className='text-center'>
                        <div className='bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600'>
                          {medal.icon}
                        </div>
                        <p className='font-semibold'>{medal.name}</p>
                        <p className='text-sm text-gray-600'>{medal.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
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
            {orders.length === 0 ? (
              <p className='text-gray-600'>Aún no has realizado ningún pedido.</p>
            ) : (
              orders.map((order) => {
                const orderStatus = storeOrder_status.find((status) => status.key === order.order_status)
                const shipmentStatus = storeShipment_status.find((status) => status.key === order.shipment_status)

                return (
                  <Card
                    className='bg-white grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md'
                    shadow='sm'
                    isPressable
                    fullWidth
                    key={order.id}
                    onPress={() => handleOpenOrderDetails(order.id)}
                  >
                    <div className='text-left'>
                      <h3>
                        <span className='text-neutral-500'>Pedido:</span> {order.id.split('-')[0]}
                      </h3>
                      <p>
                        <span className='text-neutral-500'>Fecha: </span>
                        {formatDate(order.created_at)}
                      </p>
                      <p className='text-lg'>
                        {order.total_items} {order.total_items === 1 ? 'artículo' : 'artículos'}
                      </p>
                    </div>
                    <div className='text-left md:text-right space-y-2'>
                      <p className='text-2xl'>
                        Total: <span className='font-bold'>{formatMoney(order.order_total)}</span>
                      </p>
                      <div>
                        Estado:{' '}
                        {order.shipment_status !== null ? (
                          <Chip variant='flat' color={shipmentStatus?.color}>
                            {shipmentStatus?.label}
                          </Chip>
                        ) : (
                          <Chip variant='flat' color={orderStatus?.color}>
                            {orderStatus?.label}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
            <OrderDetailsModal isOpen={isOrderDetailsOpen} onOpenChange={onOrderDetailsOpenChange} />
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
              {favs.length === 0 ? (
                <p className='text-gray-600'>No tienes productos favoritos aún.</p>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {favoriteProducts.map((product) => (
                    <ProductItem key={product.id} item={product} isRelated />
                  ))}
                </div>
              )}
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
            {notifications.length === 0 ? (
              <p className='text-gray-600'>No tienes notificaciones.</p>
            ) : (
              notifications.map((notification) => (
                <CustomAlert title={notification.title} key={notification.id} color={notification.color} iconName={notification.icon}>
                  <div className='flex flex-col   md:flex-row  md:justify-between md:w-full '>
                    <div>
                      <p className='text-neutral-800 leading-tight'>{notification.message}</p>
                      <p className='text-lg text-neutral-500'>
                        <span className='text-sm'>Pedido: </span>
                        {notification.order}
                      </p>
                    </div>
                    <div className='md:text-right '>
                      <p className='text-sm text-neutral-500'>{formatDate(notification.date)}</p>
                    </div>
                  </div>

                  {notification.type === 'payment' && (
                    <div className='flex items-center gap-1 mt-3'>
                      <Button size='sm' variant='ghost' color='primary'>
                        Compartir comprobante
                      </Button>
                      {/* <Button className='text-default-500 font-medium underline underline-offset-4' size='sm' variant='light'>
                        Maybe later
                      </Button> */}
                    </div>
                  )}
                </CustomAlert>
              ))
            )}
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
      <ManageAddressModal isOpen={isAddressModalOpen} onOpenChange={onAddressModalOpenChange} />
    </div>
  )
}

export default Account
