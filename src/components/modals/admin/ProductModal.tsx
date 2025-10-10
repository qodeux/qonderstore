import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tab, Tabs } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { customAlphabet } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import type z from 'zod'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema } from '../../../schemas/products.schema'
import { productService } from '../../../services/productService'
import { setSelectedProduct } from '../../../store/slices/productsSlice'
import type { RootState } from '../../../store/store'
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
  const dispatch = useDispatch()
  const selectedProduct = useSelector((state: RootState) => state.products.selectedProduct)
  const categories = useSelector((state: RootState) => state.categories.categories)
  const prevIsOpenRef = useRef(isOpen)

  const [activeTab, setActiveTab] = useState<'data' | 'unit' | 'bulk'>('data')

  const gen6Ref = useRef(customAlphabet('0123456789', 6))

  const buildFormValues = useCallback(() => {
    const randomSku = gen6Ref.current()

    const formData = {
      name: selectedProduct?.name || '',
      slug: selectedProduct?.slug || '',
      sku: selectedProduct?.sku || randomSku,
      category: categories.find((cat) => cat.name.toLowerCase() === selectedProduct?.category?.toLowerCase())?.id || undefined,
      subcategory: selectedProduct?.subcategory || '',
      sale_type: selectedProduct?.sale_type || undefined,
      description: selectedProduct?.description || '',
      is_active: selectedProduct?.is_active ?? true,
      featured: selectedProduct?.featured ?? false
    }

    let formDetails = {}

    switch (selectedProduct?.sale_type) {
      case 'unit':
        formDetails = {
          lowStockSwitch: true,
          minSaleSwitch: true,
          maxSaleSwitch: true,
          low_stock: 1,
          min_sale: 1,
          max_sale: 1
        }
        break
      case 'bulk':
        formDetails = {
          base_unit_price: 100
        }
        break
    }

    return { formData, formDetails }
  }, [selectedProduct, categories])

  const productForm = useForm<ProductDataFormValues>({
    resolver: zodResolver(productDataInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const selectedTypeUnit = productForm.watch('sale_type')

  const unitForm = useForm<ProductUnitFormValues>({
    resolver: zodResolver(productUnitInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const bulkForm = useForm({
    resolver: zodResolver(productBulkInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const handleAddProduct = async () => {
    console.log('Agregando producto')

    try {
      // 1) Validamos los datos principales
      const isProductValid = await productForm.trigger()

      console.log(productForm.getValues())

      console.log(productForm.formState.errors)

      if (!isProductValid) {
        setActiveTab('data')
        return
      }

      const productData = productDataInputSchema.parse(productForm.getValues())
      const saleType = productData.sale_type

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

          console.log(bulkForm.formState.errors)

          if (!formValid) {
            setActiveTab('bulk')
            //bulkForm.trigger()
            return
          }
          break
      }

      // 3) Insertar Producto
      const productInserted = await productService.createProduct(productData)

      // 4) Insertar datos de unidad si es necesario
      if (saleType === 'unit') {
        const productUnit = productUnitInputSchema.parse(unitForm.getValues())
        const productUnitInserted = await productService.insertProductUnit(productInserted.id, productUnit)

        console.log('Product and unit data inserted:', productInserted, productUnitInserted)

        // Cerrar el modal y resetear formularios
        unitForm.reset()
        productForm.reset()
        onOpenChange()
      } else if (saleType === 'bulk') {
        const productBulk = productBulkInputSchema.parse(bulkForm.getValues())
        const productBulkInserted = await productService.insertProductBulk(productInserted.id, productBulk)

        console.log('Product and bulk data inserted:', productInserted, productBulkInserted)

        // Cerrar el modal y resetear formularios
        bulkForm.reset()
        productForm.reset()
        onOpenChange()
      }
    } catch (error) {
      console.error('Error adding product and unit data:', error)
    }
  }

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    const defaultValues = buildFormValues()
    productForm.reset(defaultValues.formData)

    if (isOpen && !wasOpen) {
      // Al abrir, setea valores actuales
      switch (defaultValues.formData.sale_type) {
        case 'unit':
          unitForm.reset(defaultValues.formDetails)
          break
        case 'bulk':
          bulkForm.reset(defaultValues.formDetails)
          break
      }
    } else if (!isOpen && wasOpen) {
      // Al cerrar, limpia el producto seleccionado y resetea formularios
      console.log('Cerrando modal y reseteando formularios')
      dispatch(setSelectedProduct(null))
      setActiveTab('data')
      productForm.setValue('sku', '')
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, productForm, unitForm, bulkForm, buildFormValues, dispatch])

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
