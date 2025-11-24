import { Button } from '@heroui/react'
import { formatDate } from '../../utils/date'
import CustomAlert from '../common/CustomAlert'

const Notifications = () => {
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
  return (
    <div className='space-y-2'>
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
    </div>
  )
}

export default Notifications
