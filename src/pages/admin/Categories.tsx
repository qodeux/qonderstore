import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DataTable, type PresetKey } from '../../components/common/DataTable'
import { applyToolbarFilters, ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import CategoryModal from '../../components/modals/admin/CategoryModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { categoryService } from '../../services/categoryService'
import { setEditMode } from '../../store/slices/categoriesSlice'

const Categories = () => {
  const dispatch = useDispatch()

  type Row = {
    key: string
    name: string
    prefix: string
    total_products: number
    parent: string
    is_active: boolean
    color: string
  }
  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      allowsSorting: true
    },
    {
      key: 'total_products',
      label: 'Productos',
      allowsSorting: true
    },
    {
      key: 'prefix',
      label: 'Clave',
      allowsSorting: true
    },
    {
      key: 'parent',
      label: 'Categoria principal',
      allowsSorting: true
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true,
      preset: 'is_active' as PresetKey
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

  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'price',
    direction: 'ascending'
  })

  // const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()
  const { isOpen: isOpenCategory, onOpen: onOpenCategory, onOpenChange: onOpenChangeCategory } = useDisclosure()

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(rowsDB, ['name'], criteria)
  }, [rowsDB, criteria])

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  async function fetchData() {
    const categoriesDB = await categoryService.fetchCategories()
    console.log(categoriesDB)

    if (categoriesDB) {
      setRowsDB(
        categoriesDB.map((category) => ({
          key: category.id.toString(),
          name: category.name,
          prefix: category.slug_id,
          total_products: category.total_products,
          parent: category.parent_name,
          is_active: category.is_active,
          color: category.color
        }))
      )
    }
  }
  const handleAddCategory = () => {
    dispatch(setEditMode(false))
    onOpenCategory()
  }

  const handleEditCategory = () => {
    dispatch(setEditMode(true))
    onOpenCategory()
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
          // filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
          enableToggleBehavior
          selectionBehavior={selectionBehavior}
          onToggleBehavior={toggleSelectionBehavior}
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
            edit: handleEditCategory,
            onRequestDelete: (id) => {
              setDeleteCategoryId(String(id))
              onOpenDelete()
            },
            afterChange: fetchData
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
      <CategoryModal isOpen={isOpenCategory} onOpenChange={onOpenChangeCategory} fetchData={fetchData} />

      <OnDeleteModal
        isOpenDelete={isOpenDelete}
        onOpenChangeDelete={onOpenChangeDelete}
        deleteType='category'
        itemId={deleteCategoryId}
        fetchData={fetchData}
      />
    </>
  )
}

export default Categories
