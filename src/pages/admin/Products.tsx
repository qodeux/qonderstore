import type { Selection, SortDescriptor } from '@heroui/react'
import {
  Button,
  getKeyValue,
  Input,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@heroui/react'
import { CopyPlus, EllipsisVertical, SquareMousePointer, Star } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
const Products = () => {
  type Row = {
    key: string
    name: string
    public_price: string
    category: string
    stock: number
    is_active: boolean
    featured: boolean
  }

  const categories = [
    { id: '1', name: 'Cat' },
    { id: '2', name: 'Dog' },
    { id: '3', name: 'Elephant' },
    { id: '4', name: 'Lion' },
    { id: '5', name: 'Tiger' },
    { id: '6', name: 'Giraffe' },
    { id: '7', name: 'Dolphin' },
    { id: '8', name: 'Penguin' },
    { id: '9', name: 'Zebra' },
    { id: '10', name: 'Shark' },
    { id: '11', name: 'Whale' }
  ]

  const rows = [
    {
      key: '1',
      name: 'Smartphone X1',
      public_price: '$799.00',
      category: 'Electronics',
      stock: 25,
      is_active: true,
      featured: true
    },
    {
      key: '2',
      name: 'Dog Food Premium',
      public_price: '$35.50',
      category: 'Dog',
      stock: 120,
      is_active: true,
      featured: false
    },
    {
      key: '3',
      name: 'Cat Scratching Post',
      public_price: '$49.99',
      category: 'Cat',
      stock: 40,
      is_active: true,
      featured: false
    },
    {
      key: '4',
      name: 'Wireless Headphones',
      public_price: '$199.00',
      category: 'Electronics',
      stock: 15,
      is_active: true,
      featured: true
    },
    {
      key: '5',
      name: 'Lion Plush Toy',
      public_price: '$22.00',
      category: 'Lion',
      stock: 60,
      is_active: false,
      featured: false
    },
    {
      key: '6',
      name: 'Giraffe Print Blanket',
      public_price: '$30.00',
      category: 'Giraffe',
      stock: 35,
      is_active: true,
      featured: false
    },
    {
      key: '7',
      name: 'Penguin Mug',
      public_price: '$12.99',
      category: 'Penguin',
      stock: 80,
      is_active: false,
      featured: true
    },
    {
      key: '8',
      name: 'Shark Fin Pool Float',
      public_price: '$45.00',
      category: 'Shark',
      stock: 10,
      is_active: true,
      featured: false
    },
    {
      key: '9',
      name: 'Zebra Pattern Notebook',
      public_price: '$7.50',
      category: 'Zebra',
      stock: 100,
      is_active: true,
      featured: false
    },
    {
      key: '10',
      name: 'Whale Water Bottle',
      public_price: '$18.00',
      category: 'Whale',
      stock: 55,
      is_active: false,
      featured: true
    }
  ]

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      allowsSorting: true
    },
    {
      key: 'public_price',
      label: 'Precio',
      allowsSorting: true
    },
    {
      key: 'category',
      label: 'Categoría',
      allowsSorting: true
    },
    {
      key: 'stock',
      label: 'Existencias',
      allowsSorting: true
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true
    },
    {
      key: 'featured',
      label: '',
      allowsSorting: false
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false
    }
  ]
  const [filterValue, setFilterValue] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['2']))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'public_price',
    direction: 'ascending'
  })

  const [categoryFilter, setCategoryFilter] = useState<Selection>('all')

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue('')
  }, [])

  const hasSearchFilter = Boolean(filterValue)

  const filteredItems = useMemo(() => {
    let filteredRows = [...rows]

    if (hasSearchFilter) {
      filteredRows = filteredRows.filter(
        (row) => row.name.toLowerCase().includes(filterValue.toLowerCase()) || row.stock.toString() === filterValue.toLocaleLowerCase()
      )
    }

    if (categoryFilter !== 'all' && Array.from(categoryFilter).length !== categories.length) {
      filteredRows = filteredRows.filter((row) => Array.from(categoryFilter).includes(row.category))
    }

    return filteredRows
  }, [rows, filterValue, categoryFilter])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: Row, b: Row) => {
      const first = a[sortDescriptor.column as keyof Row] as number
      const second = b[sortDescriptor.column as keyof Row] as number
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, filteredItems])

  const renderCell = (item: Row, columnKey: React.Key) => {
    const key = String(columnKey) as keyof Row | 'actions'

    switch (key) {
      case 'is_active':
        return <Switch defaultSelected={item.is_active} size='sm' />
      case 'actions':
        return (
          <div className='flex justify-end gap-2'>
            <Button
              size='sm'
              variant='flat'
              onPress={(e) => {
                // evita que la fila se seleccione al presionar el botón
                e?.stopPropagation?.()
                console.log('Editar', item.key)
              }}
              isIconOnly
            >
              <EllipsisVertical />
              {/* o icon-only:
            <Button isIconOnly size="sm" variant="light"><Pencil className="w-4 h-4" /></Button>
            <Button isIconOnly size="sm" variant="light" color="danger"><Trash2 className="w-4 h-4" /></Button>
            */}
            </Button>
          </div>
        )
      case 'featured':
        return item.featured ? <Star fill='#111' /> : <Star />
      default:
        break
    }

    // fallback: muestra el valor de la celda normalmente
    return getKeyValue(item, key as keyof Row)
  }

  const selectionCount = selectedKeys === 'all' ? rows.length : (selectedKeys as Set<React.Key>).size

  return (
    <div>
      <section className='space-y-6'>
        <div className='flex justify-between items-center gap-4'>
          <section className='flex-grow flex items-center gap-4 md:max-w-xl '>
            <Input label='Buscar...' type='text' size='md' value={filterValue} onClear={() => onClear()} onValueChange={onSearchChange} />
            <Select className='max-w-xs' label='Categoria' selectionMode='multiple' isClearable size='sm'>
              {categories.map((animal) => (
                <SelectItem key={animal.id}>{animal.name}</SelectItem>
              ))}
            </Select>
          </section>
          <div className='flex items-center gap-2'>
            <Button isIconOnly onPress={toggleSelectionBehavior} aria-label='Toggle Selection Mode'>
              {selectionBehavior === 'replace' ? <CopyPlus className='w-5 h-5' /> : <SquareMousePointer className='w-5 h-5' />}
            </Button>
            <Button color='primary'>Agregar Producto</Button>
          </div>
        </div>

        <Table
          aria-label='Controlled table example with dynamic content'
          selectedKeys={selectedKeys}
          selectionMode='multiple'
          selectionBehavior={selectionBehavior}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} allowsSorting={column.allowsSorting}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={sortedItems}>
            {(item) => <TableRow key={item.key}>{(columnKey) => <TableCell>{renderCell(item as Row, columnKey)}</TableCell>}</TableRow>}
          </TableBody>
        </Table>
        <section className='flex justify-between items-center mt-4'>
          <div>
            {sortedItems.length} {sortedItems.length === 1 ? 'resultado' : 'resultados'}
            {selectionCount > 0 && (
              <>
                {' '}
                | {selectionCount} {selectionCount === 1 ? 'seleccionado' : 'seleccionados'}
              </>
            )}
          </div>
          <div>Filtros</div>
        </section>
      </section>
    </div>
  )
}

export default Products
