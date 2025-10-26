import type { Selection, SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type ColumnDef } from '../../components/common/DataTable'
import type { ToolbarCriteria } from '../../components/common/ToolbarTable'
import { requestAccessService } from '../../services/requestAccessService'
import { setSelectedRequest } from '../../store/slices/requestAccessSlice'
import type { RootState } from '../../store/store'
import { requestStatusMap } from '../../types/requests'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Requests = () => {
  const requests = useSelector((state: RootState) => state.requestAccess.items)
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

  const [criteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const filteredRows = applyToolbarFilters(requests, ['phone'], criteria)

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]))

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  })

  //   const handleEditRequests = () => {
  //     console.log('Editar')
  //   }

  const handleRequestsDelete = (id: number) => {
    console.log('Solicitar eliminación >', id)
    dispatch(setSelectedRequest(id))
  }

  const handleRequestApprove = async (row: Row) => {
    console.log('aprovado')
    console.log(row)
    const requestStatus = await requestAccessService.updateRequestStatus(row.id, 'accepted')
    console.log(requestStatus)
  }

  const handleRequestReject = async (row: Row) => {
    console.log('alv')
    console.log(row)
    const requestStatus = await requestAccessService.updateRequestStatus(row.id, 'rejected')
    console.log(requestStatus)
  }

  return (
    <DataTable<Row>
      entity='requests'
      adapterOverrides={{
        //edit: handleEditRequests,
        onRequestDelete: (id) => {
          handleRequestsDelete(id)
        },
        rowActions: (row) => [
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
  )
}

export default Requests
