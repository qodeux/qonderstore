import { useAppSelector } from '../../../../store/store'
import { formatMoney } from '../../../../utils/money'
import PresignedImage from '../../../common/cloudflare-r2/PresignedImage'

const PaymentProof = () => {
  const selectedOrder = useAppSelector((state) => state.storeOrders.selectedOrder)

  if (!selectedOrder?.payment_proof || !selectedOrder) return <div>No hay pago que confirmar</div>
  return (
    <div>
      <PresignedImage keyPath={selectedOrder.payment_proof} expires={100} aspect='free' />
      <h3 className='text-xl mt-4'>
        Monto a confirmar: <span className='font-bold'>{formatMoney(selectedOrder.order_total)}</span>
      </h3>
    </div>
  )
}

export default PaymentProof
