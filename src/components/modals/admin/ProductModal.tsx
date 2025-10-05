import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tab, Tabs } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { productSchema, productUnitSchema } from '../../../schemas/products.schema'
import { productService } from '../../../services/productService'
import ProductBulkForm from '../../forms/admin/ProductBulkForm'
import ProductDataForm from '../../forms/admin/ProductDataForm'
import ProductUnitForm from '../../forms/admin/ProductUnitForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
  fetchData: () => void
}

const ProductModal = ({ isOpen, onOpenChange, fetchData }: Props) => {
  const [activeTab, setActiveTab] = useState<'data' | 'unit' | 'bulk'>('data')

  const [selectedTypeUnit, setSelectedTypeUnit] = useState<string>('')

  const productForm = useForm({
    resolver: zodResolver(productSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const unitForm = useForm({
    resolver: zodResolver(productUnitSchema),
    shouldUnregister: true,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      lowStockSwitch: false,
      minSaleSwitch: false,
      maxSaleSwitch: false,
      low_stock: undefined,
      min_sale: undefined,
      max_sale: undefined,
      sale_unit: 'pz',
      public_price: undefined,
      base_cost: undefined
    }
  })

  const bulkForm = useForm({
    resolver: zodResolver(productUnitSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const handleAddProduct = async () => {
    console.log('Agregando producto')

    try {
      // 1) Validamos los datos principales
      const isProductValid = await productForm.trigger()
      if (!isProductValid) {
        setActiveTab('data')
        return
      }

      const productData = productForm.getValues()
      const saleType = productData.type_unit

      // 2) Si es unidad, validamos el formulario unidad
      if (saleType === 'unit') {
        const isUnitValid = await unitForm.trigger()
        if (!isUnitValid) {
          setActiveTab('unit')
          return
        }
      }
      // 3) Insertar Producto
      const productInserted = await productService.createProduct(productData)

      // 4) Insertar datos de unidad si es necesario
      if (saleType === 'unit') {
        const productUnit = unitForm.getValues()
        const productUnitInserted = await productService.InsertProductUnit(productInserted.id, productUnit)

        console.log('Product and unit data inserted:', productInserted, productUnitInserted)

        // 5) Cerrar el modal y resetear formularios
        unitForm.reset()
        productForm.reset()
        onOpenChange()
        fetchData()
      }
    } catch (error) {
      console.error('Error adding product and unit data:', error)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('data')
      productForm.reset()
      unitForm.reset()
      bulkForm.reset()
      setSelectedTypeUnit('')
    }
  }, [isOpen, productForm, unitForm, bulkForm])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='2xl'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1'>Agregar producto</ModalHeader>
            <ModalBody>
              <Tabs
                aria-label='Nuevo producto'
                color='primary'
                variant='solid'
                disableAnimation
                selectedKey={activeTab}
                onSelectionChange={(key) => {
                  setActiveTab(key as 'data' | 'unit' | 'bulk')
                }}
                classNames={{
                  base: 'justify-end'
                }}
              >
                <Tab key='data' title='Datos'>
                  <FormProvider {...productForm}>
                    <ProductDataForm
                      selectedTypeUnit={selectedTypeUnit}
                      onchangeTypeUnit={(value: string) => {
                        setSelectedTypeUnit(value)
                      }}
                    />
                  </FormProvider>
                </Tab>
                <Tab key='unit' title='Unidad' className={selectedTypeUnit === 'unit' ? '' : 'hidden'}>
                  <FormProvider {...unitForm}>
                    <ProductUnitForm />
                  </FormProvider>
                </Tab>
                <Tab key='bulk' title='Granel' className={selectedTypeUnit === 'bulk' ? '' : 'hidden'}>
                  <FormProvider {...bulkForm}>
                    <ProductBulkForm />
                  </FormProvider>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color='danger' variant='light' onPress={onClose}>
                Cerrar
              </Button>
              <Button color='primary' onPress={handleAddProduct}>
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default ProductModal
