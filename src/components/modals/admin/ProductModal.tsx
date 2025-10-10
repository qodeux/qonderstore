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

// ========================
// Tipos derivados de Zod
// ========================
export type ProductDataFormValues = z.input<typeof productDataInputSchema>
export type ProductUnitFormValues = z.input<typeof productUnitInputSchema>
export type ProductBulkFormValues = z.input<typeof productBulkInputSchema>

// ========================
// Default helpers
// ========================
const makeNewProductDefaults = (sku: string): ProductDataFormValues => ({
  name: '',
  slug: '',
  sku,
  category: undefined,
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
  base_unit: 'gr',
  base_unit_price: undefined,
  bulk_units_available: [],
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

  const unitForm = useForm<ProductUnitFormValues>({
    resolver: zodResolver(productUnitInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const bulkForm = useForm<ProductBulkFormValues>({
    resolver: zodResolver(productBulkInputSchema),
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

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
            category:
              categories.find((cat) => cat.name?.toLowerCase?.() === selectedProduct.category?.toLowerCase?.())?.id ??
              (undefined as unknown as number | undefined),
            subcategory: (selectedProduct as any)?.subcategory ?? (undefined as unknown as number | undefined),
            sale_type: (selectedProduct as any)?.sale_type ?? (undefined as unknown as 'unit' | 'bulk' | undefined),
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

  // Crear/Guardar
  const handleAddProduct = useCallback(async () => {
    try {
      // 1) Validación de datos principales
      const isProductValid = await productForm.trigger()
      if (!isProductValid) {
        setActiveTab('data')
        return
      }

      const productData = productDataInputSchema.parse(productForm.getValues())
      const saleType = productData.sale_type

      // 2) Validar sección específica
      if (saleType === 'unit') {
        const ok = await unitForm.trigger()
        if (!ok) {
          setActiveTab('unit')
          return
        }
      }
      if (saleType === 'bulk') {
        const ok = await bulkForm.trigger()
        if (!ok) {
          setActiveTab('bulk')
          return
        }
      }

      // 3) Insertar Producto
      const productInserted = await productService.createProduct(productData)

      // 4) Insertar detalles
      if (saleType === 'unit') {
        const unitData = productUnitInputSchema.parse(unitForm.getValues())
        await productService.insertProductUnit(productInserted.id, unitData)
      } else if (saleType === 'bulk') {
        const bulkData = productBulkInputSchema.parse(bulkForm.getValues())
        await productService.insertProductBulk(productInserted.id, bulkData)
      }

      // 5) Reiniciar para siguiente alta
      sessionSkuRef.current = gen6Ref.current() // nuevo sku para próxima captura
      productForm.reset(makeNewProductDefaults(sessionSkuRef.current))
      unitForm.reset(unitDefaults)
      bulkForm.reset(bulkDefaults)
      setActiveTab('data')

      // Cerrar el modal al terminar:
      onOpenChange()
    } catch (error) {
      console.error('Error agregando producto:', error)
    }
  }, [productForm, unitForm, bulkForm, onOpenChange])

  // Manejo de apertura/cierre del modal
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current

    const setDefaults = async () => {
      if (isOpen && !wasOpen) {
        // Al abrir
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
        } else {
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='xl' backdrop='blur'>
      <ModalContent>
        {(onClose) => (
          <>
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
              <Button color='danger' variant='light' onPress={onClose}>
                Cancelar
              </Button>
              <Button color='primary' className='ml-2' onPress={handleAddProduct}>
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
