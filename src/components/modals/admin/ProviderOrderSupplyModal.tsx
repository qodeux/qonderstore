import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@heroui/react'
import { TriangleAlert } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { providerService } from '../../../services/providerService'
import type { OrderItem, OrderItemReceived, SupplyFormUpdate } from '../../../types/providers'
import ProviderOrderSupplyForm from '../../forms/admin/ProviderOrderSupplyForm'
import OrderSupplyConfirmModal from './OrderSupplyConfirmModal'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const ProviderOrderSupplyModal = ({ isOpen, onOpenChange }: Props) => {
  const { isOpen: isOpenConfirm, onOpen: onOpenConfirm, onOpenChange: onOpenChangeConfirm } = useDisclosure()

  const orderItems = useForm({
    //resolver: zodResolver(categoryInputSchema),
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { errors }
  } = orderItems

  const hasErrors = Object.keys(errors).length > 0

  const handleConfirm = async () => {
    // console.log(orderItems.getValues())
    console.log('Suministra pedido con datos:', orderItems.getValues())

    // Lógica para suministrar el pedido
    const isValid = await orderItems.trigger()

    if (!isValid) return

    onOpenConfirm()
    //onOpenConfirm()
  }

  const handleOrderSupply = async () => {
    const orderDetails = orderItems.getValues() as SupplyFormUpdate
    type ItemsReceivedForm = Record<string, { qty_received?: string }>

    const itemsReceived: OrderItemReceived[] = Object.entries((orderDetails.items ?? {}) as ItemsReceivedForm)
      .map(([key, value]) => {
        const id = Number(key.replace('p_', ''))
        const raw = value?.qty_received ?? '' // ahora sí existe
        const cleaned = raw.replace(/[^\d.-]/g, '')
        const qty = cleaned === '' ? NaN : Number(cleaned)
        return { id, qty_received: qty } // <- clave correcta
      })
      .filter(({ qty_received }) => Number.isFinite(qty_received) && qty_received > 0)

    const items: OrderItem[] = itemsReceived.map(({ id, qty_received }) => ({
      id,
      qty: qty_received
    }))

    //const payload: SupplyOrderInputUpdate = { id: orderDetails.order, items } // el id se asigna en el modal padre

    //console.log(payload)

    const transaction = await providerService.supplyOrder(orderDetails.order, items)

    console.log(transaction)

    onOpenChangeConfirm()
    onOpenChange()
  }

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='xl' backdrop='blur'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1 '>Suministrar pedido</ModalHeader>
              <ModalBody>
                <FormProvider {...orderItems}>
                  <ProviderOrderSupplyForm />
                </FormProvider>
              </ModalBody>
              <ModalFooter className='flex justify-between items-center'>
                {hasErrors && (
                  <p className='text-danger flex items-center gap-1 justify-center text-sm '>
                    <TriangleAlert />
                    Todos los productos deben estar asignados.
                  </p>
                )}
                <section className='flex justify-end flex-1 '>
                  <Button color='danger' variant='light' onPress={onClose}>
                    Cerrar
                  </Button>
                  <Button color='primary' onPress={handleConfirm}>
                    Aceptar
                  </Button>
                </section>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <OrderSupplyConfirmModal isOpen={isOpenConfirm} onOpenChange={onOpenChangeConfirm} onConfirm={handleOrderSupply} />
    </>
  )
}

export default ProviderOrderSupplyModal
