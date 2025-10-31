import { Modal, ModalBody, ModalContent, Spinner } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgrestError } from '@supabase/supabase-js'
import { AnimatePresence, motion } from 'framer-motion'
import { customAlphabet } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, type Resolver } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Wizard } from 'react-use-wizard'
import { useGetCombinedPayload } from '../../../hooks/useGetCombinedPayload'
import {
  productBulkInputSchema,
  productDataInputSchema,
  productUnitInputSchema,
  productUploadedImageSchema,
  type ProductBulkInput,
  type ProductBulkSubmit,
  type ProductDataInput,
  type ProductDataSubmit,
  type ProductUnitInput,
  type ProductUnitSubmit,
  type ProductUploadedImageInput,
  type ProductUploadedImageSubmit
} from '../../../schemas/products.schema'
import type { ProductRpcPayload } from '../../../schemas/productsPayload.schema'
import { productService } from '../../../services/productService'
import { setSelectedProduct } from '../../../store/slices/productsSlice'
import { requestJumpToStep, setWizardCurrentStep } from '../../../store/slices/uiSlice'
import type { RootState } from '../../../store/store'
import type { BulkDbUnits, DbBulkDetails, DbUnitDetails } from '../../../types/products'
import type { Step } from '../../../types/ui'
import AnimatedStep from '../../common/wizard/AnimatedStep'
import RowSteps from '../../common/wizard/RowSteps'
import WizardFooter from '../../common/wizard/WizardFooter'
import Confirmation from '../../forms/admin/ProductWizard/Confirmation'
import ProductBulkForm from '../../forms/admin/ProductWizard/ProductBulkForm'
import ProductDataForm from '../../forms/admin/ProductWizard/ProductDataForm'
import ProductUnitForm from '../../forms/admin/ProductWizard/ProductUnitForm'
import ProductUploadImagesForm from '../../forms/admin/ProductWizard/ProductUploadImagesForm'

// ========================
// Default helpers
// ========================
const makeNewProductDefaults = (sku: string): ProductDataInput => ({
  name: '',
  slug: '',
  sku,
  category: undefined,
  hasChildren: false,
  subcategory: undefined,
  sale_type: undefined,
  description: '',
  is_active: false,
  featured: false
})

const unitDefaults: ProductUnitInput = {
  // Coloca aquí tus defaults reales para la sección Unidad
  unit: 'pz',
  base_cost: undefined,
  public_price: undefined,
  lowStockSwitch: false,
  minSaleSwitch: false,
  maxSaleSwitch: false,
  low_stock: undefined,
  min_sale: undefined,
  max_sale: undefined,
  wholesaleSwitch: false,
  wholesale_prices: []
}

const bulkDefaults: ProductBulkInput = {
  // Coloca aquí tus defaults reales para la sección Granel
  bulk_units_available: [],
  base_unit: undefined,
  base_unit_price: undefined,
  units: {},
  minSaleSwitch: false,
  min_sale: undefined,
  maxSaleSwitch: false,
  max_sale: undefined
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
  const { isEditing, selectedProduct, saleType } = useSelector((state: RootState) => state.products)
  const { wizardCurrentIndex } = useSelector((state: RootState) => state.ui)
  const currentStep = wizardCurrentIndex + 1

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Datos auxiliares
  const categories = useSelector((state: RootState) => state.categories.categories)

  const prevIsOpenRef = useRef(isOpen)

  // nanoid para SKU temporal por apertura
  const gen6Ref = useRef(customAlphabet('0123456789', 6))
  const sessionSkuRef = useRef<string | null>(null)

  // Forms: mantenemos shouldUnregister:false para no perder valores entre tabs
  const productForm = useForm<ProductDataInput>({
    resolver: zodResolver<ProductDataInput, typeof productDataInputSchema, ProductDataSubmit>(
      productDataInputSchema
    ) as unknown as Resolver<ProductDataInput>,
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const unitForm = useForm<ProductUnitInput>({
    resolver: zodResolver<ProductUnitInput, typeof productUnitInputSchema, ProductUnitSubmit>(
      productUnitInputSchema
    ) as unknown as Resolver<ProductUnitInput>,
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const bulkForm = useForm<ProductBulkInput>({
    resolver: zodResolver<ProductBulkInput, typeof productBulkInputSchema, ProductBulkSubmit>(
      productBulkInputSchema
    ) as unknown as Resolver<ProductBulkInput>,
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const uploadImagesForm = useForm<ProductUploadedImageInput>({
    resolver: zodResolver<ProductUploadedImageInput, typeof productUploadedImageSchema, ProductUploadedImageSubmit>(
      productUploadedImageSchema
    ) as unknown as Resolver<ProductUploadedImageInput>,
    shouldUnregister: false,
    mode: 'all',
    reValidateMode: 'onChange'
  })

  const WizardSteps: Step[] = [
    {
      title: 'Datos principales',
      content: ProductDataForm,
      form: productForm
    },
    {
      title: 'Detalles del tipo de venta',
      content: saleType === 'unit' ? ProductUnitForm : ProductBulkForm,
      form: saleType === 'unit' ? unitForm : bulkForm
    },
    {
      title: 'Carga de imágenes',
      content: ProductUploadImagesForm,
      form: uploadImagesForm
    },

    // En Confirmación pasamos los datos combinados como prop
    {
      title: 'Confirma los datos',
      content: Confirmation
    }
  ]

  const onStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep || isEditing) {
      dispatch(requestJumpToStep(stepIndex))
    }
  }

  const getCombinedPayload = useGetCombinedPayload({
    productForm,
    unitForm,
    bulkForm,
    uploadImagesForm
  })

  const toNumOrUndef = (v: unknown): number | undefined => {
    if (v === '' || v === null || v === undefined) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  const buildUnitDefaultsFromDb = (db?: Partial<DbUnitDetails>): ProductUnitInput => {
    const hasWholesale = Array.isArray(db?.wholesale_prices) && (db!.wholesale_prices!.length ?? 0) > 0

    return {
      unit: db?.unit ?? 'pz',
      base_cost: db?.base_cost ?? undefined,
      public_price: db?.public_price ?? undefined,

      lowStockSwitch: db?.low_stock != null,
      minSaleSwitch: db?.min_sale != null,
      maxSaleSwitch: db?.max_sale != null,
      wholesaleSwitch: hasWholesale,

      low_stock: db?.low_stock ?? undefined,
      min_sale: db?.min_sale ?? undefined,
      max_sale: db?.max_sale ?? undefined,

      wholesale_prices: hasWholesale ? (db!.wholesale_prices as { min: number; price: number }[]) : []
    }
  }

  const buildBulkDefaultsFromDb = (db: Partial<DbBulkDetails>): ProductBulkInput => {
    // 1) Normaliza seleccionadas/base
    const selected = Array.isArray(db.bulk_units_available) ? db.bulk_units_available.filter(Boolean) : []
    const baseUnit = (db.base_unit ?? '').trim()

    // Asegura que la base esté en el arreglo seleccionado (por si en BD viene inconsistente)
    const bulk_units_available = baseUnit && !selected.includes(baseUnit) ? [baseUnit, ...selected] : selected

    // 2) Normaliza precio base y switches
    const base_unit_price = toNumOrUndef(db.base_unit_price)

    const min_sale_val = toNumOrUndef(db.min_sale)
    const max_sale_val = toNumOrUndef(db.max_sale)

    const minSaleSwitch = min_sale_val != null
    const maxSaleSwitch = max_sale_val != null

    // 3) Normaliza units:
    //    - Debe haber entradas EXACTAMENTE para las unidades seleccionadas distintas de la base
    //    - Cada entrada con margin/price numéricos (de lo contrario, la quitamos para no romper zod)
    const unitsRaw = db.units ?? {}
    const expectedKeys = bulk_units_available.filter((u) => u !== baseUnit)

    const units: BulkDbUnits = {}

    for (const k of expectedKeys) {
      const u = unitsRaw[k]
      if (!u) continue

      const margin = toNumOrUndef(u.margin)
      const price = toNumOrUndef(u.price)

      // Si falta alguno, lo omitimos; Zod te marcará si hace falta según selección
      if (margin == null || price == null) continue

      units[k] = { margin, price }
    }

    // 4) Ensambla defaults del formulario
    const defaults: ProductBulkInput = {
      bulk_units_available,
      base_unit: baseUnit || undefined,
      base_unit_price,
      units,
      minSaleSwitch,
      min_sale: min_sale_val,
      maxSaleSwitch,
      max_sale: max_sale_val
    }

    return defaults
  }

  // Construye valores iniciales según edición/nuevo
  const buildFormValues = useCallback(async () => {
    // sku estable por sesión de modal (nuevo). Si no existe, genera uno.
    if (!sessionSkuRef.current) sessionSkuRef.current = gen6Ref.current()

    const baseData: ProductDataInput =
      isEditing && selectedProduct
        ? {
            name: selectedProduct.name ?? '',
            slug: selectedProduct.slug ?? '',
            sku: selectedProduct.sku ?? sessionSkuRef.current,
            category: categories.find((cat) => cat.name?.toLowerCase?.() === selectedProduct.category?.toLowerCase?.())?.id ?? undefined,
            subcategory: selectedProduct.subcategory ?? undefined,
            hasChildren: selectedProduct.subcategory != null,
            sale_type: selectedProduct.sale_type ?? undefined,
            brand: selectedProduct.brand ?? undefined,
            description: selectedProduct.description ?? '',
            is_active: selectedProduct.is_active ?? true,
            featured: selectedProduct.featured ?? false
          }
        : makeNewProductDefaults(sessionSkuRef.current)

    let details: ProductUnitInput | ProductBulkInput | undefined
    if (isEditing && selectedProduct) {
      try {
        details = await productService.fetchProductDetails(selectedProduct)
        //console.log(details)
      } catch (e) {
        console.warn('No se pudieron obtener los detalles del producto:', e)
      }
    }

    const images =
      isEditing && selectedProduct ? { images: selectedProduct.images ?? [], main_image: selectedProduct.main_image } : { images: [] }

    return { formData: baseData, formDetails: details, uploadImages: images }
  }, [isEditing, selectedProduct, categories])

  // Crear/Guardar
  const handleSubmitProduct = useCallback(async () => {
    try {
      setIsSaving(true)
      const payload = getCombinedPayload()

      if (isEditing && selectedProduct) {
        //console.log('Payload para actualizar:', payload)
        await productService.updateProduct(selectedProduct.id, payload as ProductRpcPayload)
      } else {
        //console.log('Payload para crear:', payload)
        await productService.createProduct(payload as ProductRpcPayload)
      }

      onOpenChange()
    } catch (e) {
      const error = e as PostgrestError
      if (error.code === '23505') {
        const details = error.details ?? ''

        if (details.includes('Key (slug)')) {
          dispatch(requestJumpToStep(0))
          productForm.setError('slug', { message: 'La clave ya existe' })
        } else if (details.includes('Key (sku)')) {
          dispatch(requestJumpToStep(0))
          productForm.setError('sku', { message: 'El Sku ya existe' })
        } else {
          console.error('Error desconocido:', details)
        }
      }
    } finally {
      setIsSaving(false)
    }
  }, [isEditing, selectedProduct, getCombinedPayload, onOpenChange, productForm, dispatch])

  // Manejo de apertura/cierre del modal
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current

    const setDefaults = async () => {
      if (isOpen && !wasOpen) {
        // Al abrir\
        //console.log('Abriendo modal de producto')
        setIsLoading(true)
        const { formData, formDetails, uploadImages } = await buildFormValues()
        productForm.reset(formData)
        uploadImagesForm.reset(uploadImages)

        if (isEditing) {
          if (formData.sale_type === 'unit') {
            const mapped = buildUnitDefaultsFromDb(formDetails as Partial<DbUnitDetails>)
            unitForm.reset(mapped ?? unitDefaults)
          } else if (formData.sale_type === 'bulk') {
            bulkForm.reset(buildBulkDefaultsFromDb(formDetails as Partial<DbBulkDetails>))
          }

          setTimeout(() => setIsLoading(false), 100) // para que no parpadee tanto el spinner
        } else {
          setIsLoading(false)
          unitForm.reset(unitDefaults)
          bulkForm.reset(bulkDefaults)
        }
      }

      if (!isOpen && wasOpen) {
        // Al cerrar
        //console.log('Cerrando modal de producto')

        dispatch(setSelectedProduct(null))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, buildFormValues, dispatch, productForm, unitForm, bulkForm, uploadImagesForm])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={currentStep <= 1 ? 'sm' : 'xl'}
      backdrop='blur'
      classNames={{
        base: ' overflow-hidden pt-4 bg-gray-50',
        closeButton:
          'focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 cursor-pointer'
      }}
      isDismissable={false}
    >
      <ModalContent>
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

        <ModalBody>
          <Wizard
            header={<RowSteps currentStep={wizardCurrentIndex} onStepChange={onStepClick} steps={WizardSteps} allowAllSteps={isEditing} />}
            footer={<WizardFooter getStepForm={(idx) => WizardSteps[idx]?.form} onConfirm={handleSubmitProduct} />}
            wrapper={<AnimatePresence initial={false} mode='wait' />}
          >
            {WizardSteps.map(({ content: StepContent, form }, index) => (
              <AnimatedStep key={index} rxStep={setWizardCurrentStep}>
                {form ? (
                  <FormProvider {...form}>
                    <StepContent />
                  </FormProvider>
                ) : (
                  <StepContent data={getCombinedPayload()} />
                )}
              </AnimatedStep>
            ))}
          </Wizard>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ProductModal
