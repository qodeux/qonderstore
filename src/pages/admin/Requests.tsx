import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { requestAccessService } from '../../services/requestAccessService'
import { setSelectedRequest } from '../../store/slices/requestAccessSlice'
import type { RootState } from '../../store/store'
import { requestStatusMap } from '../../types/requests'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Requests = () => {
  const requests = useSelector((state: RootState) => state.requestAccess.items)
  const user = useSelector((state: RootState) => state.auth.user)
  const { layoutOutletHeight, layoutToolbarSpace } = useSelector((state: RootState) => state.ui) ?? {}
  const dispatch = useDispatch()

  type Row = {
    id: number
    phone: string
    alias: string
    email: string
    status: string
    created_at: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'phone',
      label: 'Teléfono',
      allowsSorting: true
    },
    {
      key: 'alias',
      label: 'Usuario',
      allowsSorting: true
    },
    {
      key: 'email',
      label: 'Correo electrónico',
      allowsSorting: true
    },
    {
      key: 'created_at',
      label: 'Fecha de registro',
      allowsSorting: false,
      preset: 'date'
    },
    {
      key: 'status',
      label: 'Estatus',
      allowsSorting: false,
      preset: 'type',
      presetConfig: { map: requestStatusMap }
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

  const filteredRows = applyToolbarFilters(
    requests.filter((r) => r.status !== 'deleted'),
    ['alias', 'email', 'phone'],
    criteria
  )

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  })

  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()

  //   const handleEditRequests = () => {
  //     console.log('Editar')
  //   }

  const handleRequestsDelete = (id: number) => {
    console.log('Solicitar eliminación >', id)
    dispatch(setSelectedRequest(id))
    onOpenDelete()
  }

  const handleRequestApprove = async (row: Row) => {
    if (!user) return
    const requestStatus = await requestAccessService.updateRequestStatus(row.id, 'accepted', user.id)
    console.log(requestStatus)
  }

  const handleRequestReject = async (row: Row) => {
    if (!user) return
    const requestStatus = await requestAccessService.updateRequestStatus(row.id, 'rejected', user.id)
    console.log(requestStatus)
  }

  return (
    <section className='space-y-4'>
      <ToolbarTable<Row>
        rows={requests}
        searchFilter={['alias']}
        filters={[{ label: 'Status', column: 'status', multiple: true }]}
        enableToggleBehavior
        onCriteriaChange={setCriteria}
      />

      <DataTable<Row>
        entity='requests'
        adapterOverrides={{
          //edit: handleEditRequests,
          onRequestDelete: (id) => {
            handleRequestsDelete(id as number)
          },
          rowActions: () => [
            { key: 'approve', label: 'Aprobar', onPress: handleRequestApprove },
            { key: 'reject', label: 'Rechazado', onPress: handleRequestReject }
          ]
        }}
        maxHeight={layoutOutletHeight ? layoutOutletHeight - layoutToolbarSpace : undefined}
        rows={filteredRows}
        columns={columns}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />
      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='request' />
    </section>
  )
}

export default Requests
