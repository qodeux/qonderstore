import { Button, Modal, ModalBody, ModalContent, ModalFooter, Tab, Tabs } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { userInputUpdateSchema } from '../../../schemas/users.schema'
import { closeModal } from '../../../store/slices/uiSlice'
import type { RootState } from '../../../store/store'
import UserForm from '../../forms/admin/UserForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const AccountModal = ({ isOpen, onOpenChange }: Props) => {
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)

  const userForm = useForm({
    resolver: zodResolver(userInputUpdateSchema),
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const buildFormValues = useCallback(() => {
    if (!user) return {}
    return {
      role: user.role ?? '',
      user_name: user.user_name ?? '',
      email: user.email ?? '',
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      is_active: user.is_active ?? true
    }
  }, [user])

  useEffect(() => {
    if (isOpen) {
      userForm.reset(buildFormValues(), {
        keepDirty: false,
        keepDirtyValues: false
      })
    }
  }, [isOpen, buildFormValues, userForm])

  const {
    formState: { isDirty }
  } = userForm

  const handleOpenChange = (open: boolean) => {
    if (!open) dispatch(closeModal())
    onOpenChange()
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
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
            <ModalBody>
              <Tabs aria-label='Options' disableAnimation color='primary'>
                <Tab key='data' title='Datos de la cuenta'>
                  <FormProvider {...userForm}>
                    <UserForm fromAccount />
                  </FormProvider>
                </Tab>
                {/* <Tab key='config' title='Configuración' /> */}
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose} tabIndex={-1}>
                Cerrar
              </Button>
              {isDirty && <Button color='primary'>Actualizar</Button>}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default AccountModal
