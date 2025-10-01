import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import type { PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { applyToolbarFilters, ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import ProductModal from '../../components/modals/admin/ProductModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
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

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
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

  function exportOne(row: Row) {
    console.log('Exportar', row)
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
          entity='products'
          adapterOverrides={{
            edit: () => onOpenProduct(),
            onRequestDelete: (id) => {
              setDeleteProductId(String(id))
              onOpenDeleteProduct()
            },
            afterChange: fetchData,
            actions: [
              { key: 'export', label: 'Exportar', onPress: (row) => exportOne(row) },
              { key: 'despachar', label: 'Despachar', onPress: (row) => exportOne(row) },
              { key: 'importar', label: 'Importar', onPress: (row) => exportOne(row) }
            ]
            // rowActions: (row) => [{ key:"share", label:"Compartir", onPress: ... }]
          }}
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode='multiple'
          selectionBehavior={selectionBehavior}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        />
      </section>

      <ProductModal isOpen={isOpenProduct} onOpenChange={onOpenChangeProduct} fetchData={fetchData} />

      <OnDeleteModal
        isOpenDelete={isOpenDeleteProduct}
        onOpenChangeDelete={onOpenChangeDeleteProduct}
        deleteType='product'
        itemId={deleteProductId}
      />
    </>
  )
}

export default Products
