// components/store/CatalogSidebar.tsx
import { Accordion, AccordionItem, Button, Checkbox, CheckboxGroup, Listbox, ListboxItem, ScrollShadow, Slider } from '@heroui/react'
import { Circle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCatalogFilters, selectPriceDomain } from '../../store/selectors/catalogSelectors'
import { setBrandIds, setCategorySlugs, setPriceRange, setTypes } from '../../store/slices/productFiltersSlice'
import type { RootState } from '../../store/store'
import { arrayToSelection, selectionToArray } from '../../utils/selection'

type Props = { isOpen: boolean }
const ProductTypeSearch = [
  { value: 'new', label: 'Nuevo' },
  { value: 'sale', label: 'Oferta' },
  { value: 'featured', label: 'Destacado' },
  { value: 'popular', label: 'Popular' }
] as const

const CatalogSidebar = ({ isOpen }: Props) => {
  const dispatch = useDispatch()
  const categories = useSelector((s: RootState) => s.categories.items)
  const brands = useSelector((s: RootState) => s.products.brands)

  const filters = useSelector(selectCatalogFilters)
  const priceDomain = useSelector(selectPriceDomain) // {min,max} global

  // Estado controlado del slider (lee filtro; si null, usa dominio completo)
  const currentMin = filters.priceMin ?? priceDomain.min
  const currentMax = filters.priceMax ?? priceDomain.max
  const sliderValue: [number, number] = [currentMin, currentMax]

  const sliderDisabled = priceDomain.max <= priceDomain.min

  // Altura scroll acordeón (igual que ya tenías)
  const accordionContainerRef = useRef<HTMLDivElement>(null)
  const [maxAccordionScrollHeight, setMaxAccordionScrollHeight] = useState(0)
  useEffect(() => {
    const updateSize = () => {
      if (!accordionContainerRef.current) return
      setMaxAccordionScrollHeight(accordionContainerRef.current.offsetHeight - 125)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleResetPrice = () => dispatch(setPriceRange({ min: null, max: null }))

  return (
    <aside
      className={`
        sticky shadow-sm h-[calc(100vh-4rem)]
        transition-[opacity,transform] duration-300 z-30 p-4
        ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
      `}
    >
      <div className='flex flex-col gap-4 h-full'>
        {/* TIPOS */}
        <label className='text-foreground-500 flex items-center gap-1'>
          <Circle className='w-3 pt-1' fill='#17c964' /> Tipo de producto
        </label>

        <CheckboxGroup value={filters.types} onChange={(vals) => dispatch(setTypes(vals as typeof filters.types))}>
          {ProductTypeSearch.map((t) => (
            <Checkbox key={t.value} value={t.value} size='sm'>
              {t.label}
            </Checkbox>
          ))}
        </CheckboxGroup>

        {/* PRECIO */}
        <section className='flex flex-col gap-3'>
          <label className='text-foreground-500 flex items-center gap-1'>
            <Circle className='w-3 pt-1' fill='#006fee' />
            Filtrar por precio
          </label>

          <Slider
            className='max-w-md'
            value={sliderValue}
            onChange={(v) => {
              const [min, max] = v as [number, number]
              dispatch(
                setPriceRange({
                  min: min === priceDomain.min ? null : min,
                  max: max === priceDomain.max ? null : max
                })
              )
            }}
            label='Rango'
            minValue={priceDomain.min}
            maxValue={priceDomain.max}
            step={50}
            formatOptions={{ style: 'currency', currency: 'MXN' }}
            isDisabled={sliderDisabled}
          />

          <div className='flex gap-2 justify-end'>
            <Button size='sm' radius='sm' variant='ghost' fullWidth onPress={handleResetPrice} isDisabled={sliderDisabled}>
              Restablecer
            </Button>
          </div>
        </section>

        {/* CATEGORÍAS & MARCAS */}
        <section className='flex-grow' ref={accordionContainerRef}>
          <Accordion defaultExpandedKeys={['category']} itemClasses={{ trigger: 'py-4', content: 'py-0 pb-4' }} className='px-0'>
            <AccordionItem
              key='category'
              title={
                <label className='text-foreground-500 flex items-center gap-1'>
                  <Circle className='w-3 pt-1' fill='#7828c8' /> Categorías
                </label>
              }
            >
              <ScrollShadow style={{ maxHeight: `${maxAccordionScrollHeight}px` }}>
                <Listbox
                  aria-label='categories'
                  selectedKeys={arrayToSelection(filters.categorySlugs)}
                  selectionMode='multiple'
                  variant='flat'
                  onSelectionChange={(s) => dispatch(setCategorySlugs(selectionToArray(s)))}
                  items={categories.filter((c) => c.parent === null)}
                >
                  {(item) => <ListboxItem key={item.slug_id}>{item.name}</ListboxItem>}
                </Listbox>
              </ScrollShadow>
            </AccordionItem>

            <AccordionItem
              key='brand'
              title={
                <label className='text-foreground-500 flex items-center gap-1'>
                  <Circle className='w-3 pt-1' fill='#f31260' /> Marca
                </label>
              }
            >
              <Listbox
                aria-label='brands'
                selectedKeys={arrayToSelection(filters.brandIds)}
                selectionMode='multiple'
                variant='flat'
                onSelectionChange={(s) => dispatch(setBrandIds(selectionToArray(s).map(Number)))}
                items={brands}
              >
                {(item) => <ListboxItem key={String(item.id)}>{item.name}</ListboxItem>}
              </Listbox>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </aside>
  )
}

export default CatalogSidebar
