import { Button, Chip, Modal, ModalBody, ModalContent, ModalHeader, Tab, Tabs, Textarea, useDisclosure } from '@heroui/react'
import { Rating } from '@smastrom/react-rating'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { storeOrderService } from '../../../services/storeOrderService'
import { selectProductsWithBestPromo } from '../../../store/selectors/productsWithPromo'
import { useAppSelector } from '../../../store/store'
import {
  deliveryRoutesMap,
  storeOrder_status,
  storeShipment_status,
  type OrderItem,
  type SublocalityData
} from '../../../types/storeOrders'
import { formatDate } from '../../../utils/date'
import { formatMoney } from '../../../utils/money'
import AddressMap from '../../common/AddressMap'
import OrderProductReviewForm from '../../forms/customer/OrderProductReviewForm'
import CartItemBox from '../../store/CartItemBox'
import PaymentUploadModal from '../common/PaymentUploadModal'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}
const OrderDetailsModal = ({ isOpen, onOpenChange }: Props) => {
  const products = useSelector(selectProductsWithBestPromo)
  const { selectedOrder } = useAppSelector((state) => state.storeOrders)

  const orderStatus = storeOrder_status.find((status) => status.key === selectedOrder?.order_status)
  const shipmentStatus = storeShipment_status.find((status) => status.key === selectedOrder?.shipment_status)
  const [sublocalityData, setSublocalityData] = useState<SublocalityData | null>(null)

  const [hasOrderRaiting, setHasOrderRaiting] = useState<boolean | undefined>(selectedOrder?.has_order_rating)

  const { isOpen: isPaymentUploadOpen, onOpenChange: onPaymentUploadOpenChange, onOpen: onPaymentUploadOpen } = useDisclosure()

  const cartItems = selectedOrder?.items
    ? selectedOrder.items.map((item: OrderItem) => {
        const product = products.find((p) => p.id === item.id)
        return {
          ...item,
          price: item.price,
          title: product?.name ?? 'Producto no encontrado',
          image: product?.main_image,
          product
        }
      })
    : []

  const formRaiting = useForm({
    mode: 'all',
    shouldUnregister: false,
    resolver: undefined,
    defaultValues: {
      rating_overall: 0,
      rating_product_quality: 0,
      comment: ''
    }
  })

  const handleSubmitOrderRaiting = formRaiting.handleSubmit(async (data) => {
    // Lógica para enviar la valoración al servidor
    if (!selectedOrder) return
    try {
      let totalPoints = 4
      if (data.comment !== '') {
        totalPoints += 10
      }

      await storeOrderService.createOrderRating({ ...data, order_id: selectedOrder.id, total_points: totalPoints })

      setHasOrderRaiting(true)
    } catch (error) {
      console.error('Error submitting order rating:', error)
    }
  })

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

  if (!selectedOrder) {
    return null
  }
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='sm'
      backdrop='opaque'
      scrollBehavior='inside'
      classNames={{ base: 'p-0', body: 'p-2', header: 'p-4 pb-2' }}
    >
      <ModalContent>
        <ModalHeader className='flex  gap-1'>
          Detalles del pedido
          <Chip color={orderStatus?.color} variant='flat'>
            {orderStatus?.label}
          </Chip>
        </ModalHeader>
        <ModalBody>
          <div className='px-4'>
            <p>Clave: {selectedOrder.id.split('-')[0]}</p>
            <p>Fecha del pedido: {formatDate(selectedOrder.created_at)}</p>
            {selectedOrder?.last_update !== selectedOrder?.created_at && (
              <p>Última actualización: {formatDate(selectedOrder?.last_update)}</p>
            )}
            {selectedOrder.order_status === 'pending' && (
              <div className='text-center mt-4'>
                <Button className='bg-black text-white' size='sm' onPress={onPaymentUploadOpen}>
                  Compartir comprobante de pago <ImageUp className='p-0.5' />
                </Button>
              </div>
            )}
          </div>

          <Tabs aria-label='Options' disableAnimation fullWidth color='primary' classNames={{ panel: 'p-0' }}>
            <Tab key='products' title='Productos'>
              <div className='flex flex-col w-full border border-foreground-400 rounded-md  bg-white shadow-md overflow-hidden'>
                {cartItems.length !== 0 && (
                  <header key='cart-header' className='px-4 py-2 flex items-center justify-between border-b border-foreground-400'>
                    <h2 className='font-semibold text-lg'>Resumen del pedido</h2>
                    <motion.span className='text-sm text-gray-500'>
                      {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
                    </motion.span>
                  </header>
                )}

                <section className='flex flex-col gap-4 overflow-y-auto max-h-[260px] md:max-h-[32vh]    p-4'>
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
                        Productos: <span className='font-bold'>{formatMoney(selectedOrder?.total_price ?? 0)}</span>
                      </div>
                      {selectedOrder?.shipping_price !== 0 && (
                        <div className='text-xl text-right w-full'>
                          Envío: <span className='font-bold'>{formatMoney(selectedOrder?.shipping_price ?? 0)}</span>
                        </div>
                      )}

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
              </div>
            </Tab>
            <Tab key='shipping' title='Entrega'>
              <div>
                <h3 className='text-lg font-semibold mt-2'>Datos de entrega </h3>
                <section className='flex justify-between'>
                  <div className='text-sm'>
                    <p>Nombre: {selectedOrder?.name}</p>
                    <p>Teléfono: {selectedOrder?.phone}</p>
                    {selectedOrder?.email && <p>Correo electrónico: {selectedOrder?.email}</p>}
                    <p className='pt-4'>
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
                    {selectedOrder?.delivery_route && (
                      <p>
                        Ruta:{' '}
                        <span className='font-semibold'>
                          {deliveryRoutesMap[selectedOrder.delivery_route as keyof typeof deliveryRoutesMap]}
                        </span>
                      </p>
                    )}
                  </div>
                </section>

                {selectedOrder?.address_notes && <p>Notas de entrega: {selectedOrder.address_notes}</p>}
                {selectedOrder?.google_location && (
                  <div className='relative  rounded-lg '>
                    <AddressMap
                      coords={{ lat: selectedOrder.google_location.lat, lng: selectedOrder.google_location.lng }}
                      mapHeight={240}
                      customerView={true}
                      zoom={18}
                    />
                    <footer className='absolute bottom-0 z-80 w-full bg-gray-100 flex items-center justify-between p-2 border-1 border-gray-300 rounded-b-lg'>
                      <p className='flex flex-col'>
                        <span className='font-semibold'>{formatDate(selectedOrder?.delivery_date, 'short', 'es-MX', 'utc')}</span>
                        <span className='text-xs'>Entrega solicitada</span>
                      </p>

                      <p className='flex flex-col items-end'>
                        {selectedOrder.shipment_status === 'delivered' && (
                          <span className='font-semibold'>{formatDate(selectedOrder?.delivery_date, 'full', 'es-MX', 'utc')}</span>
                        )}
                        {selectedOrder?.shipment_status && (
                          <Chip variant='flat' color={shipmentStatus?.color} size='sm'>
                            {shipmentStatus?.label}
                          </Chip>
                        )}
                      </p>
                    </footer>
                  </div>
                )}
              </div>
            </Tab>
            {selectedOrder.shipment_status === 'delivered' && (
              <Tab key='review' title='Valoración'>
                {!hasOrderRaiting && (
                  <form className='p-4 pt-0' onSubmit={handleSubmitOrderRaiting}>
                    <p className='text-sm mb-4'>
                      Muchas gracias por realizar tu compra en nuestra tienda, ayudános a mejorar nuestro servicio y responde a esta
                      valoración. Ganarás puntos por cada valoración que realices.
                    </p>

                    <div className='mb-2'>
                      ¿En general, cómo calificarías la experiencia de compra en nuestra plataforma?
                      <div className='flex items-center'>
                        <Chip size='sm' color='success' className='mt-2'>
                          +2 puntos
                        </Chip>
                        <Controller
                          name='rating_overall'
                          control={formRaiting.control}
                          render={({ field }) => <Rating {...field} className='pl-8' />}
                        />
                      </div>
                    </div>

                    <div className='mb-2'>
                      ¿Cómo calificarías la calidad de los productos que recibiste?
                      <div className='flex items-center'>
                        <Chip size='sm' color='success' className='mt-2'>
                          +2 puntos
                        </Chip>
                        <Controller
                          name='rating_product_quality'
                          control={formRaiting.control}
                          render={({ field }) => <Rating {...field} className='pl-8' />}
                        />
                      </div>
                    </div>

                    <Controller
                      name='comment'
                      control={formRaiting.control}
                      render={({ field }) => <Textarea {...field} label='Deja un comentario para nosotros (opcional)' maxRows={2} />}
                    />
                    <div className='flex justify-between items-center mt-2'>
                      <Chip size='sm' color='success'>
                        +10 puntos
                      </Chip>
                      <Button size='sm' color='primary' type='submit'>
                        Enviar
                      </Button>
                    </div>
                  </form>
                )}

                {hasOrderRaiting && (
                  <div className='p-4 pt-0'>
                    <p className='mb-4 text-center text-balance'>¡Gracias por calificar tu experiencia de compra!</p>

                    <p className='text-sm'>Puedes ganar más puntos calificando y reseñando los productos que recibiste.</p>

                    {cartItems.map((item) => (
                      <article key={item.id} className='mt-4'>
                        <OrderProductReviewForm item={item} />
                      </article>
                    ))}
                  </div>
                )}
              </Tab>
            )}
          </Tabs>

          <PaymentUploadModal isOpen={isPaymentUploadOpen} onOpenChange={onPaymentUploadOpenChange} />
        </ModalBody>
        {/* <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!isEditing || isDirty) && (
                <Button color='primary' onPress={handleSubmitBrand} isDisabled={Object.keys(errors).length > 0}>
                  Aceptar
                </Button>
              )}
            </ModalFooter> */}
      </ModalContent>
    </Modal>
  )
}

export default OrderDetailsModal
