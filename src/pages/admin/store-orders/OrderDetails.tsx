import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import { UAParser } from 'ua-parser-js'
import AddressMapPicker from '../../../components/common/AddressMapPicker'
import type { RootState } from '../../../store/store'
import type { IPGeolocation } from '../../../types/storeOrders'
import { formatDate } from '../../../utils/date'

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>()
  const { selectedOrder } = useSelector((state: RootState) => state.storeOrders)

  const { browser, cpu, device, os } = UAParser(selectedOrder?.user_agent || '')

  const [ipData, setIpData] = useState<IPGeolocation | null>(null)

  useEffect(() => {
    //Traer datos de la api de geolocalización si es necesario por ip
    const fetchGeolocationData = async () => {
      if (selectedOrder?.ip) {
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

  return (
    <div>
      <h2 className='text-xl font-bold'>Orden {id}</h2>
      <p>Estado de la orden: {selectedOrder?.order_status}</p>
      <p>Status del envío: {selectedOrder?.shipment_status}</p>

      <p>ID de Usuario: {selectedOrder?.user_id}</p>

      <div className='flex items-start'>
        <section className='w-2/3 grid grid-cols-2 bg-amber-300'>
          <p>Fecha de creación: {formatDate(selectedOrder?.created_at)}</p>
          <p>Última actualización: {formatDate(selectedOrder?.last_update)}</p>

          <div className='col-span-2 flex items-center bg-amber-400 gap-4'>
            <p>Nombre de cliente: {selectedOrder?.name}</p>
            <p>Teléfono de contacto: {selectedOrder?.phone}</p>
            <p>Correo electrónico: {selectedOrder?.email}</p>
          </div>

          <div className='col-span-2 bg-amber-500 p-2'>
            <AddressMapPicker defaultCenter={{ lat: 20.4050389, lng: -99.9926318 }} defaultZoom={19} />,
            <p>Código postal: {selectedOrder?.postal_code}</p>
            <p>Colonia: {selectedOrder?.sublocality}</p>
            <p>Calle: {selectedOrder?.street_address}</p>
            <p>Número: {selectedOrder?.street_number}</p>
            <p>Número interior: {selectedOrder?.interior_number}</p>
            <p>Notas de entrega: {selectedOrder?.address_notes}</p>
          </div>

          <p>Tipo de envío: {selectedOrder?.delivery_type}</p>
          <p>Fecha de entrega: {selectedOrder?.delivery_date}</p>
          <p>Ruta de entrega: {selectedOrder?.delivery_route}</p>

          {/* Metadatos */}
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
          <div>
            <p>
              Navegador: {browser.name} {browser.version}
            </p>
            <p>
              Sistema operativo: {os.name} {os.version}
            </p>
            <p>
              Dispositivo: {device.vendor} {device.model} {device.type}
            </p>
            <p>CPU: {cpu.architecture}</p>
          </div>
        </section>
        <section className='w-1/3 bg-blue-200'>
          <h2>Detalles de la orden</h2>
          <p>Cupón: {selectedOrder?.coupon_code}</p>

          <p>Número de productos: {selectedOrder?.total_items}</p>

          {/* <p>Resumen de productos: {selectedOrder?.items}</p> */}

          <p>Costo de productos: {selectedOrder?.total_price}</p>
          <p>Costo de envío: {selectedOrder?.shipping_price}</p>

          <p>Total de orden: {selectedOrder?.order_total}</p>
        </section>
      </div>
    </div>
  )
}

export default OrderDetails
