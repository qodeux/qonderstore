import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { addressSchema } from '../../../schemas/address.schema'
import { userService } from '../../../services/userService'
import { useAppSelector } from '../../../store/store'
import AddressForm from '../../forms/customer/AddressForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const ManageAddressModal = ({ isOpen, onOpenChange }: Props) => {
  const { user } = useAppSelector((state) => state.auth)
  const { isEditing } = useAppSelector((state) => state.ui)

  // const buildFormValues = useCallback(async () => {
  //   // sku estable por sesión de modal (nuevo). Si no existe, genera uno.

  //   let defaultValues

  //   if (isEditing) {
  //     // Modo edición
  //     defaultValues = {
  //       role: selectedUser?.role ?? 'staff',
  //       user_name: selectedUser?.user_name ?? '',
  //       email: selectedUser?.email ?? '',
  //       password: '',
  //       full_name: selectedUser?.full_name ?? undefined,
  //       phone: selectedUser?.phone ?? undefined,
  //       is_active: selectedUser?.is_active ?? true
  //     }
  //   } else {
  //     // Modo creación
  //     defaultValues = {
  //       role: 'staff',
  //       user_name: '',
  //       email: '',
  //       password: '',
  //       full_name: '',
  //       phone: '',
  //       is_active: true
  //     }
  //   }

  //   return defaultValues
  // }, [isEditing, selectedUser])

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { isDirty }
  } = addressForm

  const handleSubmitAddress = async () => {
    if (!user) return
    const isValid = await addressForm.trigger()
    if (!isValid) return

    const payload = addressForm.getValues()
    let transaction

    if (isEditing) {
      transaction = await userService.updateAddress(1, payload)
    } else {
      transaction = await userService.addAddress(user.id, payload)
    }

    if (transaction?.error) {
      console.error(transaction.error)

      if (transaction.error.code === '23505') {
        const details = transaction.error?.details ?? ''
        if (details.includes('Key (user_name)')) {
          addressForm.setError('user_name', { message: 'El usuario ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }
      } else if (transaction.error === 'A user with this email address has already been registered') {
        addressForm.setError('email', { message: 'El email ya está registrado' })
      }
      return
    }

    onOpenChange()
  }

  // Manejo de apertura/cierre del modal
  // useEffect(() => {
  //   const setDefaults = async () => {
  //     const defaults = await buildFormValues()
  //     addressForm.reset(defaults, { keepDirty: false, keepErrors: false })
  //   }

  //   void setDefaults()
  // }, [isOpen, isEditing, selectedUser, buildFormValues, addressForm])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='2xl'
      backdrop='blur'
      scrollBehavior='inside'
      classNames={{
        base: ' overflow-hidden pt-4 bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} dirección</ModalHeader>

            <ModalBody>
              {/* Si estás en edición pero aún no hay selectedUser, evita renderizar el form con valores en blanco */}
              {isEditing ? ( // && !selectedUser
                <div className='py-6 text-center text-sm text-gray-500'>Cargando datos del usuario…</div>
              ) : (
                <FormProvider {...addressForm}>
                  <AddressForm />
                </FormProvider>
              )}
            </ModalBody>

            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose} tabIndex={-1}>
                Cancelar
              </Button>

              {(!isEditing || isDirty) && (
                <Button color='primary' onPress={handleSubmitAddress}>
                  {isEditing ? 'Actualizar' : 'Aceptar'}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default ManageAddressModal
