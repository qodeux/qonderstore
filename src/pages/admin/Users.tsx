import { useDisclosure, type Selection, type SortDescriptor } from '@heroui/react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { DataTable, type PresetKey } from '../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../components/common/ToolbarTable'
import UserModal from '../../components/modals/admin/UserModal'
import { useUsers } from '../../hooks/useUsers'
import type { RootState } from '../../store/store'
import { applyToolbarFilters } from '../../utils/toolbarFilters'

const Users = () => {
  useUsers() // carga y realtime
  const users = useSelector((state: RootState) => state.users.items) ?? []

  type Row = {
    id: string
    user_name: string
    role: string
    last_activity: string
    is_active: boolean
    // email: string
    // full_name: string
    // phone: string
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
      allowsSorting: true
    },
    {
      key: 'is_active',
      label: 'Activo',
      allowsSorting: true,
      preset: 'is_active' as PresetKey
    },
    {
      key: 'data',
      label: 'Data',
      allowsSorting: false,
      preset: 'is_active' as PresetKey
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

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
    // Logic to add a new user
    onOpenUser()
  }

  const handleEditUser = () => {
    //dispatch(setEditMode(true))
    onOpenUser()
  }

  return (
    <>
      <section className='space-y-6'>
        <ToolbarTable<Row>
          rows={users}
          searchFilter={['user_name']}
          enableToggleBehavior
          selectionBehavior={selectionBehavior}
          onToggleBehavior={toggleSelectionBehavior}
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
              setDeleteUserId(String(id))
              onOpenDelete()
            }
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
          getRowKey={(row) => row.id as string}
        />
      </section>
      <UserModal isOpen={isOpenUser} onOpenChange={onOpenChangeUser} />
    </>
  )
}

export default Users
