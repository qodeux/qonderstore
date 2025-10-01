import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import type { PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { applyToolbarFilters, ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
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
      allowsSorting: true,
      preset: 'is_active' as PresetKey
    },
    {
      key: 'featured',
      label: '',
      allowsSorting: false,
      preset: 'featured' as PresetKey
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions' as PresetKey
    }
  ]

  const [rowsDB, setRowsDB] = useState<Row[]>([])

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['2']))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'price',
    direction: 'ascending'
  })

  const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDeleteProduct, onOpen: onOpenDeleteProduct, onOpenChange: onOpenChangeDeleteProduct } = useDisclosure()

  // Filtra las filas según criterios del toolbar
  const filteredRows = useMemo(() => {
    return applyToolbarFilters(rowsDB, ['name'], criteria)
  }, [rowsDB, criteria])

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

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
          category: categories.find((cat) => cat.id == product.category)?.name || 'N/A',
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

  // carga inicial
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <section className='space-y-6'>
        <ToolbarTable<Row>
          rows={rowsDB}
          searchFilter={['name']}
          filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
          enableToggleBehavior
          selectionBehavior={selectionBehavior}
          onToggleBehavior={toggleSelectionBehavior}
          buttons={[{ label: 'Agregar Producto', onPress: onOpenProduct, color: 'primary' }]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          rows={filteredRows}
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
        isOpenDeleteProduct={isOpenDeleteProduct}
        onOpenChangeDeleteProduct={onOpenChangeDeleteProduct}
        deleteType='product'
        itemId={deleteProductId}
      />
    </>
  )
}

export default Products
