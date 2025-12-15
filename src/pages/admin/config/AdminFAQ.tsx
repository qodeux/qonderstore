import { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ColumnDef } from '../../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../components/common/ToolbarTable'
import { useAppSelector } from '../../../store/store'

const AdminFAQ = () => {
  const dispatch = useDispatch()
  const { selectedFAQ } = useAppSelector((state) => state.config)

  type Row = {
    id: number
    order: number
    question: string
    is_active: boolean
    type: string
  }

  const columns: ColumnDef<Row>[] = [
    { key: 'order', label: 'Orden', allowsSorting: true },
    { key: 'question', label: 'Pregunta', allowsSorting: false },
    { key: 'type', label: 'tipo', allowsSorting: false },
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

  const handleAddMethod = () => {}

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
      </section>
    </>
  )
}

export default AdminFAQ
