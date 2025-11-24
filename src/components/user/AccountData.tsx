import { Button, useDisclosure } from '@heroui/react'
import { motion } from 'framer-motion'
import { Calendar, Shield, Star, Trophy } from 'lucide-react'
import { useAppSelector } from '../../store/store'
import { formatDate } from '../../utils/date'
import ManageAddressModal from '../modals/customer/ManageAddressModal'

const AccountData = () => {
  const { user } = useAppSelector((state) => state.auth)
  const { isOpen: isAddressModalOpen, onOpenChange: onAddressModalOpenChange, onOpen: onAddressModalOpen } = useDisclosure()

  const medals = [
    { id: '1', name: 'Primera Compra', icon: <Star className='w-6 h-6' />, description: 'Realizaste tu primera compra' },
    { id: '2', name: 'Cannasieur', icon: <Star className='w-6 h-6' />, description: 'Haz comprado mas de 10 variedades de flor' },
    { id: '3', name: 'Money Maker', icon: <Star className='w-6 h-6' />, description: 'Realizaste una compra de mas de 10k ' },
    { id: '4', name: 'Comprador Frecuente', icon: <Trophy className='w-6 h-6' />, description: '5 compras realizadas' }
  ]

  const handleAddAddress = () => {
    onAddressModalOpen()
  }

  return (
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

      <ManageAddressModal isOpen={isAddressModalOpen} onOpenChange={onAddressModalOpenChange} />
    </motion.section>
  )
}

export default AccountData
