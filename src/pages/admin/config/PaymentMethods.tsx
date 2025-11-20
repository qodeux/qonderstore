import { useState } from 'react'
import { useSelector } from 'react-redux'
import { type ColumnDef } from '../../../components/common/DataTable'
import { ToolbarTable, type ToolbarCriteria } from '../../../components/common/ToolbarTable'
import type { RootState } from '../../../store/store'

const PaymentMethods = () => {
  const configu = useSelector((state: RootState) => state.config.paymentMethods)

  const handleAddMethod = () => {
    console.log('boton agregar metodo')
  }
  // const handleEditMethod = () => {
  //   console.log('boton editar metodo')
  // }

  type Row = {
    id: number
    module: string
    data: string
    created_at: string
    last_update: string
  }

  const columns: ColumnDef<Row>[] = [
    {
      key: 'module',
      label: 'Método',
      allowsSorting: true
    },
    {
      key: 'data',
      label: 'Detalles',
      allowsSorting: false
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true,
      preset: 'is_active'
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false,
      preset: 'actions',
      align: 'center'
    }
  ]

  const [criteria, setCriteria] = useState<ToolbarCriteria<Row>>({
    searchText: '',
    selected: {}
  })

  return (
    <>
      <section className='space-y-4'>
        <div className='text-xl flex items-center gap-3 mb-2'>
          {/* Header de la página */}
          <div className='flex items-center justify-between margin-bottom-lg'>
            <h1 className='text-2xl font-semibold text-gray-800'>Medios de Pago</h1>
          </div>
        </div>
      </section>

      <section className='space-y-4'>
        <ToolbarTable<Row>
          rows={configu}
          searchFilter={['module']}
          buttons={[
            {
              label: 'Agregar método de pago',
              onPress: handleAddMethod,
              color: 'primary'
            }
          ]}
          onCriteriaChange={setCriteria}
        />

        {/* <DataTable<Row>
          entity='payment-methods'
          adapterOverrides={{
            edit: () => {
              handleEditMethod()
            },
            onRequestDelete: (id, row) => {
              console.log('Delete method id:', id)
            }
          }}
          rows={filteredRows}
          columns={columns}
          selectionMode='single'
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          getRowKey={(row) => row.id as number}
        /> */}
      </section>
    </>
  )
}

export default PaymentMethods
