import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import BrandModal from '../../components/modals/admin/BrandModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setSelectedBrand } from '../../store/slices/productsSlice'
import { setEditMode } from '../../store/slices/uiSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Brands = () => {
  const dispatch = useDispatch()
  const brands = useSelector((state: RootState) => state.products.brands) ?? []

  type Row = {
    id: number
    name: string
    slug: string
    color?: string
  }
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: true
    },
    {
      key: 'slug',
      label: 'Slug',
      allowsSorting: true
    },
    {
      key: 'color',
      label: 'Color',
      allowsSorting: true
    },
    {
      key: 'total_products',
      label: 'Productos',
      allowsSorting: true,
      align: 'center'
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions'
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'name',
    direction: 'descending'
  })

  // const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()
  const { isOpen: isOpenBrand, onOpen: onOpenBrand, onOpenChange: onOpenChangeBrand } = useDisclosure()

  const filteredRows = applyToolbarFilters(brands, ['name'], criteria)

  const handleAddBrand = () => {
    dispatch(setEditMode(false))
    onOpenBrand()
  }

  const handleEditBrand = (row: Row) => {
    dispatch(setEditMode(true))
    dispatch(setSelectedBrand(row.id))
    setSelectedKeys(new Set([String(row.id)]))
    onOpenBrand()
  }

  return (
    <>
      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={brands}
          searchFilter={['name']}
          buttons={[
            {
              label: 'Agregar marca',
              onPress: handleAddBrand,
              color: 'primary'
            }
          ]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='categories'
          adapterOverrides={{
            edit: (row) => {
              handleEditBrand(row)
            },
            onRequestDelete: (id, row) => {
              console.log('Delete category id:', id)
              dispatch(setSelectedBrand(row.id))
              onOpenDelete()
            }
          }}
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode='single'
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={(row) => row.id as number}
        />
      </section>
      <BrandModal isOpen={isOpenBrand} onOpenChange={onOpenChangeBrand} />
      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='brand' />
    </>
  )
}

export default Brands
