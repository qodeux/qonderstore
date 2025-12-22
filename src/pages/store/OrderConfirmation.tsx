import { Button, Snippet, useDisclosure } from '@heroui/react'
import { CreditCard, ImageUp, Landmark } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import PaymentUploadModal from '../../components/modals/common/PaymentUploadModal'
import OrderSummary from '../../components/store/OrderSummary'
import { clearCart } from '../../store/slices/cartSlice'
import { clearSelectedOrder, setSelectedOrder } from '../../store/slices/storeOrdersSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'

const OrderConfirmation = () => {
  const { oid } = useParams()
  const dispatch = useAppDispatch()

  const { items: storeOrders } = useAppSelector((state) => state.storeOrders)
  const selectedOrder = storeOrders.find((order) => order.id === oid)

  const isLoadingOrder = !selectedOrder

  const banks = useAppSelector((state) => state.catalogs.banks)

  const { isOpen: isPaymentUploadOpen, onOpenChange: onPaymentUploadOpenChange, onOpen: onPaymentUploadOpen } = useDisclosure()

  const paymentMethodConfig = {
    card: {
      label: 'Depósito en efectivo',
      icon: CreditCard
    },
    bank_transfer: {
      label: 'Transferencia bancaria',
      icon: Landmark
    }
  } as const

  const { paymentMethods } = useAppSelector((state) => state.config)

  if (!oid) {
    return <p>ID de orden no proporcionado.</p>
  }

  useEffect(() => {
    document.title = `Orden ${oid} - Confirmación`

    dispatch(clearCart())
    dispatch(setSelectedOrder(oid))

    return () => {
      dispatch(clearSelectedOrder())
    }
  }, [oid])

  if (isLoadingOrder) {
    return <p>Cargando detalles de la orden...</p>
  }

  return (
    <div className='container flex flex-col md:flex-row mx-auto p-8 gap-6  '>
      <div className='md:pr-10 grow space-y-3 order-2 md:order-1 '>
        <h1 className='text-xl font-semibold'>Tu pedido ha sido recibido</h1>
        <p>
          El ID de tu orden es: <strong>{oid.split('-')[0]}</strong>
        </p>
        <p>Para realizar tu pago usa cualquiera de los siguientes métodos de pago:</p>
        <section className='flex flex-col gap-5'>
          {paymentMethods?.map((method) => {
            const cfg = paymentMethodConfig[method.type as keyof typeof paymentMethodConfig]
            const Icon = cfg?.icon

            return (
              <div key={method.id} className='flex  gap-3'>
                {Icon && <Icon className='w-10 h-10' />}
                <div>
                  <div className='font-semibold mb-2'>
                    <span className='text-lg'>{cfg?.label ?? method.type}</span>
                  </div>
                  <div>
                    <div>
                      <Snippet hideSymbol variant='bordered'>
                        {method.account}
                      </Snippet>
                      <div className='text-sm'>{method.type === 'bank_transfer' ? 'CLABE interbancaria' : 'Número de tarjeta'}</div>
                    </div>
                    <div>
                      Banco:<strong> {banks.find((b) => b.id === Number(method.bank))?.short_name}</strong>
                    </div>
                    {method.type === 'bank_transfer' && (
                      <>
                        <div>
                          Titular: <span>{method.holder_name}</span>
                        </div>
                        <div>
                          Concepto: <span>{oid.split('-')[0]}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {selectedOrder?.order_status === 'pending' && (
          <div>
            <p className='text-center md:text-left'>Una vez realizado el pago sube tu comprobante de pago a nuestra plataforma.</p>
            <div className='text-center mt-4'>
              <Button className='bg-black text-white' size='sm' onPress={onPaymentUploadOpen}>
                Compartir comprobante de pago <ImageUp className='p-0.5' />
              </Button>
            </div>
            <p className='text-sm'>
              Recuerda que si has elegido un horario tu pago debe ser acreditado al menos 10 minutos antes de la hora seleccionada.
            </p>
            <PaymentUploadModal isOpen={isPaymentUploadOpen} onOpenChange={onPaymentUploadOpenChange} />
          </div>
        )}
        {selectedOrder?.order_status === 'paid' && (
          <div>
            <p className='text-center md:text-left font-semibold'>Hemos recibido el comprobante de tu pago.</p>
            <p className=''>Nuestro equipo validará la transacción y preparará todo para ser enviado .</p>
            <p className='text-sm'>Te notificaremos cuando se haya enviado</p>
          </div>
        )}
      </div>

      <div className='md:order-2'>
        <OrderSummary orderId={oid} />
      </div>
    </div>
  )
}

export default OrderConfirmation
