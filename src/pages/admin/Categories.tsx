import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import CategoryModal from '../../components/modals/admin/CategoryModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setEditMode, setSelectedCategory } from '../../store/slices/categoriesSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Categories = () => {
  const dispatch = useDispatch()
  const categories = useSelector((state: RootState) => state.categories.items) ?? []

  type Row = {
    id: number
    name: string
    slug_id: string
    slug: string
    total_products?: number
    parent?: number
    parent_name?: string | null
    last_update: string
    is_active: boolean
    color?: string
  }
  const columns: ColumnDef<Row>[] = [
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: true
    },
    {
      key: 'slug_id',
      label: 'Clave',
      allowsSorting: true,
      align: 'center'
    },
    {
      key: 'slug',
      label: 'Slug',
      allowsSorting: true
    },
    {
      key: 'parent_name',
      label: 'Categoria principal',
      allowsSorting: true
    },
    {
      key: 'total_products',
      label: 'Productos',
      allowsSorting: true,
      align: 'center'
    },
    {
      key: 'last_update',
      label: 'Última actualización',
      allowsSorting: true,
      preset: 'date'
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true,
      preset: 'is_active'
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions',
      align: 'center'
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'parent_name',
    direction: 'descending'
  })

  // const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()
  const { isOpen: isOpenCategory, onOpen: onOpenCategory, onOpenChange: onOpenChangeCategory } = useDisclosure()

  const filteredRows = applyToolbarFilters(categories, ['name'], criteria)

  const handleAddCategory = () => {
    dispatch(setEditMode(false))
    onOpenCategory()
  }

  const handleEditCategory = (row: Row) => {
    dispatch(setEditMode(true))
    dispatch(setSelectedCategory(row))
    setSelectedKeys(new Set([String(row.id)]))
    onOpenCategory()
  }

  return (
    <>
      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={categories}
          searchFilter={['name']}
          filters={[{ label: 'Categoría', column: 'parent_name', multiple: true }]}
          buttons={[
            {
              label: 'Agregar categoría',
              onPress: handleAddCategory,
              color: 'primary'
            }
          ]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='categories'
          adapterOverrides={{
            edit: (row) => {
              handleEditCategory(row)
            },
            onRequestDelete: (id, row) => {
              console.log('Delete category id:', id)
              dispatch(setSelectedCategory(row))
              onOpenDelete()
            }
            // rowActions: (row) => [{ key:"share", label:"Compartir", onPress: ... }]
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
      <CategoryModal isOpen={isOpenCategory} onOpenChange={onOpenChangeCategory} />

      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='category' />
    </>
  )
}

export default Categories
