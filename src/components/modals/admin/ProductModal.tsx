import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tab, Tabs } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import type z from 'zod'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema } from '../../../schemas/products.schema'
import { productService } from '../../../services/productService'
import ProductBulkForm from '../../forms/admin/ProductBulkForm'
import ProductDataForm from '../../forms/admin/ProductDataForm'
import ProductUnitForm from '../../forms/admin/ProductUnitForm'

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

type ProductDataFormValues = z.input<typeof productDataInputSchema>
type ProductUnitFormValues = z.input<typeof productUnitInputSchema>

const ProductModal = ({ isOpen, onOpenChange }: Props) => {
  const [activeTab, setActiveTab] = useState<'data' | 'unit' | 'bulk'>('data')

  const productForm = useForm<ProductDataFormValues>({
    resolver: zodResolver(productDataInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const selectedTypeUnit = productForm.watch('type_unit')

  const unitForm = useForm<ProductUnitFormValues>({
    resolver: zodResolver(productUnitInputSchema),
    shouldUnregister: false,
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
    resolver: zodResolver(productBulkInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange',

    defaultValues: {
      base_unit: 'gr',
      base_unit_price: undefined
    }
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

      const productData = productDataInputSchema.parse(productForm.getValues())
      const saleType = productData.type_unit

      let formValid
      switch (saleType) {
        case 'unit':
          formValid = await unitForm.trigger()
          if (!formValid) {
            setActiveTab('unit')
            return
          }
          break
        case 'bulk':
          formValid = await bulkForm.trigger()

          console.log(formValid, bulkForm.getValues())

          if (!formValid) {
            setActiveTab('bulk')
            return
          }
          break
      }

      // 3) Insertar Producto
      const productInserted = await productService.createProduct(productData)

      // 4) Insertar datos de unidad si es necesario
      if (saleType === 'unit') {
        const productUnit = productUnitInputSchema.parse(unitForm.getValues())
        const productUnitInserted = await productService.InsertProductUnit(productInserted.id, productUnit)

        console.log('Product and unit data inserted:', productInserted, productUnitInserted)

        // 5) Cerrar el modal y resetear formularios
        unitForm.reset()
        productForm.reset()
        onOpenChange()
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
    }
  }, [isOpen, productForm, unitForm, bulkForm])

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='xl' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1 pb-0'>Agregar producto</ModalHeader>
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
                    <ProductDataForm />
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
            <ModalFooter className='pt-0'>
              <Button color='danger' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' className='ml-2' onPress={handleAddProduct}>
                Agregar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default ProductModal
