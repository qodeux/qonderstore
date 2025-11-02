// components/store/OrderBy.tsx
import { Button, Select, SelectItem, Tooltip, type Selection } from '@heroui/react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCatalogFilters } from '../../store/selectors/catalogSelectors'
import { setSort } from '../../store/slices/productFiltersSlice'

const keyToSortBy = (k: string) => (k === 'precio' ? 'price' : k === 'popularidad' ? 'popularity' : ('rating' as const))

const sortByToKey = (by: 'price' | 'popularity' | 'rating' | 'relevance') =>
  by === 'price' ? 'precio' : by === 'popularity' ? 'popularidad' : by === 'rating' ? 'valoracion' : null

const OrderBy = () => {
  const dispatch = useDispatch()
  const { sortBy, sortDir } = useSelector(selectCatalogFilters)

  // Mantén el Select controlado por Redux (si está en 'relevance', no mostramos nada seleccionado)
  const selectedKey = useMemo<Selection>(() => {
    const key = sortByToKey(sortBy)
    return key ? new Set([key]) : new Set()
  }, [sortBy])

  const showSortDirection = sortBy !== 'relevance'

  const toggleSortDirection = () => {
    dispatch(setSort({ by: sortBy, dir: sortDir === 'asc' ? 'desc' : 'asc' }))
  }

  return (
    <div className='flex items-center w-full'>
      <Select
        label='Ordenar por'
        size='sm'
        className='flex-1 w-full'
        classNames={{
          trigger: `w-full bg-white border-gray-300 ${showSortDirection ? 'rounded-r-none' : ''}`
        }}
        variant='bordered'
        radius='sm'
        selectedKeys={selectedKey}
        onSelectionChange={(s: Selection) => {
          // Si se limpia (isClearable) → volvemos a 'relevance'
          if (s === 'all' || (s instanceof Set && s.size === 0)) {
            dispatch(setSort({ by: 'relevance' }))
            return
          }
          const v = Array.from(s as Set<string>)[0]
          const by = keyToSortBy(v)
          // No forzamos dir aquí: el slice ya pone defaults sensatos por by
          dispatch(setSort({ by }))
        }}
        isClearable
      >
        <SelectItem key='precio'>Precio</SelectItem>
        <SelectItem key='popularidad'>Popularidad</SelectItem>
        <SelectItem key='valoracion'>Valoración</SelectItem>
      </Select>

      {showSortDirection && (
        <Tooltip content={`Mostrar de ${sortDir === 'asc' ? 'menor a mayor' : 'mayor a menor'}`}>
          <Button
            variant='ghost'
            isIconOnly
            size='lg'
            onPress={toggleSortDirection}
            aria-label='Cambiar dirección de orden'
            className='rounded-lg rounded-l-none border-l-0'
          >
            {sortDir === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
          </Button>
        </Tooltip>
      )}
    </div>
  )
}

export default OrderBy
