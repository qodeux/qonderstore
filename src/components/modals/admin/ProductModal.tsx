import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner, Tab, Tabs } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { customAlphabet } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema } from '../../../schemas/products.schema'
import { productService } from '../../../services/productService'
import { setSelectedProduct } from '../../../store/slices/productsSlice'
import type { RootState } from '../../../store/store'
import type { ProductBulkFormValues, ProductDataFormValues, ProductDetails, ProductUnitFormValues } from '../../../types/products'
import ProductBulkForm from '../../forms/admin/ProductBulkForm'
import ProductDataForm from '../../forms/admin/ProductDataForm'
import ProductUnitForm from '../../forms/admin/ProductUnitForm'

// ========================
// Default helpers
// ========================
const makeNewProductDefaults = (sku: string): ProductDataFormValues => ({
  name: '',
  slug: '',
  sku,
  category: undefined,
  hasChildren: false,
  subcategory: undefined,
  sale_type: undefined,
  description: '',
  is_active: true,
  featured: false
})

const unitDefaults: ProductUnitFormValues = {
  // Coloca aquí tus defaults reales para la sección Unidad
  unit: 'pz',
  base_cost: undefined,
  public_price: undefined,
  lowStockSwitch: false,
  minSaleSwitch: false,
  maxSaleSwitch: false,
  low_stock: undefined,
  min_sale: undefined,
  max_sale: undefined
}

const bulkDefaults: ProductBulkFormValues = {
  // Coloca aquí tus defaults reales para la sección Granel
  base_unit: undefined,
  base_unit_price: undefined,
  units: {}
}

// ========================
// Componente principal
// ========================

type Props = {
  isOpen: boolean
  onOpenChange: () => void
}

const ProductModal = ({ isOpen, onOpenChange }: Props) => {
  const dispatch = useDispatch()
  const { isEditing, selectedProduct } = useSelector((state: RootState) => state.products)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Datos auxiliares
  const categories = useSelector((state: RootState) => state.categories.categories)

  const prevIsOpenRef = useRef(isOpen)
  const [activeTab, setActiveTab] = useState<'data' | 'unit' | 'bulk'>('data')

  // nanoid para SKU temporal por apertura
  const gen6Ref = useRef(customAlphabet('0123456789', 6))
  const sessionSkuRef = useRef<string | null>(null)

  // Forms: mantenemos shouldUnregister:false para no perder valores entre tabs
  const productForm = useForm<ProductDataFormValues>({
    resolver: zodResolver(productDataInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })
  const {
    formState: { isDirty: isProductDirty, errors: productErrors }
  } = productForm

  const unitForm = useForm<ProductUnitFormValues>({
    resolver: zodResolver(productUnitInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { isDirty: isUnitDirty, errors: unitErrors }
  } = unitForm

  const bulkForm = useForm<ProductBulkFormValues>({
    resolver: zodResolver(productBulkInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const {
    formState: { isDirty: isBulkDirty, errors: bulkErrors }
  } = bulkForm

  // Controla qué tabs mostrar
  const selectedTypeUnit = productForm.watch('sale_type')

  // Construye valores iniciales según edición/nuevo
  const buildFormValues = useCallback(async () => {
    // sku estable por sesión de modal (nuevo). Si no existe, genera uno.
    if (!sessionSkuRef.current) sessionSkuRef.current = gen6Ref.current()

    const baseData: ProductDataFormValues =
      isEditing && selectedProduct
        ? {
            name: selectedProduct.name ?? '',
            slug: selectedProduct.slug ?? '',
            sku: selectedProduct.sku ?? sessionSkuRef.current,
            category: categories.find((cat) => cat.name?.toLowerCase?.() === selectedProduct.category?.toLowerCase?.())?.id ?? undefined,
            subcategory: selectedProduct.subcategory ?? undefined,
            sale_type: selectedProduct.sale_type ?? undefined,
            brand: selectedProduct.brand ?? undefined,
            description: selectedProduct.description ?? '',
            is_active: selectedProduct.is_active ?? true,
            featured: selectedProduct.featured ?? false
          }
        : makeNewProductDefaults(sessionSkuRef.current)

    let details: ProductUnitFormValues | ProductBulkFormValues | undefined
    if (isEditing && selectedProduct) {
      try {
        details = await productService.fetchProductDetails(selectedProduct)
      } catch (e) {
        console.warn('No se pudieron obtener los detalles del producto:', e)
      }
    }

    return { formData: baseData, formDetails: details }
  }, [isEditing, selectedProduct, categories])

  const hasErrors = (itemCheck) => {
    if (itemCheck.error?.code === '23505') {
      // Manejo de error: clave duplicada
      const details = itemCheck.error?.details ?? ''

      setActiveTab('data')
      if (details.includes('slug')) {
        productForm.setError('slug', { message: 'La clave ya existe' })
      } else if (details.includes('sku')) {
        productForm.setError('sku', { message: 'Sku duplicado' })
      } else {
        console.error('Error desconocido:', details)
      }
      return true
    } else {
      return false
    }
  }

  const deepErrorCount = (e: FieldErrors<any>): number => {
    const values = Object.values(e ?? {})
    return values.reduce((acc, v: any) => {
      if (!v) return acc
      // Si es un "leaf" de RHF (tiene message), cuenta 1
      if (typeof v === 'object' && 'message' in v) return acc + 1
      // Si es array u objeto anidado, sigue contando
      if (Array.isArray(v)) {
        return acc + v.reduce((a, item) => a + (item ? deepErrorCount(item) : 0), 0)
      }
      if (typeof v === 'object') {
        return acc + deepErrorCount(v)
      }
      return acc
    }, 0)
  }

  const totalErrorCount = deepErrorCount(productErrors) + deepErrorCount(unitErrors) + deepErrorCount(bulkErrors)

  // Crear/Guardar
  const handleSubmitProduct = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsSaving(true)

      // 1) Validación de datos principales

      console.log(productForm.getValues())
      console.log(productForm.formState.errors)

      const isProductValid = await productForm.trigger()
      if (!isProductValid) {
        setActiveTab('data')
        return
      }

      const productData = productDataInputSchema.parse(productForm.getValues())
      const saleType = productData.sale_type

      // 2) Validar sección específica
      if (saleType === 'unit') {
        console.log(unitForm.formState.errors)
        const ok = await unitForm.trigger()
        if (!ok) {
          setActiveTab('unit')
          return
        }
      }
      if (saleType === 'bulk') {
        console.log(bulkForm.formState.errors)

        const ok = await bulkForm.trigger()
        if (!ok) {
          setActiveTab('bulk')
          return
        }
      }

      let details: ProductDetails | undefined
      if (saleType === 'unit') {
        const unitData = productUnitInputSchema.parse(unitForm.getValues())
        details = { sale_type: 'unit', details: unitData }
      } else if (saleType === 'bulk') {
        const bulkData = productBulkInputSchema.parse(bulkForm.getValues())
        details = { sale_type: 'bulk', details: bulkData }
      } else {
        // Si llegas aquí, falta seleccionar el tipo
        setActiveTab('data')
        return
      }

      if (isEditing && selectedProduct) {
        const productUpdated = await productService.updateProduct(selectedProduct.id, productData, details)
        console.log('Producto actualizado?:', productUpdated)

        if (hasErrors(productUpdated)) return
      } else {
        // 3) Insertar Producto
        const productInserted = await productService.createProduct(productData)

        console.log('Producto insertado:', productInserted)

        if (hasErrors(productInserted)) return

        // 4) Insertar detalles
        if (saleType === 'unit') {
          const unitData = productUnitInputSchema.parse(unitForm.getValues())
          await productService.insertProductUnit(productInserted.id, unitData)
        } else if (saleType === 'bulk') {
          const bulkData = productBulkInputSchema.parse(bulkForm.getValues())
          await productService.insertProductBulk(productInserted.id, bulkData)
        }
      }

      // Cerrar el modal al terminar:
      onOpenChange()
    } catch (error) {
      console.error('Error agregando producto:', error)
    }
  }, [productForm, unitForm, bulkForm, onOpenChange, isEditing, selectedProduct])

  // Manejo de apertura/cierre del modal
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current

    const setDefaults = async () => {
      if (isOpen && !wasOpen) {
        // Al abrir\
        setIsLoading(true)
        const { formData, formDetails } = await buildFormValues()
        productForm.reset(formData)

        if (isEditing) {
          if (formData.sale_type === 'unit') {
            unitForm.reset((formDetails as ProductUnitFormValues) ?? unitDefaults)
          } else if (formData.sale_type === 'bulk') {
            bulkForm.reset((formDetails as ProductBulkFormValues) ?? bulkDefaults)
          } else {
            unitForm.reset(unitDefaults)
            bulkForm.reset(bulkDefaults)
          }

          setTimeout(() => setIsLoading(false), 100) // para que no parpadee tanto el spinner
        } else {
          setIsLoading(false)
          unitForm.reset(unitDefaults)
          bulkForm.reset(bulkDefaults)
          setActiveTab('data')
        }
      }

      if (!isOpen && wasOpen) {
        // Al cerrar
        dispatch(setSelectedProduct(null))
        setActiveTab('data')
        sessionSkuRef.current = null // forzar nuevo SKU la próxima vez

        // Dejar todo listo para próxima apertura (estado limpio)
        const nextSku = gen6Ref.current()
        productForm.reset(makeNewProductDefaults(nextSku), {
          keepDefaultValues: false,
          keepErrors: false,
          keepDirty: false,
          keepTouched: false,
          keepIsSubmitted: false
        })
        unitForm.reset(unitDefaults)
        bulkForm.reset(bulkDefaults)
      }

      prevIsOpenRef.current = isOpen
    }

    void setDefaults()
  }, [isOpen, isEditing, buildFormValues, dispatch, productForm, unitForm, bulkForm])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='xl'
      backdrop='blur'
      classNames={{
        closeButton: 'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <AnimatePresence>
              {isLoading && isEditing && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='w-full h-full absolute flex items-center justify-center z-20 bg-white  '
                >
                  <Spinner label={isSaving ? 'Guardando...' : 'Cargando...'} />
                </motion.div>
              )}
            </AnimatePresence>
            <ModalHeader className='flex flex-col gap-1 pb-0'>{isEditing ? 'Editar' : 'Agregar'} producto</ModalHeader>
            <ModalBody>
              <Tabs
                aria-label='Nuevo producto'
                color='primary'
                variant='solid'
                disableAnimation
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as 'data' | 'unit' | 'bulk')}
                classNames={{ base: 'justify-end' }}
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
              <Button color='danger' variant='light' onPress={onClose} tabIndex={-1}>
                Cancelar
              </Button>

              <Button color='primary' className='ml-2' onPress={handleSubmitProduct} isDisabled={totalErrorCount > 0}>
                {isEditing ? 'Guardar' : 'Agregar'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default ProductModal
