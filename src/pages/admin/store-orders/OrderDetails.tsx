import { Card, Chip } from '@heroui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import { UAParser } from 'ua-parser-js'
import AddressMap from '../../../components/common/AddressMap'
import CartItemBox from '../../../components/store/CartItemBox'
import { storeOrderService } from '../../../services/storeOrderService'
import { selectProductsWithBestPromo } from '../../../store/selectors/productsWithPromo'
import type { RootState } from '../../../store/store'
import { delivery_types, deliveryRoutesMap, storeOrder_status, type IPGeolocation, type SublocalityData } from '../../../types/storeOrders'
import { formatDate } from '../../../utils/date'
import { formatMoney } from '../../../utils/money'

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>()
  const { selectedOrder } = useSelector((state: RootState) => state.storeOrders)
  const products = useSelector(selectProductsWithBestPromo)

  const { browser, cpu, device, os } = UAParser(selectedOrder?.user_agent || '')

  const deviceLabel = device.type ? `${device.vendor ?? ''} ${device.model ?? ''} (${device.type})` : 'PC/Laptop'

  const [ipData, setIpData] = useState<IPGeolocation | null>(null)
  const [sublocalityData, setSublocalityData] = useState<SublocalityData | null>(null)

  const deliveryType = delivery_types.find((type) => type.key === selectedOrder?.delivery_type)

  console.log(selectedOrder?.items)

  const cartItems = selectedOrder?.items
    ? selectedOrder.items.map((item) => {
        const product = products.find((p) => p.id === item.id)
        return {
          ...item,
          price: item.price,
          title: product?.name,
          image: product?.main_image,
          product
        }
      })
    : []

  console.log('cartItemsUpdate', cartItems)

  useEffect(() => {
    //Traer datos de la api de geolocalización si es necesario por ip
    const fetchGeolocationData = async () => {
      if (selectedOrder?.ip && ['127.0.0.1', 'Unknown'].includes(selectedOrder.ip) === false) {
        try {
          const response = await fetch(`http://ip-api.com/json/${selectedOrder.ip}`)
          const data = await response.json()
          console.log('Geolocation Data:', data)
          setIpData(data)
        } catch (error) {
          console.error('Error fetching geolocation data:', error)
        }
      }
    }

    fetchGeolocationData()
  }, [selectedOrder?.ip])

  useEffect(() => {
    const getSublocalityData = async () => {
      if (selectedOrder?.sublocality) {
        const { data, error } = await storeOrderService.getSublocalityData(selectedOrder.sublocality)
        if (error) {
          console.error('Error fetching sublocality data:', error)
        } else {
          setSublocalityData(data)
        }
      }
    }

    getSublocalityData()
  }, [selectedOrder?.sublocality])

  const orderStatus = storeOrder_status.find((status) => status.key === selectedOrder?.order_status)
  //const shipmentStatus = shipment_status.find((status) => status.key === selectedOrder?.shipment_status)

  if (!selectedOrder) {
    return <p>No se encontró la orden.</p>
  }

  return (
    <Card className='bg-white p-4'>
      <div className='flex items-start gap-6'>
        <section className='flex-grow grid grid-cols-2 '>
          <section className='col-span-2'>
            <h2 className='text-xl'>
              <span className='font-bold'>Orden:</span> {id}{' '}
              <Chip color={orderStatus?.color} variant='flat'>
                {orderStatus?.label}
              </Chip>
            </h2>
            {['admin', 'staff'].includes(selectedOrder?.role as string) && (
              <p>
                Realizada por: {selectedOrder?.user_name} ({selectedOrder?.full_name})
              </p>
            )}
            {/* <p>Status del envío: {selectedOrder?.shipment_status}</p> */}
            <p>Fecha de creación: {formatDate(selectedOrder?.created_at)}</p>
            {selectedOrder?.last_update !== selectedOrder?.created_at && (
              <p>Última actualización: {formatDate(selectedOrder?.last_update)}</p>
            )}
          </section>

          <div className='col-span-2 flex flex-col  my-4'>
            <h3 className='text-lg font-semibold'>Información del cliente</h3>
            <p>Nombre: {selectedOrder?.name}</p>
            <p>Teléfono: {selectedOrder?.phone}</p>
            {selectedOrder?.email && <p>Correo electrónico: {selectedOrder?.email}</p>}
          </div>

          <div className='col-span-2'>
            <h3 className='text-lg font-semibold mt-2'>Datos de entrega</h3>
            <section className='flex justify-between'>
              <div className='text-sm'>
                <p>
                  {selectedOrder?.street_address} {selectedOrder?.street_number}{' '}
                  {selectedOrder?.interior_number && `Int. ${selectedOrder.interior_number}`}
                </p>
                <p>Colonia: {sublocalityData?.d_asenta}</p>
                <p>
                  {sublocalityData?.D_mnpio}, {sublocalityData?.d_estado}
                </p>
                <p>Código postal: {selectedOrder?.postal_code}</p>
              </div>
              <div className='text-right'>
                <p>
                  Tipo de envío:{' '}
                  <Chip variant='bordered' color={deliveryType?.color}>
                    {deliveryType?.label}
                  </Chip>
                </p>
                <p>
                  Entrega solicitada:{' '}
                  <span className='font-semibold'>{formatDate(selectedOrder?.delivery_date, 'short', 'es-MX', 'utc')}</span>
                </p>
                {selectedOrder?.delivery_route && (
                  <p>
                    Ruta: <span className='font-semibold'>{deliveryRoutesMap[selectedOrder.delivery_route]}</span>
                  </p>
                )}
              </div>
            </section>

            {selectedOrder?.address_notes && <p>Notas de entrega: {selectedOrder.address_notes}</p>}
            {selectedOrder?.google_location && (
              <AddressMap coords={{ lat: selectedOrder.google_location.lat, lng: selectedOrder.google_location.lng }} mapHeight={300} />
            )}
          </div>

          {/* Metadatos */}

          <div>
            <p>
              Navegador: {browser.name} {browser.version}
            </p>
            <p>
              Sistema operativo: {os.name} {os.version}
            </p>
            <p>Dispositivo: {deviceLabel}</p>
            <p>CPU: {cpu.architecture}</p>
          </div>
          {selectedOrder?.ip && ['127.0.0.1', 'Unknown'].includes(selectedOrder.ip) === false && (
            <div>
              <p>IP del cliente: {selectedOrder?.ip}</p>

              {ipData && (
                <div>
                  <p>Ciudad: {ipData.city}</p>
                  <p>Región: {ipData.regionName}</p>
                  <p>País: {ipData.country}</p>
                </div>
              )}
            </div>
          )}

          <div className='h-[1500px]'>spacer</div>
        </section>
        <section className='w-[380px] md:sticky md:top-0  lg:max-h-[65vh] h-fit border border-foreground-400 rounded-md overflow-hidden bg-white shadow-md'>
          <div className='flex flex-col w-full '>
            <>
              {cartItems.length !== 0 && (
                <motion.header
                  key='cart-header'
                  initial={{ y: -100 }}
                  animate={{ y: 0 }}
                  exit={{ y: -100 }}
                  transition={{ duration: 0.2, delay: 0.2, type: 'spring' }}
                  className='px-4 py-2 flex items-center justify-between border-b border-foreground-400'
                >
                  <h2 className='text-lg'>Resumen del pedido</h2>
                  <motion.span className='text-sm text-gray-500'>
                    {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
                  </motion.span>
                </motion.header>
              )}

              <section className='flex flex-col gap-4 overflow-y-auto overflow-x-hidden p-4'>
                {cartItems.length === 0 && (
                  <div className='text-center h-full flex flex-col items-center justify-center gap-2 p-4'>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
                    >
                      <img src='/errors/empty-cart.webp' alt='' />
                      <h4 className='text-xl font-bold'>No hay nada aquí</h4>
                      <p className='text-gray-500 text-sm text-balance'>
                        Houston... tenemos un carrito vacío. Agrega algo para comenzar el viaje.
                      </p>
                    </motion.div>
                  </div>
                )}
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.unitSelected ?? item.unitSelected}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 200 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CartItemBox item={item} isLast={index === cartItems.length - 1} readOnly />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </section>

              {cartItems.length !== 0 && (
                <motion.footer
                  key='cart-footer'
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  exit={{ y: 100 }}
                  transition={{ duration: 0.2, delay: 0.3, type: 'spring' }}
                  className='flex flex-col shrink-0 p-4 border-t border-foreground-400 bg-white gap-4 overflow-hidden z-10 sticky bottom-0 w-full'
                >
                  <div className='flex flex-col justify-between items-center'>
                    <div className='w-full flex justify-between items-center'></div>
                    <div className='text-xl text-right w-full'>
                      Productos: <span className='font-bold'>{formatMoney(selectedOrder?.total_price)}</span>
                    </div>
                    <div className='text-xl text-right w-full'>
                      Envío: <span className='font-bold'>{formatMoney(selectedOrder?.shipping_price)}</span>
                    </div>

                    {/* {cartHasDiscount && (
                      <div className='text-right text-2xl w-full'>
                        Descuento: <span className='font-bold'>$0.00</span>
                      </div>
                    )} */}
                    <div className='text-xl text-right w-full'>
                      Total: <span className='font-bold'>{formatMoney(selectedOrder?.order_total ?? 0)}</span>
                    </div>
                  </div>
                </motion.footer>
              )}
            </>
          </div>
        </section>
      </div>
    </Card>
  )
}

export default OrderDetails
