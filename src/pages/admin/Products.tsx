import type { Selection } from '@heroui/react'
import {
  Button,
  getKeyValue,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@heroui/react'
import { CopyPlus, EllipsisVertical, SquareMousePointer, Star } from 'lucide-react'
import { useState } from 'react'
const Products = () => {
  type Row = {
    key: string
    name: string
    public_price: string
    category: string
    stock: number
    status: string
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
      status: 'Active',
      featured: true
    },
    {
      key: '2',
      name: 'Dog Food Premium',
      public_price: '$35.50',
      category: 'Dog',
      stock: 120,
      status: 'Active',
      featured: false
    },
    {
      key: '3',
      name: 'Cat Scratching Post',
      public_price: '$49.99',
      category: 'Cat',
      stock: 40,
      status: 'Inactive',
      featured: false
    },
    {
      key: '4',
      name: 'Wireless Headphones',
      public_price: '$199.00',
      category: 'Electronics',
      stock: 15,
      status: 'Active',
      featured: true
    },
    {
      key: '5',
      name: 'Lion Plush Toy',
      public_price: '$22.00',
      category: 'Lion',
      stock: 60,
      status: 'Active',
      featured: false
    },
    {
      key: '6',
      name: 'Giraffe Print Blanket',
      public_price: '$30.00',
      category: 'Giraffe',
      stock: 35,
      status: 'Inactive',
      featured: false
    },
    {
      key: '7',
      name: 'Penguin Mug',
      public_price: '$12.99',
      category: 'Penguin',
      stock: 80,
      status: 'Active',
      featured: true
    },
    {
      key: '8',
      name: 'Shark Fin Pool Float',
      public_price: '$45.00',
      category: 'Shark',
      stock: 10,
      status: 'Active',
      featured: false
    },
    {
      key: '9',
      name: 'Zebra Pattern Notebook',
      public_price: '$7.50',
      category: 'Zebra',
      stock: 100,
      status: 'Inactive',
      featured: false
    },
    {
      key: '10',
      name: 'Whale Water Bottle',
      public_price: '$18.00',
      category: 'Whale',
      stock: 55,
      status: 'Active',
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
      key: 'status',
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

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['2']))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  const renderCell = (item: Row, columnKey: React.Key) => {
    const key = String(columnKey) as keyof Row | 'actions'

    if (key === 'actions') {
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
    }

    if (key === 'featured') {
      return item.featured ? <Star fill='#111' /> : <Star />
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
            <Input label='Buscar...' type='text' size='md' />
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
        >
          <TableHeader columns={columns}>{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}</TableHeader>
          <TableBody items={rows}>
            {(item) => <TableRow key={item.key}>{(columnKey) => <TableCell>{renderCell(item as Row, columnKey)}</TableCell>}</TableRow>}
          </TableBody>
        </Table>
        <section className='flex justify-between items-center mt-4'>
          <div>
            {rows.length} {rows.length === 1 ? 'resultado' : 'resultados'}
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
