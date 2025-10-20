import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import type { Key } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AlignPreset, ColumnDef, PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'

import { useDispatch, useSelector } from 'react-redux'
import ProductModal from '../../components/modals/admin/ProductModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setEditMode, setSelectedProduct } from '../../store/slices/productsSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const selectionCount = (s: Selection, total: number) => (s === 'all' ? total : s.size)

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

  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      label: 'Producto',
      allowsSorting: true
    },
    {
      key: 'category',
      label: 'Categoría',
      allowsSorting: true
    },
    {
      key: 'price',
      label: 'Precio',
      allowsSorting: true,
      preset: 'money' as PresetKey,
      align: 'end' as AlignPreset
    },
    {
      key: 'stock',
      label: 'Existencias',
      allowsSorting: true,
      align: 'center' as AlignPreset
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true,
      preset: 'is_active' as PresetKey,
      align: 'center' as AlignPreset
    },
    {
      key: 'featured',
      label: '',
      allowsSorting: false,
      preset: 'featured' as PresetKey,
      align: 'center' as AlignPreset
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions' as PresetKey,
      align: 'center' as AlignPreset
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

  // CONSISTENCIA: usa strings como key en tabla y selección
  const getRowKey = (row: Row) => String(row.id)

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // limpiar selección cuando cambia el modo
  }

  const handleAddProduct = () => {
    dispatch(setEditMode(false))
    onOpenProduct()
  }

  const handleEditProduct = (id: number) => {
    dispatch(setEditMode(true))
    dispatch(setSelectedProduct(id))
    setSelectedKeys(new Set([String(id)])) // coincide con getRowKey
    onOpenProduct()
  }

  // ¿hay selección múltiple?
  const count = selectionCount(selectedKeys, filteredRows.length)
  const isMulti = selectionBehavior === 'toggle' && count > 1

  // Botones de la toolbar derivados del estado actual (evita mutaciones con push)
  const toolbarButtons = useMemo(() => {
    const base = [{ label: 'Agregar Producto', onPress: handleAddProduct, color: 'primary' as const }]
    if (!isMulti) return base
    return [
      ...base,
      {
        label: 'Crear nuevo pedido ',
        color: 'secondary' as const,
        onPress: () => {
          const keys = selectedKeys === 'all' ? filteredRows.map(getRowKey) : Array.from(selectedKeys as Set<Key>)
          console.log('Acción masiva en', keys)
          // tu lógica masiva aquí...
        }
      }
    ]
  }, [isMulti, selectedKeys, filteredRows])

  // (Opcional) detectar transición 1↔︎múltiple por si necesitas efectos secundarios
  const prevIsMultiRef = useRef(false)
  useEffect(() => {
    if (prevIsMultiRef.current !== isMulti) {
      // console.log(isMulti ? '➡️ pasó a múltiple' : '⬅️ volvió a uno/ninguno')
      prevIsMultiRef.current = isMulti
    }
  }, [isMulti])

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
          buttons={toolbarButtons}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='products'
          adapterOverrides={{
            edit: (row) => handleEditProduct(row.id),
            onRequestDelete: (_id, item) => {
              dispatch(setSelectedProduct(item.id))
              onOpenDeleteProduct()
            }
          }}
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode={selectionBehavior === 'replace' ? 'single' : 'multiple'}
          selectionBehavior={selectionBehavior}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={getRowKey}
          maxHeight={layoutOutletHeight ? layoutOutletHeight - (layoutToolbarSpace ?? 0) : undefined}
        />
      </section>

      <ProductModal isOpen={isOpenProduct} onOpenChange={onOpenChangeProduct} />
      <OnDeleteModal isOpenDelete={isOpenDeleteProduct} onOpenChangeDelete={onOpenChangeDeleteProduct} deleteType='product' />
    </>
  )
}

export default Products
