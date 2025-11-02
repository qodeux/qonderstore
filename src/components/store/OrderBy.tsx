import { Button, Select, SelectItem, Tooltip, type Selection } from '@heroui/react'
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { useState } from 'react'

const OrderBy = () => {
  const [selectedKey, setSelectedKey] = useState<Selection>(new Set())
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const showSortDirection = selectedKey !== 'all' && selectedKey.size > 0

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  //   useEffect(() => {
  //     setSortDirection('asc')
  //   }, [selectedKey])

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
        onSelectionChange={setSelectedKey}
        isClearable
      >
        <SelectItem key='precio'>Precio</SelectItem>
        <SelectItem key='popularidad'>Popularidad</SelectItem>
        <SelectItem key='valoracion'>Valoración</SelectItem>
      </Select>

      {showSortDirection && (
        <Tooltip content={`Mostrar de ${sortDirection === 'asc' ? 'menor a mayor' : 'mayor a menor'}`}>
          <Button
            variant='ghost'
            isIconOnly
            size='lg'
            onPress={toggleSortDirection}
            aria-label='Cambiar dirección de orden'
            className='rounded-lg rounded-l-none border-l-0'
          >
            {sortDirection === 'asc' ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
          </Button>
        </Tooltip>
      )}
    </div>
  )
}

export default OrderBy
