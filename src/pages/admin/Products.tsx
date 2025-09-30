import type { Selection, SortDescriptor } from '@heroui/react'
import { Button, Input, Select, SelectItem, useDisclosure } from '@heroui/react'
import { CopyPlus, SquareMousePointer } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import ProductModal from '../../components/modals/admin/ProductModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import supabase from '../../lib/supabase'
import { productService } from '../../services/productService'
import { categories } from '../../types/products'
const Products = () => {
  type Row = {
    key: string
    sku: string
    name: string
    slug: string
    price: string
    category: string
    brand?: string
    stock: number
    is_active: boolean
    featured: boolean
    created_at: string
  }

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      allowsSorting: true
    },
    {
      key: 'price',
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

  const [rowsDB, setRowsDB] = useState<Row[]>([])

  const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDeleteProduct, onOpen: onOpenDeleteProduct, onOpenChange: onOpenChangeDeleteProduct } = useDisclosure()

  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  const [filterValue, setFilterValue] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['2']))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [categoryFilter, setCategoryFilter] = useState<Set<number> | 'all'>('all')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'price',
    direction: 'ascending'
  })

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

  // const filteredItems = useMemo(() => {
  //   let filteredRows = [...rowsDB]

  //   if (hasSearchFilter) {
  //     filteredRows = filteredRows.filter(
  //       (row) => row.name.toLowerCase().includes(filterValue.toLowerCase()) || row.stock.toString() === filterValue.toLocaleLowerCase()
  //     )
  //   }

  //   if (categoryFilter !== 'all' && Array.from(categoryFilter).length !== categories.length) {
  //     filteredRows = filteredRows.filter((row) => Array.from(categoryFilter).includes(row.category))
  //   }

  //   return filteredRows
  // }, [rowsDB, filterValue, categoryFilter])

  // callbacks comunes

  async function onToggleActive(row: Row, next: boolean) {
    await supabase.from('products').update({ is_active: next }).eq('id', row.key)
    fetchData()
  }
  async function onToggleFeatured(row: Row, next: boolean) {
    await supabase.from('products').update({ featured: next }).eq('id', row.key)
    fetchData()
  }
  function onEdit(row: Row) {
    // abre tu modal de edición
    // setEditRow(row); onOpenProduct();
  }
  function onDelete(row: Row) {
    setDeleteProductId(row.key)
    onOpenDeleteProduct()
  }

  async function fetchData() {
    const productsDB = await productService.fetchProducts()
    console.log(productsDB)

    if (productsDB) {
      setRowsDB(
        productsDB.map((product) => ({
          key: product.id.toString(),
          name: product.name,
          price: product.price,
          category: categories.find((cat) => cat.id.toString() === product.category)?.name || 'N/A',
          stock: product.stock,
          is_active: product.is_active,
          featured: product.featured,
          sku: product.sku,
          slug: product.slug,
          created_at: product.created_at
        }))
      )
    }
  }

  async function deleteProduct(productId: string | null) {
    if (!productId) return

    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
    } else {
      console.log('Product deleted successfully')
      onOpenChangeDeleteProduct()
      fetchData()
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <section className='space-y-6'>
        <div className='flex justify-between items-center gap-4'>
          <section className='flex-grow flex items-center gap-4 md:max-w-xl '>
            <Input label='Buscar...' type='text' size='md' value={filterValue} onClear={() => onClear()} onValueChange={onSearchChange} />
            <Select className='max-w-xs' label='Categoria' selectionMode='multiple' isClearable size='sm'>
              {categories.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>
          </section>
          <div className='flex items-center gap-2'>
            <Button isIconOnly onPress={toggleSelectionBehavior} aria-label='Toggle Selection Mode'>
              {selectionBehavior === 'replace' ? <CopyPlus className='w-5 h-5' /> : <SquareMousePointer className='w-5 h-5' />}
            </Button>
            <Button color='primary' onPress={onOpenProduct}>
              Agregar Producto
            </Button>
          </div>
        </div>

        <DataTable<Row>
          rows={rowsDB}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionBehavior={selectionBehavior}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          toggles={{ onToggleActive, onToggleFeatured }}
          actions={{ onEdit, onDelete }}
        />
      </section>

      <ProductModal isOpen={isOpenProduct} onOpenChange={onOpenChangeProduct} fetchData={fetchData} />

      <OnDeleteModal
        deleteType='product'
        isOpenDeleteProduct={isOpenDeleteProduct}
        onOpenChangeDeleteProduct={onOpenChangeDeleteProduct}
        deleteProduct={deleteProduct}
        deleteProductId={deleteProductId}
      />
    </div>
  )
}

export default Products
