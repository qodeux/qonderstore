import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  CheckboxGroup,
  Listbox,
  ListboxItem,
  ScrollShadow,
  Slider,
  type Selection
} from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectProductsWithBestPromo } from '../../store/selectors/productsWithPromo'
import type { RootState } from '../../store/store'

type Props = {
  isOpen: boolean
  onToggle?: () => void
}

const ProductTypeSearch = [
  { value: 'new', label: 'Nuevo' },
  { value: 'sale', label: 'Oferta' },
  { value: 'featured', label: 'Destacado' },
  { value: 'popular', label: 'Popular' }
]

const CatalogSidebar = ({ isOpen }: Props) => {
  const categories = useSelector((s: RootState) => s.categories.items)
  const brands = useSelector((s: RootState) => s.products.brands)
  const products = useSelector(selectProductsWithBestPromo)

  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Selection>(new Set())
  const [selectedBrandKeys, setSelectedBrandKeys] = useState<Selection>(new Set())

  const accordionContainerRef = useRef<HTMLDivElement>(null)
  const [maxAccordionScrollHeight, setMaxAccordionScrollHeight] = useState(0)

  // --- PRECIOS SEGUROS ---
  const prices = useMemo(() => products.map((p) => Number(p.price)).filter((v) => Number.isFinite(v)), [products])

  // Fallbacks si no hay precios válidos
  const minPrice = prices.length ? Math.floor(Math.min(...prices)) : 0
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 1000

  // Valor controlado del slider (rango)
  const [value, setValue] = useState<[number, number]>([minPrice, maxPrice])

  const didInit = useRef(false)
  useEffect(() => {
    if (prices.length && !didInit.current) {
      setValue([minPrice, maxPrice])
      didInit.current = true
    }
  }, [prices.length, minPrice, maxPrice])

  useEffect(() => {
    const updateSize = () => {
      if (!accordionContainerRef.current) return
      setMaxAccordionScrollHeight(accordionContainerRef.current.offsetHeight - 125)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleReset = () => setValue([minPrice, maxPrice])

  // Si no hay rango real, desactiva el slider
  const sliderDisabled = maxPrice <= minPrice

  return (
    <aside
      className={`
        sticky shadow-sm h-[calc(100vh-4rem)]
        transition-[opacity,transform] duration-300 z-30 p-4
        ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
      `}
      /* El ancho lo controla el layout (grid col) */
    >
      <div className='flex flex-col gap-4 h-full'>
        <CheckboxGroup label='Tipo de producto'>
          {ProductTypeSearch.map((type) => (
            <Checkbox key={type.value} value={type.value} size='sm'>
              {type.label}
            </Checkbox>
          ))}
        </CheckboxGroup>

        <section className='flex flex-col gap-3'>
          <label className='text-foreground-500'>Filtrar por precio</label>

          <Slider
            className='max-w-md'
            value={value}
            onChange={(v) => setValue(v as [number, number])}
            label='Rango'
            minValue={minPrice}
            maxValue={maxPrice}
            step={50}
            formatOptions={{ style: 'currency', currency: 'MXN' }}
            isDisabled={sliderDisabled}
          />

          <div className='flex gap-2 justify-end'>
            <Button size='sm' radius='sm' fullWidth variant='ghost' onPress={handleReset} isDisabled={sliderDisabled}>
              Restablecer
            </Button>
            <Button size='sm' radius='sm' className='bg-black text-white hover:bg-neutral-800' fullWidth isDisabled={sliderDisabled}>
              Filtrar
            </Button>
          </div>
        </section>

        <section className='flex-grow' ref={accordionContainerRef}>
          <Accordion defaultExpandedKeys={['category']} itemClasses={{ trigger: 'py-4', content: 'py-0 pb-4' }} className='px-0'>
            <AccordionItem key='category' title='Categorías'>
              <ScrollShadow style={{ maxHeight: `${maxAccordionScrollHeight}px` }}>
                <Listbox
                  disallowEmptySelection
                  aria-label='categories'
                  selectedKeys={selectedCategoryKeys}
                  selectionMode='multiple'
                  variant='flat'
                  onSelectionChange={setSelectedCategoryKeys}
                  items={categories.filter((c) => c.parent === null)}
                >
                  {(item) => <ListboxItem key={item.slug_id}>{item.name}</ListboxItem>}
                </Listbox>
              </ScrollShadow>
            </AccordionItem>

            <AccordionItem key='brand' title='Marca'>
              <Listbox
                disallowEmptySelection
                aria-label='brands'
                selectedKeys={selectedBrandKeys}
                selectionMode='multiple'
                variant='flat'
                onSelectionChange={setSelectedBrandKeys}
                items={brands}
              >
                {(item) => <ListboxItem key={`brand-${item.id}`}>{item.name}</ListboxItem>}
              </Listbox>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </aside>
  )
}

export default CatalogSidebar
