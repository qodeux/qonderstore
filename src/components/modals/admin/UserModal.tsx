import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { userInputCreateSchema, userInputUpdateSchema } from '../../../schemas/users.schema'
import { userService } from '../../../services/userService'
import type { RootState } from '../../../store/store'
import UserForm from '../../forms/admin/UserForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const UserModal = ({ isOpen, onOpenChange }: Props) => {
  const isEditing = useSelector((state: RootState) => state.users.isEditing)
  const selectedUser = useSelector((state: RootState) => state.users.selectedUser)

  const buildFormValues = useCallback(async () => {
    // sku estable por sesión de modal (nuevo). Si no existe, genera uno.

    let defaultValues

    if (isEditing) {
      // Modo edición
      defaultValues = {
        role: selectedUser?.role ?? 'staff',
        user_name: selectedUser?.user_name ?? '',
        email: selectedUser?.email ?? '',
        password: '',
        full_name: selectedUser?.full_name ?? undefined,
        phone: selectedUser?.phone ?? undefined,
        is_active: selectedUser?.is_active ?? true
      }
    } else {
      // Modo creación
      defaultValues = {
        role: 'staff',
        user_name: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        is_active: true
      }
    }

    return defaultValues
  }, [isEditing, selectedUser])

  const userForm = useForm({
    resolver: zodResolver(isEditing ? userInputUpdateSchema : userInputCreateSchema),
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { isDirty }
  } = userForm

  const handleSubmitUser = async () => {
    const isValid = await userForm.trigger()
    if (!isValid) return

    const payload = userForm.getValues()
    let transaction

    if (isEditing && selectedUser) {
      transaction = await userService.updateUser(selectedUser.id, payload)
    } else {
      transaction = await userService.createUser(payload)
    }

    if (transaction?.error) {
      console.error(transaction.error)

      if (transaction.error.code === '23505') {
        const details = transaction.error?.details ?? ''
        if (details.includes('Key (user_name)')) {
          userForm.setError('user_name', { message: 'El usuario ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }
      } else if (transaction.error === 'A user with this email address has already been registered') {
        userForm.setError('email', { message: 'El email ya está registrado' })
      }
      return
    }

    onOpenChange()
  }

  // Manejo de apertura/cierre del modal
  useEffect(() => {
    const setDefaults = async () => {
      const defaults = await buildFormValues()
      userForm.reset(defaults, { keepDirty: false, keepErrors: false })
    }

    void setDefaults()
  }, [isOpen, isEditing, selectedUser, buildFormValues, userForm])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='sm'
      backdrop='blur'
      classNames={{
        base: ' overflow-hidden pt-4 bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{isEditing ? 'Editar' : 'Agregar'} usuario</ModalHeader>

            <ModalBody>
              {/* Si estás en edición pero aún no hay selectedUser, evita renderizar el form con valores en blanco */}
              {isEditing && !selectedUser ? (
                <div className='py-6 text-center text-sm text-gray-500'>Cargando datos del usuario…</div>
              ) : (
                <FormProvider {...userForm}>
                  <UserForm />
                </FormProvider>
              )}
            </ModalBody>

            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose} tabIndex={-1}>
                Cerrar
              </Button>

              {(!isEditing || isDirty) && (
                <Button color='primary' onPress={handleSubmitUser}>
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

export default UserModal
