import type { Selection, SortDescriptor } from '@heroui/react'
import { useDisclosure } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { AlignPreset, FormatPreset, PresetKey } from '../../components/common/DataTable'
import { DataTable } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'

import { useDispatch, useSelector } from 'react-redux'
import ProviderModal from '../../components/modals/admin/ProviderModal'
import ProviderOrderNewModal from '../../components/modals/admin/ProviderOrderNewModal'
import ProviderOrderSupplyModal from '../../components/modals/admin/ProviderOrderSupplyModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { useCatalog } from '../../hooks/useCatalog'
import { setEditMode, setSelectedProvider } from '../../store/slices/providersSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Providers = () => {
  const dispatch = useDispatch()
  const providers = useSelector((state: RootState) => state.providers.items)
  const { layoutOutletHeight, layoutToolbarSpace } = useSelector((state: RootState) => state.ui) ?? {}
  useCatalog('banks')

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
      allowsSorting: true,
      align: 'center' as AlignPreset
    },
    {
      key: 'last_order',
      label: 'Último Pedido',
      preset: 'date' as PresetKey,
      presetConfig: {
        format: 'relative' as FormatPreset
      },
      allowsSorting: true
    },
    {
      key: 'last_payment',
      label: 'Último Pago',
      preset: 'date' as PresetKey,
      presetConfig: {
        format: 'short' as FormatPreset
      },
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
      preset: 'actions' as PresetKey,
      align: 'center' as AlignPreset
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'last_order',
    direction: 'ascending'
  })

  const { isOpen: isOpenProvider, onOpen: onOpenProvider, onOpenChange: onOpenChangeProvider } = useDisclosure()
  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()

  //Disclosure para accciones extra
  const { isOpen: isOpenNewOrder, onOpen: onOpenNewOrder, onOpenChange: onOpenChangeNewOrder } = useDisclosure()
  const { isOpen: isOpenSupplyOrder, onOpen: onOpenSupplyOrder, onOpenChange: onOpenChangeSupplyOrder } = useDisclosure()

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
    setSelectedKeys(new Set([String(id)]))

    onOpenProvider()
  }

  const testAction = (row: Row) => {
    console.log('Test action on row: ', row)
  }

  const handleNewOrder = (row: Row) => {
    console.log('Nuevo pedido', row)
    dispatch(setSelectedProvider(row.id))
    setSelectedKeys(new Set([String(row.id)]))

    onOpenNewOrder()
  }
  const handleOrderSupply = (row: Row) => {
    console.log('Nuevo pedido', row)
    dispatch(setSelectedProvider(row.id))
    onOpenSupplyOrder()
  }

  return (
    <>
      <section className='space-y-4'>
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
              { key: 'new-order', label: 'Nuevo pedido', onPress: (row) => handleNewOrder(row) },
              { key: 'supply-order', label: 'Suministrar pedido', onPress: (row) => handleOrderSupply(row) },
              { key: 'register-payment', label: 'Registrar pago', onPress: (row) => testAction(row) }
            ]
            // rowActions: (row) => [{ key:"share", label:"Compartir", onPress: ... }]
          }}
          rows={filteredRows}
          columns={columns}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          selectionMode='single'
          selectionBehavior='replace'
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={(row) => row.id as number}
          maxHeight={layoutOutletHeight ? layoutOutletHeight - layoutToolbarSpace : undefined}
        />
      </section>

      <ProviderModal isOpen={isOpenProvider} onOpenChange={onOpenChangeProvider} />
      <ProviderOrderNewModal isOpen={isOpenNewOrder} onOpenChange={onOpenChangeNewOrder} />
      <ProviderOrderSupplyModal isOpen={isOpenSupplyOrder} onOpenChange={onOpenChangeSupplyOrder} />

      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='provider' />
    </>
  )
}

export default Providers
