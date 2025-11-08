import { useParams } from 'react-router'

const OrderConfirmation = () => {
  const { oid } = useParams()

  return (
    <div className='container mx-auto p-8'>
      <h1>Tu orden ha sido confirmada</h1>
      <p>El ID de tu orden es: {oid}</p>

      <p>Puedes pagar haciendo una transferencia a cualquiera de las siguientes cuentas o en efectivo en tiendas de conveniencia.</p>

      <p>Una vez realizado el pago , sube su comprobante aquí, o en tu tus ordenes</p>
    </div>
  )
}

export default OrderConfirmation
