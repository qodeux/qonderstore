import { useParams } from 'react-router'
import { clearCart } from '../../store/slices/cartSlice'
import { useAppDispatch, useAppSelector } from '../../store/store'

const OrderConfirmation = () => {
  const { oid } = useParams()
  const dispatch = useAppDispatch()

  dispatch(clearCart())

  const { paymentMethods } = useAppSelector((state) => state.config)

  if (!oid) {
    return <p>ID de orden no proporcionado.</p>
  }

  return (
    <div className='container mx-auto p-8'>
      <h1 className='text-xl font-semibold'>Tu pedido ha sido recibido</h1>
      <p>El ID de tu orden es: {oid.split('-')[0]}</p>

      <p>
        Puedes pagar haciendo una transferencia o en efectivo depositando en tiendas de conveniencia a cualquiera de las siguientes cuentas:
      </p>

      <ul className='list-disc list-inside mb-4'>
        {paymentMethods?.map((method) => (
          <li key={method.id}>
            {method.type}: {method.account}
          </li>
        ))}
      </ul>

      <p>Una vez realizado el pago , sube su comprobante aquí, o en tu tus ordenes</p>
    </div>
  )
}

export default OrderConfirmation
