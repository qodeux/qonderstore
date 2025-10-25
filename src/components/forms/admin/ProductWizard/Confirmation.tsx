import { Tooltip } from '@heroui/react'
import { ChevronRight, ImageOff, PackageMinus, PackagePlus, Star, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import Lightbox from 'yet-another-react-lightbox'
import Inline from 'yet-another-react-lightbox/plugins/inline'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/styles.css'
import { usePresignedImages } from '../../../../hooks/usePresignedImages'
import type { RootState } from '../../../../store/store'
import { bulkUnitsAvailable, saleTypes, saleUnitsAvailable } from '../../../../types/products'

type Props = {
  data?: any
}

type BulkUnitKey = (typeof bulkUnitsAvailable)[number]['key']

type UnitMeta = {
  key: BulkUnitKey
  label: string
  value: number // factor contra tu unidad base
}

type EnrichedUnitItem = {
  unit: UnitMeta
  // precio que tengas guardado por unidad (si lo sigues mostrando)
  price?: number | null
  margin?: number | null

  // 👇 NUEVOS CAMPOS
  // precio por la UNIDAD BASE con margen (lo que quieres en el encabezado: “$X por oz”)
  priceByUnitBaseWithMargin?: number | null
  // precio por la UNIDAD PROPIA con margen (derivado desde la base)
  unitPriceFromBaseWithMargin?: number | null
}

const Confirmation = ({ data }: Props) => {
  const categories = useSelector((state: RootState) => state.categories.categories)
  const brands = useSelector((state: RootState) => state.products.brands)

  console.log(data)

  const normalizeKey = (k: unknown): string =>
    String(k ?? '')
      .trim()
      .toLowerCase()

  // si recibes claves externas distintas, mapea aquí
  const externalToInternal: Record<string, BulkUnitKey> = {
    gr: 'gr',
    g: 'gr',
    gram: 'gr',
    oz: 'oz',
    ounce: 'oz',
    lb: 'lb',
    pound: 'lb'
  }

  const toNumber = (v: unknown) => (v === null || v === undefined ? null : Number(v))

  const enrichedUnits = useMemo<EnrichedUnitItem[]>(() => {
    if ((data?.sale_type ?? '').trim().toLowerCase() !== 'bulk' || !data?.units) return []

    // Soporta array u objeto { lb: {...}, gr: {...} }
    const list = Array.isArray(data.units)
      ? data.units
      : Object.entries(data.units as Record<string, any>).map(([unitKey, payload]) => ({
          key: unitKey,
          ...payload
        }))

    // Meta de la unidad base (p. ej. 'oz')
    const baseRaw = normalizeKey(data?.base_unit)
    const baseInternal = externalToInternal[baseRaw] as BulkUnitKey | undefined
    const baseMeta = bulkUnitsAvailable.find((b) => b.key === baseInternal)

    // Precio público de la unidad base (usa el que tengas en tu form)
    const basePublicPrice =
      toNumber((data as any)?.base_unit_price) ??
      toNumber((data as any)?.public_price) ?? // por si lo nombras así
      null

    return list.map((u: any) => {
      const rawKey = normalizeKey(u.key ?? u.id ?? u.code ?? u.label)
      const internalKey = externalToInternal[rawKey] as BulkUnitKey | undefined

      // meta de la unidad del ítem
      const meta =
        bulkUnitsAvailable.find((b) => b.key === internalKey) ??
        ({ key: rawKey as BulkUnitKey, label: u.label ?? rawKey.toUpperCase(), value: 1 } as UnitMeta)

      const storedPrice = toNumber(u.price) // si aún guardas un precio manual por unidad
      const margin = toNumber(u.margin) ?? 0 // % (ej. 100, -50, etc.)

      // 1) Precio por UNIDAD BASE con margen:
      //    basePublicPrice * (1 + margen)
      const priceByUnitBaseWithMargin = basePublicPrice == null ? null : basePublicPrice * (1 + margin / 100)

      // 2) Ese precio llévalo a la UNIDAD PROPIA:
      //    (precio base con margen) * (gramos de la unidad propia / gramos de la unidad base)
      const unitPriceFromBaseWithMargin =
        priceByUnitBaseWithMargin == null || !baseMeta ? null : priceByUnitBaseWithMargin * (meta.value / baseMeta.value)

      return {
        unit: meta,
        price: storedPrice, // si lo sigues mostrando/guardando
        margin,
        priceByUnitBaseWithMargin,
        unitPriceFromBaseWithMargin
      } as EnrichedUnitItem
    })
  }, [data?.sale_type, data?.units, data?.base_unit, (data as any)?.base_unit_price, (data as any)?.public_price])

  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const images = data?.images ?? []

  const orderedImages = data.main_image ? [data.main_image, ...images.filter((img: string) => img !== data.main_image)] : images

  // Llamamos tu función Netlify por cada imagen
  const { urls, loading } = usePresignedImages(images, 200)

  const slides = useMemo(
    () =>
      orderedImages.map((key) => ({
        src: urls[key] || '/placeholder.png'
      })),
    [urls, orderedImages]
  )

  const toggleOpen = (state: boolean) => () => setOpen(state)

  const updateIndex =
    (when: boolean) =>
    ({ index: current }: { index: number }) => {
      if (when === open) {
        setIndex(current)
      }
    }

  console.log(enrichedUnits)

  console.log(data.units)

  return (
    <div className='flex gap-4'>
      <section className='w-2/4'>
        {data.images && data.images.length > 0 ? (
          <>
            {loading && <p className='text-sm text-gray-500'>Cargando imágenes...</p>}
            <div className='relative border-1 border-gray-400 rounded-lg overflow-hidden'>
              <div className='absolute top-0 right-0 z-50 rounded-full bg-white border p-1 m-2 shadow-md '>
                <Tooltip content='Producto destacado' placement='left'>
                  <Star fill='#ffde55' stroke='#ce7f00' />
                </Tooltip>
              </div>
              <Lightbox
                index={index}
                slides={slides}
                plugins={[Inline]}
                on={{
                  view: updateIndex(false),
                  click: toggleOpen(true)
                }}
                carousel={{ padding: 0, spacing: 0, imageFit: 'cover' }}
                inline={{
                  style: { width: '100%', maxWidth: '900px', aspectRatio: '1/1', margin: '0 auto' }
                }}
                styles={{ button: { color: 'black', filter: 'none', padding: 1 } }}
              />
            </div>

            <Lightbox
              open={open}
              close={toggleOpen(false)}
              index={index}
              slides={slides}
              on={{ view: updateIndex(true) }}
              animation={{ fade: 0 }}
              controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
              plugins={[Thumbnails]}
            />
          </>
        ) : (
          <>
            <figure className='aspect-square border-1 border-gray-400 flex items-center justify-center text-gray-400 bg-gray-200 rounded-lg  flex-col'>
              <ImageOff size={64} className='text-gray-300' />
              Sin imágenes
            </figure>
          </>
        )}

        <div className='flex items-center justify-between'>
          <p className='flex flex-col'>
            {`${categories.find((cat) => cat.id === data?.category)?.slug_id}-${data?.sku}`}
            <span className='text-xs text-gray-500'>SKU</span>
          </p>
          <p className='flex flex-col items-end'>
            <span className={data.is_active ? 'text-green-500' : 'text-gray-400'}>{data.is_active ? 'Activo' : 'Inactivo'}</span>
            <span className='text-xs text-gray-500'>Status</span>
          </p>
        </div>
        {(data.min_sale || data.max_sale || data.low_stock) && (
          <div className='grid grid-cols-3 mt-4 bg-white p-2 rounded-lg  border-1 border-gray-300 '>
            {data.min_sale && (
              <Tooltip content='Mínimo de compra' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <PackageMinus /> <span className='text-lg text-gray-600'>{data.min_sale}</span>
                </div>
              </Tooltip>
            )}

            {data.max_sale && (
              <Tooltip content='Máximo de compra' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <PackagePlus /> <span className='text-lg text-gray-600'>{data.max_sale}</span>
                </div>
              </Tooltip>
            )}
            {data.low_stock && (
              <Tooltip content='Alerta de stock' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <TriangleAlert /> <span className='text-lg text-gray-600'>{data.low_stock}</span>
                </div>
              </Tooltip>
            )}
          </div>
        )}

        {/* <figure className='aspect-square relative mt-3'>
         
          <PresignedImage keyPath={data?.main_image} expires={200} />
        </figure> */}
      </section>
      <section className='space-y-2 w-2/4 '>
        <div>
          <h4 className='text-lg font-bold'>{data?.name}</h4>
          <p className='flex flex-col '>
            {brands.find((brand) => brand.id == data?.brand)?.name}
            <span className='text-gray-500 text-xs'> Marca</span>
          </p>
        </div>

        <div className='flex items-center'>
          <p className='flex flex-col'>
            {categories.find((cat) => cat.id === data?.category)?.name}
            <span className='text-gray-500 text-xs'> Categoría</span>
          </p>
          {data.subcategory && (
            <>
              <div className='mx-2'>
                <ChevronRight />
              </div>
              <p className='flex flex-col'>
                {categories.find((cat) => cat.id === data?.subcategory)?.name}
                <span className='text-gray-500 text-xs'> Subcategoría</span>
              </p>
            </>
          )}
        </div>

        <p className='text-sm'>{data?.description}</p>
        <p>
          Venta {data?.sale_type === 'unit' ? 'por' : 'a'} {saleTypes.find((type) => type.key === data?.sale_type)?.label.toLowerCase()}
        </p>
        {data?.sale_type === 'unit' ? (
          <div>
            <div className='flex items-center gap-8 mt-2'>
              {data.base_cost && (
                <div className='flex flex-col'>
                  <div className='flex items-center gap-1 '>
                    <NumericFormat
                      value={data?.base_cost}
                      displayType='text'
                      thousandSeparator
                      prefix='$'
                      decimalScale={2}
                      className='text-xl'
                    />
                    <span className='text-xs mt-1'>{`/ ${saleUnitsAvailable.find((unit) => unit.key === data?.unit)?.label}`}</span>
                  </div>
                  <span className='text-xs text-gray-500'>Costo base</span>
                </div>
              )}
              <div className='flex flex-col'>
                <div className='flex items-center gap-1 '>
                  <NumericFormat
                    value={data?.public_price}
                    displayType='text'
                    thousandSeparator
                    prefix='$'
                    decimalScale={2}
                    className='text-2xl font-bold'
                  />
                  <span className='text-xs mt-1'>{`/ ${saleUnitsAvailable.find((unit) => unit.key === data?.unit)?.label}`}</span>
                </div>
                <span className='text-xs text-gray-500'>Precio público</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* <p>Unidad base: {bulkUnitsAvailable.find((unit) => unit.key === data?.base_unit)?.label}</p> */}
            <div className='flex flex-col'>
              <div className='flex items-center gap-1 '>
                <NumericFormat
                  value={data?.base_unit_price}
                  displayType='text'
                  thousandSeparator
                  prefix='$'
                  decimalScale={2}
                  className='text-2xl font-bold'
                />
                <span className='text-xs mt-1'>/ {bulkUnitsAvailable.find((b) => b.key === data?.base_unit)?.label}</span>
              </div>
              <span className='text-xs text-gray-500'>Precio base</span>
            </div>

            {enrichedUnits.length > 0 && (
              <div className='mt-3 grid grid-cols-2 gap-1 text-center'>
                {enrichedUnits.map((u) => (
                  <div key={u.unit.key} className='mt-2 bg-white p-2 border-1 border-gray-300 rounded-lg'>
                    <p>
                      {u.price != null && !Number.isNaN(Number(u.price)) ? (
                        <div className='flex items-center gap-1 justify-center'>
                          <NumericFormat
                            value={Math.ceil(Number(u.price))}
                            displayType='text'
                            thousandSeparator
                            prefix='$'
                            decimalScale={2}
                            className='text-xl font-bold'
                          />
                          <span className='text-xs mt-1'>/ {u.unit.label}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </p>

                    <span className='text-xs text-gray-500'>
                      ~
                      <NumericFormat
                        value={Number(u.priceByUnitBaseWithMargin).toFixed()}
                        displayType='text'
                        thousandSeparator
                        prefix='$'
                        decimalScale={2}
                      />{' '}
                      por {bulkUnitsAvailable.find((b) => b.key === data?.base_unit)?.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default Confirmation
