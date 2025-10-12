import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'

import { useDispatch, useSelector } from 'react-redux'
import ProviderModal from '../../components/modals/admin/ProviderModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { setEditMode, setSelectedProvider } from '../../store/slices/providersSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Providers = () => {
  const dispatch = useDispatch()
  const providers = useSelector((state: RootState) => state.providers.items)

  type Row = {
    id: number
    alias: string
    name: string
    orders?: number | null
    last_order?: string | null
    last_payment?: string | null
    is_active: boolean
  }

  const columns = [
    {
      key: 'alias',
      label: 'Alias',
      allowsSorting: true
    },
    {
      key: 'orders',
      label: 'Pedidos',
      allowsSorting: true
    },
    {
      key: 'last_order',
      label: 'Último Pedido',
      // type: 'date',
      // datePreset: 'relative',
      allowsSorting: true
    },
    {
      key: 'last_payment',
      label: 'Último Pago',
      // type: 'date' as TypePreset,
      // datePreset: 'full',
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

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'last_order',
    direction: 'descending'
  })

  const { isOpen: isOpenProvider, onOpen: onOpenProvider, onOpenChange: onOpenChangeProvider } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(providers, ['name'], criteria)
  }, [providers, criteria])

  const handleAddProvider = () => {
    dispatch(setEditMode(false))
    onOpenProvider()
  }

  const handleEditProvider = (id: number) => {
    dispatch(setEditMode(true))
    dispatch(setSelectedProvider(id))
    onOpenProvider()
  }

  const testAction = (row: Row) => {
    console.log('Test action on row: ', row)
  }

  return (
    <>
      <section className='space-y-6'>
        <ToolbarTable<Row>
          rows={providers}
          searchFilter={['name']}
          //filters={[{ label: 'Categoría', column: 'category', multiple: true }]}

          buttons={[{ label: 'Agregar proveedor', onPress: handleAddProvider, color: 'primary' }]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='providers'
          adapterOverrides={{
            edit: (row) => handleEditProvider(row.id),
            onRequestDelete: (id, item) => {
              console.log(id)
              dispatch(setSelectedProvider(item.id))
              onOpenDelete()
            },
            actions: [
              { key: 'new-order', label: 'Nuevo pedido', onPress: (row) => testAction(row) },
              { key: 'supply-order', label: 'Suministrar pedido', onPress: (row) => testAction(row) },
              { key: 'register-payment', label: 'Registrar pago', onPress: (row) => testAction(row) }
            ]
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

      <ProviderModal isOpen={isOpenProvider} onOpenChange={onOpenChangeProvider} />

      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='provider' />
    </>
  )
}

export default Providers
