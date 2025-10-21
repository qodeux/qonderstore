import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type PresetKey } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import PromotionModal from '../../components/modals/admin/PromotionModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setIsEditing, setSelectedPromotion } from '../../store/slices/promoSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Promotions = () => {
  const dispatch = useDispatch()

  const promotions = useSelector((state: RootState) => state.promotions.items)

  type Row = {
    id: number
    promo_type: string
    discount_type: string
    frequency: string
    mode_value: number
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
      //type: 'discount_type',
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
      key: 'mode_value',
      label: 'Valor',
      allowsSorting: true
    },
    {
      key: 'valid_until',
      label: 'Vigencia',
      preset: 'date',
      presetConfig: { format: 'short' },
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

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'valid_until',
    direction: 'ascending'
  })

  // const { isOpen: isOpenProduct, onOpen: onOpenProduct, onOpenChange: onOpenChangeProduct } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()
  const { isOpen: isOpenPromotion, onOpen: onOpenPromotion, onOpenChange: onOpenChangePromotion } = useDisclosure()

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(promotions, ['promo_type'], criteria)
  }, [promotions, criteria])

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  const handleAddPromotion = () => {
    dispatch(setIsEditing(false))
    onOpenPromotion()
  }

  const handleEditPromotion = (id: number) => {
    console.log(id)
    dispatch(setIsEditing(true))
    dispatch(setSelectedPromotion(id))

    onOpenPromotion()
  }

  return (
    <>
      <section className='space-y-6'>
        <ToolbarTable<Row>
          rows={filteredRows}
          searchFilter={['promo_type']}
          // filters={[{ label: 'Categoría', column: 'promotion', multiple: true }]}
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
            edit: (row) => handleEditPromotion(row.id),
            onRequestDelete: (id) => {
              dispatch(setSelectedPromotion(Number(id)))
              onOpenDelete()
            }
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
        />
      </section>
      <PromotionModal isOpen={isOpenPromotion} onOpenChange={onOpenChangePromotion} />

      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='promotion' />
    </>
  )
}

export default Promotions
