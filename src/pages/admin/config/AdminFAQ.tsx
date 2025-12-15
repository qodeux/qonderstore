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
  TableRow
} from '@heroui/react'
import { EllipsisVertical, GripVertical } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ColumnDef } from '../../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../components/common/ToolbarTable'
import { useAppSelector } from '../../../store/store'
import { applyToolbarFilters } from '../../../utils/toolbarFilters'

const AdminFAQ = () => {
  // const dispatch = useDispatch()
  // const { selectedFAQ } = useAppSelector((state) => state.config)

  type Row = {
    id: number
    order: number
    question: { question: string; answer: string }
    is_active: boolean
    type: string
  }

  const columns: ColumnDef<Row>[] = [
    { key: 'order', label: 'Orden', allowsSorting: true },
    { key: 'question', label: 'Pregunta', allowsSorting: false },
    { key: 'type', label: 'Tipo', allowsSorting: false },
    { key: 'status', label: 'Estado', allowsSorting: false, align: 'center' },
    { key: 'actions', label: 'Acciones', allowsSorting: false, align: 'center' }
  ]

  const faqs = useAppSelector((state) => state.config.faq)

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  const rows: Row[] = useMemo(
    () =>
      faqs?.map(({ id, question, answer, is_active, order, type }) => ({
        id,
        order: order,
        question: { question, answer },
        type: type,
        status: is_active
      })) ?? [],
    [faqs]
  )

  const filteredRows = useMemo(() => {
    return applyToolbarFilters(rows, ['question'], criteria)
  }, [rows, criteria])

  const handleAddMethod = () => {}

  const handleToggle = (row: Row, v: boolean) => {
    console.log('Cambiar state:', row, v)
  }

  const handleEditMethod = () => {}

  const handleRequestDelete = () => {}

  return (
    <>
      <div>AdminFAQ</div>

      <section className='flex h-full flex-col gap-4'>
        <section className='space-y-4'>
          <ToolbarTable<Row>
            rows={rows}
            filters={[
              {
                label: 'Tipo de pregunta',
                column: 'type',
                multiple: false
                //: { card: 'Tarjeta', bank_transfer: 'Transferencia bancaria' }
              }
            ]}
            buttons={[{ label: 'Agregar pregunta', onPress: handleAddMethod, color: 'primary' }]}
            onCriteriaChange={setCriteria}
          />
        </section>

        <section>
          <Table
            aria-label='Tabla de preguntas frecuentes'
            className='bg-white shadow-sm rounded-lg overflow-hidden'
            selectionMode='single'
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={String(column.key)} allowsSorting={!!column.allowsSorting} align={column.align ?? 'start'}>
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>

            <TableBody emptyContent={'Sin resultados'} items={filteredRows}>
              {(item: Row) => {
                const { order, question, type, id } = item

                return (
                  <TableRow key={`${order}-${id}`}>
                    {/* Orden */}
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div>
                          <div className='flex h-6 w-6 items-center justify-center rounded-full'>
                            <GripVertical />
                            <p className='font-medium text-gray-800'>{order}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {/* Pregunta */}
                    <TableCell>
                      <div className='text-xs text-gray-600 space-y-1'>
                        <p>
                          <span className='font-semibold'>P: {question.question}</span>
                        </p>
                        <p>
                          <span>R: {question.answer} </span>
                        </p>
                      </div>
                    </TableCell>
                    {/* Tipo */}
                    <TableCell>
                      <div className='text-xs text-gray-600 space-y-1'>
                        <p>
                          <span className='font-semibold'>{type}</span>
                        </p>
                      </div>
                    </TableCell>
                    {/* Estado */}
                    <TableCell>
                      <div className='flex justify-center'>
                        <Switch
                          size='sm'
                          // isSelected={!!active} // más adelante vendrá de la BD
                          onValueChange={(v) => handleToggle(item, v)}
                        />
                      </div>
                    </TableCell>
                    {/* Acciones */}
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant='bordered' isIconOnly size='sm'>
                            <EllipsisVertical />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label='Acciones'>
                          <DropdownItem key='__edit' onPress={() => handleEditMethod()}>
                            Editar
                          </DropdownItem>
                          <DropdownItem key='__delete_req' className='text-danger' color='danger' onPress={() => handleRequestDelete()}>
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
      </section>
    </>
  )
}

export default AdminFAQ
