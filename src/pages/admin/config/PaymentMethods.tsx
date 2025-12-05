import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure
} from '@heroui/react'
import { Building2, CreditCard, EllipsisVertical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '../../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../components/common/ToolbarTable'
import { useAppSelector } from '../../../store/store'
import { applyToolbarFilters } from '../../../utils/toolbarFilters'

import ConfigModal from '../../../components/modals/admin/ConfigModal'

const getMethodLabel = (type: string) => {
  switch (type) {
    case 'card':
      return 'Tarjeta'
    case 'bank_transfer':
      return 'Transferencia bancaria'
    default:
      return type
  }
}

const getMethodIconStyles = (type: string) => {
  switch (type) {
    case 'card':
      return { wrapper: 'bg-primary/10', icon: 'text-primary' }
    case 'bank_transfer':
    default:
      return { wrapper: 'bg-success/10', icon: 'text-success' }
  }
}

const getMethodIcon = (type: string, className: string) => {
  switch (type) {
    case 'card':
      return <CreditCard className={`h-6 w-6 ${className}`} />
    case 'bank_transfer':
    default:
      return <Building2 className={`h-6 w-6 ${className}`} />
  }
}

const PaymentMethods = () => {
  type Row = {
    id: number
    payment_method: string
    details: { bank: number; account: string; holder_name: string }
    status: boolean
  }

  const columns: ColumnDef<Row>[] = [
    { key: 'payment_method', label: 'Medio de pago', allowsSorting: false },
    { key: 'details', label: 'Detalles', allowsSorting: false },
    { key: 'status', label: 'Estado', allowsSorting: false },
    { key: 'actions', label: 'Acciones', allowsSorting: false }
  ]

  const paymentMethods = useAppSelector((state) => state.config.paymentMethods)

  const banks = useAppSelector((state) => state.catalogs.banks)

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    //holder_name: '',
    selected: {}
  })

  const [activeMap, setActiveMap] = useState<Record<number, boolean>>({})

  const rows: Row[] = useMemo(
    () =>
      paymentMethods?.map(({ id, type, bank, account, holder_name }) => ({
        payment_method: type,
        details: { bank, account, holder_name },
        status: activeMap[id] ?? true,
        id
      })) ?? [],
    [paymentMethods, activeMap]
  )

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(rows, ['details'], criteria)
  }, [rows, criteria])

  const { isOpen: isOpenConfig, onOpenChange: onOpenChangeConfig } = useDisclosure()

  const handleAddMethod = () => {
    onOpenChangeConfig()
    console.log('Agregar método')
  }
  const handleEditMethod = (row: Row) => console.log('Editar método', row)
  const handleDelete = (row: Row) => console.log('Eliminar método', row)
  const handleToggle = (row: Row, v: boolean) => console.log('Cambiar estado:', row, v)

  useEffect(() => {
    setActiveMap((prev) => {
      const next = { ...prev }
      let changed = false

      for (const r of rows) {
        if (next[r.id] === undefined) {
          next[r.id] = true
          changed = true
        }
      }

      // Si no hubo cambios, regresamos el mismo objeto
      return changed ? next : prev
    })
  }, [rows])

  return (
    <>
      <section className='flex h-full flex-col gap-4'>
        <section className='space-y-4'>
          <ToolbarTable<Row>
            rows={rows}
            filters={[
              {
                label: 'Tipo de pago',
                column: 'payment_method',
                multiple: false,
                optionsMap: { card: 'Tarjeta', bank_transfer: 'Transferencia bancaria' }
              }
            ]}
            buttons={[{ label: 'Agregar método', onPress: handleAddMethod, color: 'primary' }]}
            onCriteriaChange={setCriteria}
          />
        </section>

        <Table aria-label='Tabla de métodos de pago' className='bg-white shadow-sm rounded-lg overflow-hidden' selectionMode='single'>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={String(column.key)} allowsSorting={!!column.allowsSorting} align={column.align ?? 'start'}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>

          <TableBody emptyContent={'Sin resultados'} items={filteredRows}>
            {(item: Row) => {
              const { payment_method, details } = item
              const { wrapper, icon } = getMethodIconStyles(payment_method)

              return (
                <TableRow key={`${payment_method}-${details.account}`}>
                  {/* MÉTODO */}
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${wrapper}`}>
                        {getMethodIcon(payment_method, icon)}
                      </div>
                      <div>
                        <p className='font-medium text-gray-800'>{getMethodLabel(payment_method)}</p>
                        {/* <p className='text-xs text-gray-500'>({type})</p> */}
                      </div>
                    </div>
                  </TableCell>

                  {/* DETALLES */}
                  <TableCell>
                    <div className='text-xs text-gray-600 space-y-1'>
                      <p>
                        <span className='font-semibold'>Banco:</span> {banks.find((b) => b.id === details.bank)?.full_name}
                      </p>
                      <p>
                        <span className='font-semibold'>Cuenta:</span> {details.account}
                      </p>
                      <p>
                        <span className='font-semibold'>Titular:</span> {details.holder_name}
                      </p>
                    </div>
                  </TableCell>

                  {/* ESTADO */}
                  <TableCell>
                    <div className='flex justify-center'>
                      <Switch
                        size='sm'
                        // isSelected={!!active} // más adelante vendrá de la BD
                        onValueChange={(v) => handleToggle(item, v)}
                      />
                    </div>
                  </TableCell>

                  {/* ACCIONES */}
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant='bordered' isIconOnly size='sm'>
                          <EllipsisVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='Acciones'>
                        <DropdownItem key='__edit' onPress={() => handleEditMethod(item)}>
                          Editar
                        </DropdownItem>
                        <DropdownItem key='__delete_req' className='text-danger' color='danger' onPress={() => handleDelete(item)}>
                          Eliminar
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )
            }}
          </TableBody>
        </Table>
      </section>
      <ConfigModal isOpen={isOpenConfig} on onOpenChange={onOpenChangeConfig} />
    </>
  )
}

export default PaymentMethods
