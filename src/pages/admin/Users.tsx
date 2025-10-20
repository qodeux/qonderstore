import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataTable, type FormatPreset, type PresetKey } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import UserModal from '../../components/modals/admin/UserModal'
import OnDeleteModal from '../../components/modals/common/OnDeleteModal'
import { useUsers } from '../../hooks/useUsers'
import { setEditMode, setSelectedUser } from '../../store/slices/usersSlice'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Users = () => {
  useUsers() // carga y realtime
  const users = useSelector((state: RootState) => state.users.items) ?? []
  const { layoutOutletHeight, layoutToolbarSpace } = useSelector((state: RootState) => state.ui) ?? {}
  const dispatch = useDispatch()

  type Row = {
    id: string
    user_name: string
    role: string
    is_active: boolean
    email: string
    full_name?: string
    phone?: string
  }

  const columns = [
    {
      key: 'user_name',
      label: 'Usuario',
      allowsSorting: true
    },
    {
      key: 'role',
      label: 'Rol',
      allowsSorting: true
    },
    {
      key: 'last_activity',
      label: 'Última actividad',
      preset: 'date' as PresetKey,
      presetConfig: { format: 'relative' as FormatPreset },

      allowsSorting: true
    },

    {
      key: 'is_active',
      label: 'Activo',
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

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([])) //si hay error revisar

  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'user_name',
    direction: 'ascending'
  })

  const { isOpen: isOpenDelete, onOpen: onOpenDelete, onOpenChange: onOpenChangeDelete } = useDisclosure()

  const { isOpen: isOpenUser, onOpenChange: onOpenChangeUser, onOpen: onOpenUser } = useDisclosure()

  const filteredRows = applyToolbarFilters(users, ['user_name'], criteria)

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    //setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  const handleAddUser = () => {
    dispatch(setEditMode(false))
    onOpenUser()
  }

  const handleEditUser = (row: Row) => {
    console.log(row)

    dispatch(setEditMode(true))
    dispatch(setSelectedUser(row.id))
    setSelectedKeys(new Set([String(row.id)]))
    onOpenUser()
  }

  const handleRequestUserDelete = (userId: string | number) => {
    dispatch(setSelectedUser(userId))
    setSelectedKeys(new Set([String(userId)]))

    onOpenDelete()
  }

  return (
    <>
      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={users}
          searchFilter={['user_name']}
          filters={[{ label: 'Rol', column: 'role', multiple: true }]}
          buttons={[
            {
              label: 'Agregar usuario',
              onPress: handleAddUser,
              color: 'primary'
            }
          ]}
          onCriteriaChange={setCriteria}
        />

        <DataTable<Row>
          entity='users'
          adapterOverrides={{
            edit: handleEditUser,
            onRequestDelete: (id) => {
              handleRequestUserDelete(id)
            }
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
          getRowKey={(row) => row.id}
          maxHeight={layoutOutletHeight ? layoutOutletHeight - layoutToolbarSpace : undefined}
        />
      </section>
      <UserModal isOpen={isOpenUser} onOpenChange={onOpenChangeUser} />

      <OnDeleteModal isOpenDelete={isOpenDelete} onOpenChangeDelete={onOpenChangeDelete} deleteType='user' />
    </>
  )
}

export default Users
