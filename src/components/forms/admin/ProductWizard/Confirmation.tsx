import { Tooltip } from '@heroui/react'
import { ChevronRight, PackageMinus, PackagePlus, Star, TriangleAlert } from 'lucide-react'
import { useMemo } from 'react'
import { NumericFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import 'yet-another-react-lightbox/styles.css'
import type { BulkDetailsForPayload, DetailsForPayload, ProductRpcPayload } from '../../../../schemas/productsPayload.schema'
import type { RootState } from '../../../../store/store'
import { bulkUnitsAvailable, saleTypes, saleUnitsAvailable, type RawUnitEntry } from '../../../../types/products'
import ProductLightboxGallery from '../../../common/light-box/ProductLightbox'

type Props = {
  data?: {
    product: ProductRpcPayload['product']
    details: ProductRpcPayload['details']
  }
}

const isBulk = (d: DetailsForPayload): d is BulkDetailsForPayload => d.type === 'bulk'

type BulkUnitKey = (typeof bulkUnitsAvailable)[number]['key']

type UnitMeta = {
  key: BulkUnitKey
  label: string
  value: number // factor contra tu unidad base
}

type EnrichedUnitItem = {
  unit: UnitMeta
  price?: number | null
  margin?: number | null
  priceByUnitBaseWithMargin?: number | null
  unitPriceFromBaseWithMargin?: number | null
}

const Confirmation = ({ data }: Props) => {
  const categories = useSelector((state: RootState) => state.categories.items)
  const brands = useSelector((state: RootState) => state.products.brands)

  const normalizeKey = (k: unknown): string =>
    String(k ?? '')
      .trim()
      .toLowerCase()

  // mapeo flexible de claves externas → internas
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

  // Memoiza las imágenes base
  const images = useMemo(() => data?.product?.images ?? [], [data?.product?.images])
  const mainImage = data?.product?.main_image ?? null

  // Memoiza el orden de las imágenes
  const orderedImages = useMemo(() => {
    return mainImage ? [mainImage, ...images.filter((img: string) => img !== mainImage)] : images
  }, [images, mainImage])

  // Enriquecer unidades SOLO si es bulk
  // Enriquecer unidades SOLO si es bulk
  const enrichedUnits = useMemo<EnrichedUnitItem[]>(() => {
    if (!data || !isBulk(data.details)) return []

    const units = data.details.units

    // Normalizamos a lista unificada
    const list: RawUnitEntry[] = Array.isArray(units)
      ? (units as RawUnitEntry[])
      : Object.entries(units as Record<string, RawUnitEntry>).map(([unitKey, payload]) => ({
          key: unitKey,
          ...payload
        }))

    const baseRaw = normalizeKey(data.details.base_unit)
    const baseInternal = externalToInternal[baseRaw] as BulkUnitKey | undefined
    const baseMeta = bulkUnitsAvailable.find((b) => b.key === baseInternal)
    const basePublicPrice = toNumber(data.details.base_unit_price)

    // Mapeamos cada unidad enriquecida
    return list.map((u): EnrichedUnitItem => {
      const rawKey = normalizeKey(u.key ?? u.id ?? u.code ?? u.label)
      const internalKey = externalToInternal[rawKey] as BulkUnitKey | undefined

      const meta: UnitMeta =
        bulkUnitsAvailable.find((b) => b.key === internalKey) ??
        ({
          key: rawKey as BulkUnitKey,
          label: u.label ?? rawKey.toUpperCase(),
          value: 1
        } as UnitMeta)

      const storedPrice = toNumber(u.price)
      const margin = toNumber(u.margin) ?? 0

      const priceByUnitBaseWithMargin = basePublicPrice == null ? null : basePublicPrice * (1 + margin / 100)
      const unitPriceFromBaseWithMargin =
        priceByUnitBaseWithMargin == null || !baseMeta ? null : priceByUnitBaseWithMargin * (meta.value / baseMeta.value)

      return {
        unit: meta,
        price: storedPrice,
        margin,
        priceByUnitBaseWithMargin,
        unitPriceFromBaseWithMargin
      }
    })
  }, [data, externalToInternal])

  // Ya podemos cortar aquí si no hay data
  if (!data) return <p>No hay datos del producto.</p>

  const details = data.details
  const unitDetails = details.type === 'unit' ? details : null
  const bulkDetails = details.type === 'bulk' ? details : null

  return (
    <div className='flex gap-4'>
      <section className='w-2/4'>
        <div className='relative border-1 border-gray-400 rounded-lg overflow-hidden'>
          <div className='absolute top-0 right-0 z-50 rounded-full bg-white border p-1 m-2 shadow-md '>
            <Tooltip content='Producto destacado' placement='left'>
              <Star fill='#ffde55' stroke='#ce7f00' />
            </Tooltip>
          </div>
          <ProductLightboxGallery
            mainImage={data.product.main_image}
            images={orderedImages} // array de keyPaths
            showThumbnails
            maxWidth={900}
          />
        </div>

        <div className='flex items-center justify-between'>
          <p className='flex flex-col'>
            {`${categories.find((cat) => cat.id === data.product.category)?.slug_id}-${data.product.sku}`}
            <span className='text-xs text-gray-500'>SKU</span>
          </p>
          <p className='flex flex-col items-end'>
            <span className={data.product.is_active ? 'text-green-500' : 'text-gray-400'}>
              {data.product.is_active ? 'Activo' : 'Inactivo'}
            </span>
            <span className='text-xs text-gray-500'>Status</span>
          </p>
        </div>

        {/* Badges de min/max/low stock */}
        {(details.min_sale != null || details.max_sale != null || (unitDetails && unitDetails.low_stock != null)) && (
          <div className='grid grid-cols-3 mt-4 bg-white p-2 rounded-lg border-1 border-gray-300'>
            {details.min_sale != null && (
              <Tooltip content='Mínimo de compra' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <PackageMinus />
                  <span className='text-lg text-gray-600'>{details.min_sale}</span>
                </div>
              </Tooltip>
            )}

            {details.max_sale != null && (
              <Tooltip content='Máximo de compra' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <PackagePlus />
                  <span className='text-lg text-gray-600'>{details.max_sale}</span>
                </div>
              </Tooltip>
            )}

            {unitDetails && unitDetails.low_stock != null && (
              <Tooltip content='Alerta de stock' placement='top'>
                <div className='flex items-center justify-center gap-2'>
                  <TriangleAlert />
                  <span className='text-lg text-gray-600'>{unitDetails.low_stock}</span>
                </div>
              </Tooltip>
            )}
          </div>
        )}
      </section>

      <section className='space-y-2 w-2/4 '>
        <div>
          <h4 className='text-lg font-bold'>{data.product.name}</h4>
          <p className='flex flex-col '>
            {brands.find((brand) => brand.id == data.product.brand?.toString())?.name}
            <span className='text-gray-500 text-xs'> Marca</span>
          </p>
        </div>

        <div className='flex items-center'>
          <p className='flex flex-col'>
            {categories.find((cat) => cat.id === data.product.category)?.name}
            <span className='text-gray-500 text-xs'> Categoría</span>
          </p>
          {data.product.subcategory && (
            <>
              <div className='mx-2'>
                <ChevronRight />
              </div>
              <p className='flex flex-col'>
                {categories.find((cat) => cat.id === data.product.subcategory)?.name}
                <span className='text-gray-500 text-xs'> Subcategoría</span>
              </p>
            </>
          )}
        </div>

        <p className='text-sm'>{data.product.description}</p>
        <h5 className='font-semibold m-0'>
          Venta {data.product.sale_type === 'unit' ? 'por' : 'a'}{' '}
          {saleTypes.find((type) => type.key === data.product.sale_type)?.label.toLowerCase()}
        </h5>

        {unitDetails && (
          <section>
            <div className='flex items-center gap-8 mt-1'>
              {unitDetails.base_cost != null && (
                <div className='flex flex-col'>
                  <div className='flex items-center gap-1 '>
                    <NumericFormat
                      value={unitDetails.base_cost}
                      displayType='text'
                      thousandSeparator
                      prefix='$'
                      decimalScale={2}
                      className='text-xl'
                    />
                    <span className='text-xs mt-1'>/ {saleUnitsAvailable.find((u) => u.key === unitDetails.unit)?.label}</span>
                  </div>
                  <span className='text-xs text-gray-500'>Costo base</span>
                </div>
              )}

              <div className='flex flex-col'>
                <div className='flex items-center gap-1 '>
                  <NumericFormat
                    value={unitDetails.public_price}
                    displayType='text'
                    thousandSeparator
                    prefix='$'
                    decimalScale={2}
                    className='text-2xl font-bold'
                  />
                  <span className='text-xs mt-1'>/ {saleUnitsAvailable.find((u) => u.key === unitDetails.unit)?.label}</span>
                </div>
                <span className='text-xs text-gray-500'>Precio público</span>
              </div>
            </div>

            {unitDetails.wholesale_prices && unitDetails.wholesale_prices.length > 0 && (
              <div className='mt-2'>
                <h5 className='font-semibold'>Precios de mayoreo</h5>
                <ul className='grid grid-cols-1'>
                  {unitDetails.wholesale_prices.map((wp, idx) => (
                    <li key={idx} className='flex flex-col'>
                      <span>
                        <NumericFormat
                          value={wp.price}
                          displayType='text'
                          thousandSeparator
                          prefix='$'
                          decimalScale={2}
                          className='text-lg'
                        />{' '}
                        <span className='text-xs'>/ {saleUnitsAvailable.find((u) => u.key === unitDetails.unit)?.label}</span> | Mínimo:{' '}
                        <NumericFormat value={wp.min} displayType='text' thousandSeparator decimalScale={0} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {bulkDetails && (
          <div>
            <div className='flex flex-col'>
              <div className='flex items-center gap-1 '>
                <NumericFormat
                  value={bulkDetails.base_unit_price}
                  displayType='text'
                  thousandSeparator
                  prefix='$'
                  decimalScale={2}
                  className='text-2xl font-bold'
                />
                <span className='text-xs mt-1'>/ {bulkUnitsAvailable.find((b) => b.key === bulkDetails.base_unit)?.label}</span>
              </div>
              <span className='text-xs text-gray-500'>Precio base</span>
            </div>

            {enrichedUnits.length > 0 && (
              <div className='mt-3 grid grid-cols-2 gap-1 text-center'>
                {enrichedUnits.map((u) => (
                  <div key={u.unit.key} className='mt-2 bg-white p-2 border-1 border-gray-300 rounded-lg'>
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

                    <span className='text-xs text-gray-500'>
                      ~
                      <NumericFormat
                        value={Number(u.priceByUnitBaseWithMargin ?? 0).toFixed()}
                        displayType='text'
                        thousandSeparator
                        prefix='$'
                        decimalScale={2}
                      />{' '}
                      por {bulkUnitsAvailable.find((b) => b.key === bulkDetails.base_unit)?.label}
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
