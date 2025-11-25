import { Button, cn, Radio, RadioGroup, Tooltip, useDisclosure } from '@heroui/react'
import { motion } from 'framer-motion'
import { Calendar, Shield, Star, Trash2 } from 'lucide-react'
import React from 'react'
import type { Address } from '../../schemas/address.schema'
import { userService } from '../../services/userService'
import { useAppSelector } from '../../store/store'
import { formatDate } from '../../utils/date'
import OnConfirmModal from '../modals/common/onConfirmModal'
import ManageAddressModal from '../modals/customer/ManageAddressModal'

type CustomRadioProps = React.ComponentProps<typeof Radio> & {
  children: React.ReactNode
}

export const CustomRadio = ({ children, ...otherProps }: CustomRadioProps) => {
  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          'm-0 bg-content1  items-center justify-between border-gray-300  ',
          'max-w-full flex-row-reverse  cursor-pointer rounded-lg gap-4 p-4 border-2 ',
          'data-[selected=true]:border-gray-400'
        )
      }}
    >
      {children}
    </Radio>
  )
}

const AccountData = () => {
  const { user, addresses } = useAppSelector((state) => state.auth)
  const { isOpen: isAddressModalOpen, onOpenChange: onAddressModalOpenChange, onOpen: onAddressModalOpen } = useDisclosure()
  const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onOpenChange: onConfirmModalOpenChange } = useDisclosure()
  const [selectedAddress, setSelectedAddress] = React.useState<Address | null>(null)

  //   const medals = [
  //     { id: '1', name: 'Primera Compra', icon: <Star className='w-6 h-6' />, description: 'Realizaste tu primera compra' },
  //     { id: '2', name: 'Cannasieur', icon: <Star className='w-6 h-6' />, description: 'Haz comprado mas de 10 variedades de flor' },
  //     { id: '3', name: 'Money Maker', icon: <Star className='w-6 h-6' />, description: 'Realizaste una compra de mas de 10k ' },
  //     { id: '4', name: 'Comprador Frecuente', icon: <Trophy className='w-6 h-6' />, description: '5 compras realizadas' }
  //   ]

  const handleAddAddress = () => {
    onAddressModalOpen()
  }

  const handleDeleteAddress = async () => {
    if (!selectedAddress) return
    try {
      await userService.deleteAddress(selectedAddress.id)

      setSelectedAddress(null)
      onConfirmModalOpenChange()
    } catch (error) {
      console.error('Error al eliminar la dirección:', error)
    }
  }

  const handleSetPrimaryAddress = async () => {
    if (!selectedAddress) return
    try {
      await userService.setPrimaryAddress(selectedAddress.id)
    } catch (error) {
      console.error('Error al establecer la dirección principal:', error)
    }
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

        {addresses.length === 0 && <p className='text-gray-600 mb-4'>No tienes direcciones guardadas aún.</p>}

        <RadioGroup
          className='mb-2'
          onValueChange={(val) => {
            setSelectedAddress(addresses.find((addr) => addr.id === Number(val)) || null)
          }}
        >
          {addresses.map((address) => (
            <CustomRadio value={address.id.toString()} key={address.id}>
              {address.is_primary && <p className='font-semibold'>Principal</p>}
              <p className='text-sm'>
                {address.street_address} {address.street_number}, {address.d_asenta}
              </p>

              <p className='text-sm'>
                {address.D_mnpio}, {address.d_estado}
              </p>
              <p className='text-sm'>CP {address.postal_code}</p>
            </CustomRadio>
          ))}
        </RadioGroup>

        <footer className='flex items-center justify-between'>
          <Button size='sm' variant='ghost' onPress={handleAddAddress} color='primary'>
            Agregar dirección
          </Button>
          {selectedAddress != null && (
            <div className='flex gap-2'>
              <Tooltip content='Eliminar dirección' placement='top'>
                <Button size='sm' variant='ghost' color='danger' onPress={onConfirmModalOpen} isIconOnly>
                  <Trash2 className='p-0.5' />
                </Button>
              </Tooltip>

              {!selectedAddress.is_primary && (
                <Tooltip content='Establecer como principal' placement='top'>
                  <Button size='sm' variant='ghost' color='primary' isIconOnly onPress={handleSetPrimaryAddress}>
                    <Star className='p-0.5' />
                  </Button>
                </Tooltip>
              )}

              {/* <Tooltip content='Editar dirección' placement='top'>
                <Button size='sm' variant='ghost' color='secondary' onPress={handleAddAddress} isIconOnly>
                  <Edit2 className='p-0.5' />
                </Button>
              </Tooltip> */}
            </div>
          )}
        </footer>
      </div>
      {/* 
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
      )} */}

      <ManageAddressModal isOpen={isAddressModalOpen} onOpenChange={onAddressModalOpenChange} />
      <OnConfirmModal
        isOpen={isConfirmModalOpen}
        onOpenChange={onConfirmModalOpenChange}
        onConfirm={handleDeleteAddress}
        action='delete'
        title='Eliminar dirección'
        message='¿Estás seguro de que deseas eliminar esta dirección de tu cuenta? '
      />
    </motion.section>
  )
}

export default AccountData
