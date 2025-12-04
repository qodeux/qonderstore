import { Button, Switch, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from '@heroui/react'
import { Building2, CreditCard, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ToolbarTable, type ToolbarCriteria } from '../../../components/common/ToolbarTable'
import type { PaymentMethod } from '../../../schemas/config.schema'
import { useAppSelector } from '../../../store/store'
import { applyToolbarFilters } from '../../../utils/toolbarFilters'

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
  const paymentMethods = useAppSelector((s) => s.config.paymentMethods) ?? []
  const banks = useAppSelector((state) => state.catalogs.banks) ?? []

  const [criteria, setCriteria] = useState<ToolbarCriteria<PaymentMethod>>({
    searchText: '',
    //holder_name: '',
    selected: {}
  })

  const [activeMap, setActiveMap] = useState<Record<number, boolean>>({})

  const rows: PaymentMethod[] = useMemo(() => {
    if (!paymentMethods) return []
    return paymentMethods.map((pm, index) => {
      const id = index // si luego mapeas config.id, aquí usas ese id
      const details = `Banco: ${pm.bank} | Cuenta: ${pm.account} | Titular: ${pm.holder_name}`
      return {
        ...pm,
        id,
        details
      }
    })
  }, [paymentMethods])

  useMemo(() => {
    setActiveMap((prev) => {
      const next = { ...prev }
      for (const r of rows) {
        if (next[r.id] === undefined) next[r.id] = true
      }
      return next
    })
  }, [rows])

  const filteredRows = useMemo(
    () =>
      applyToolbarFilters<PaymentMethod>(rows, criteria, {
        searchKeys: ['details']
      }),
    [rows, criteria]
  )

  const handleAddMethod = () => console.log('Agregar método')
  const handleEditMethod = (m: PaymentMethod) => console.log('Editar método', m)
  const handleDelete = (m: PaymentMethod) => console.log('Eliminar método', m)
  const handleToggle = (m: PaymentMethod, v: boolean) => console.log('Cambiar estado:', m, v)

  return (
    <section className='flex h-full flex-col gap-4'>
      <section className='space-y-4'>
        <ToolbarTable<PaymentMethod>
          rows={rows}
          searchFilter={['type']}
          buttons={[{ label: 'Agregar método', onPress: handleAddMethod, color: 'primary' }]}
          onCriteriaChange={setCriteria}
        />
      </section>

      <Table aria-label='Tabla de métodos de pago' className='bg-white shadow-sm rounded-lg overflow-hidden' selectionMode='single'>
        <TableHeader>
          <TableColumn>Método</TableColumn>
          <TableColumn>Detalles</TableColumn>
          <TableColumn className='text-center'>Estado</TableColumn>
          <TableColumn className='text-center'>Acciones</TableColumn>
        </TableHeader>

        <TableBody emptyContent={'No hay métodos de pago configurados.'} items={filteredRows}>
          {(method: PaymentMethod) => {
            const { type, bank, account, holder_name } = method
            const { wrapper, icon } = getMethodIconStyles(type)

            return (
              <TableRow key={`${type}-${account}`}>
                {/* MÉTODO */}
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${wrapper}`}>{getMethodIcon(type, icon)}</div>

                    <div>
                      <p className='font-medium text-gray-800'>{getMethodLabel(type)}</p>
                      {/* <p className='text-xs text-gray-500'>({type})</p> */}
                    </div>
                  </div>
                </TableCell>

                {/* DETALLES */}
                <TableCell>
                  <div className='text-xs text-gray-600 space-y-1'>
                    <p>
                      <span className='font-semibold'>Banco:</span> {banks.find((b) => b.id === bank)?.full_name}
                    </p>
                    <p>
                      <span className='font-semibold'>Cuenta:</span> {account}
                    </p>
                    <p>
                      <span className='font-semibold'>Titular:</span> {holder_name}
                    </p>
                  </div>
                </TableCell>

                {/* ESTADO */}
                <TableCell>
                  <div className='flex justify-center'>
                    <Switch
                      size='sm'
                      // isSelected={!!active} // más adelante vendrá de la BD
                      onValueChange={(v) => handleToggle(method, v)}
                    />
                  </div>
                </TableCell>

                {/* ACCIONES */}
                <TableCell>
                  <div className='flex items-center justify-center gap-2'>
                    <Tooltip content='Editar'>
                      <Button isIconOnly variant='light' size='sm' onPress={() => handleEditMethod(method)}>
                        <Pencil className='h-4 w-4 text-gray-600' />
                      </Button>
                    </Tooltip>

                    <Tooltip content='Eliminar'>
                      <Button isIconOnly variant='light' color='danger' size='sm' onPress={() => handleDelete(method)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </Tooltip>
                    <Tooltip content='Eliminar'>
                      <Button isIconOnly variant='light' color='danger' size='sm' onPress={() => handleDelete(method)}>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          }}
        </TableBody>
      </Table>
    </section>
  )
}

export default PaymentMethods
