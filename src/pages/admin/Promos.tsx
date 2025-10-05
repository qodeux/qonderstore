import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type PresetKey } from '../../components/common/DataTable'
import { applyToolbarFilters, ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import PromotionModal from '../../components/modals/admin/PromotionModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { promotionsService } from '../../services/promotionService'

const Promotions = () => {
  //const dispatch = useDispatch()
  type Row = {
    key: string
    promo_type: string
    discount_type: string
    frequency: string
    mode: string
    value: string
    valid_until?: string
    is_active: boolean
  }

  const columns = [
    {
      key: 'promo_type',
      label: 'Tipo',
      allowsSorting: true
    },
    {
      key: 'discount_type',
      label: 'Descuento',
      allowsSorting: true
    },
    {
      key: 'frequency',
      label: 'Frecuencia',
      allowsSorting: true
    },
    {
      key: 'mode',
      label: 'Modalidad',
      allowsSorting: true
    },
    {
      key: 'value',
      label: 'Valor',
      allowsSorting: true
    },
    {
      key: 'valid_until',
      label: 'Vigencia',
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
    column: 'valid_until',
    direction: 'ascending'
  })

  // const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()
  const { isOpen: isOpenCategory, onOpen: onOpenCategory, onOpenChange: onOpenChangeCategory } = useDisclosure()

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(rowsDB, ['promo_type'], criteria)
  }, [rowsDB, criteria])

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  async function fetchData() {
    const promotionsDB = await promotionsService.fetchPromotion()
    console.log(promotionsDB)

    if (promotionsDB) {
      setRowsDB(
        promotionsDB.map((promotions) => ({
          key: promotions.id.toString(),
          promo_type: promotions.promo_type,
          discount_type: promotions.discount_type,
          frequency: promotions.frequency,
          mode: promotions.mode,
          value: promotions.value,
          valid_until: promotions.valid_until,
          is_active: promotions.is_active || false
        }))
      )
    }
  }

  const handleAddPromotion = () => {
    // dispatch(setEditMode(false))
    onOpenCategory()
  }

  const handleEditCategory = () => {
    //dispatch(setEditMode(true))
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
          searchFilter={['promo_type']}
          // filters={[{ label: 'Categoría', column: 'category', multiple: true }]}
          enableToggleBehavior
          selectionBehavior={selectionBehavior}
          onToggleBehavior={toggleSelectionBehavior}
          buttons={[
            {
              label: 'Agregar Promoción',
              onPress: handleAddPromotion,
              color: 'primary'
            }
          ]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='promotions'
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
      <PromotionModal isOpen={isOpenCategory} onOpenChange={onOpenChangeCategory} fetchData={fetchData} />

      <OnDeleteModal
        isOpenDelete={isOpenDelete}
        onOpenChangeDelete={onOpenChangeDelete}
        deleteType='category'
        itemId={deleteCategoryId}
        //fetchData={fetchData}
      />
    </>
  )
}

export default Promotions
