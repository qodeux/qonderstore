import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'

import { useDispatch, useSelector } from 'react-redux'
import ProductModal from '../../components/modals/admin/ProductModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setEditMode, setSelectedProduct } from '../../store/slices/productsSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Products = () => {
  const dispatch = useDispatch()
  const products = useSelector((state: RootState) => state.products.items)
  const { layoutOutletHeight, layoutToolbarSpace } = useSelector((state: RootState) => state.ui) ?? {}

  type Row = {
    id: number
    name: string
    price: number
    category: string
    stock?: number
    is_active: boolean
    featured: boolean
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

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

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
    return applyToolbarFilters(products, ['name'], criteria)
  }, [products, criteria])

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  // function exportOne(row: Row) {
  //   console.log('Exportar', row)
  // }

  const handleAddProduct = () => {
    dispatch(setEditMode(false))
    onOpenProduct()
  }

  const handleEditProduct = (id: number) => {
    dispatch(setEditMode(true))
    dispatch(setSelectedProduct(id))
    onOpenProduct()
  }

  return (
    <>
      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={products}
          searchFilter={['name']}
          filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
          enableToggleBehavior
          selectionBehavior={selectionBehavior}
          onToggleBehavior={toggleSelectionBehavior}
          buttons={[{ label: 'Agregar Producto', onPress: handleAddProduct, color: 'primary' }]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='products'
          adapterOverrides={{
            edit: (row) => handleEditProduct(row.id),
            onRequestDelete: (id, item) => {
              console.log(id)
              dispatch(setSelectedProduct(item.id))
              onOpenDeleteProduct()
            }
            // actions: [
            //   { key: 'solicitar', label: 'Solicitar', onPress: (row) => exportOne(row) },
            //   { key: 'suministrar', label: 'Suministrar', onPress: (row) => exportOne(row) }
            // ]
            // rowActions: (row) => [{ key:"share", label:"Compartir", onPress: ... }]
          }}
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode='single'
          selectionBehavior={selectionBehavior}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={(row) => row.id as number}
          maxHeight={layoutOutletHeight ? layoutOutletHeight - layoutToolbarSpace : undefined}
        />
      </section>

      <ProductModal isOpen={isOpenProduct} onOpenChange={onOpenChangeProduct} />

      <OnDeleteModal isOpenDelete={isOpenDeleteProduct} onOpenChangeDelete={onOpenChangeDeleteProduct} deleteType='product' />
    </>
  )
}

export default Products
