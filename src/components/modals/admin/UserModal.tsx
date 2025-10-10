import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { userInputSchema } from '../../../schemas/users.schema'
import { userService } from '../../../services/userService'
import type { RootState } from '../../../store/store'
import UserForm from '../../forms/admin/UserForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const UserModal = ({ isOpen, onOpenChange }: Props) => {
  const editMode = useSelector((state: RootState) => state.users.editMode)
  const selectedUser = useSelector((state: RootState) => state.users.selectedUser)

  const userForm = useForm({
    resolver: zodResolver(userInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      id: '',
      user_name: '',
      role: '',
      last_activity: '',
      is_active: true
    }
  })

  const {
    formState: { isDirty, errors }
  } = userForm

  const buildFormValues = () => ({
    id: selectedUser?.id ?? '',
    user_name: selectedUser?.user_name ?? '',
    role: selectedUser?.role ?? '',
    last_activity: selectedUser?.last_activity ?? undefined
  })

  const handleSubmitUser = async () => {
    const isValid = await userForm.trigger()
    if (!isValid) return
    let formData = userForm.getValues()
    let userSuccess

    if (editMode && selectedUser?.id) {
      formData = { ...formData, id: selectedUser.id }
      userSuccess = await userService.updateUser(formData)
    } else {
      userSuccess = await userService.createUser(formData)
    }

    if (!userSuccess.error && userSuccess) {
      console.log('Usuario OK:', userSuccess)

      onOpenChange() // Cierra el modal
      userForm.reset() // Resetea el formulario
    } else {
      console.error('Error al guardar usuario:')
      console.error(userSuccess.error)

      if (userSuccess.error.code === '23505') {
        // Manejo de error: clave duplicada

        const details = userSuccess.error?.details ?? ''

        if (details.includes('Key (id)')) {
          userForm.setError('id', { message: 'El id ya existe' })
        } else if (details.includes('Key (user_name)')) {
          userForm.setError('user_name', { message: 'El usuario ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }

        console.error('Error: El usuario ya existe')
        userForm.setError('user_name', { message: 'El usuario ya existe' })
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Al abrir, setea valores actuales
      userForm.reset(buildFormValues())
    } else {
      // Al cerrar, limpia
      userForm.reset({
        id: '',
        user_name: '',
        role: '',
        last_activity: undefined
      })
    }
  }, [isOpen, selectedUser, userForm]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='sm' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>{editMode ? 'Editar' : 'Agregar'} usuario</ModalHeader>
            <ModalBody>
              <FormProvider {...userForm}>
                <UserForm />
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              {(!editMode || isDirty) && (
                <Button color='primary' onPress={handleSubmitUser} isDisabled={Object.keys(errors).length > 0}>
                  Aceptar
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
