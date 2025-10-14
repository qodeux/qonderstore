import { useSelector } from 'react-redux'
import type { ProviderInputBankData, ProviderInputContactData, ProviderInputProductSelection } from '../../../../schemas/providers.schema'
import type { RootState } from '../../../../store/store'

type Props = {
  data: {
    contactData: ProviderInputContactData
    bankData: ProviderInputBankData
    productSelection: ProviderInputProductSelection
  }
}

const Confirmation = ({ data }: Props) => {
  const products = useSelector((state: RootState) => state.products.items)
  return (
    <>
      <section>
        <h4 className=' font-semibold'>Datos del proveedor</h4>

        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Nombre: {data.contactData.name}</p>
          <p>Alias: {data.contactData.alias}</p>
          <p>Teléfono: {data.contactData.phone}</p>

          {data.contactData.email && <p>Email: {data.contactData.email}</p>}
          <p className='col-span-2'>Dirección: {data.contactData.address}</p>
          <p>Código Postal: {data.contactData.postal_code}</p>
        </div>
      </section>

      <section>
        <h4 className=' font-semibold mt-4'>Datos bancarios</h4>
        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Banco: {data.bankData.bank}</p>
          <p>Tipo de Cuenta: {data.bankData.account_type}</p>
          <p>CLABE: {data.bankData.account}</p>
          <p>RFC: {data.bankData.rfc}</p>
          <p className='col-span-2'>Titular: {data.bankData.holder_name}</p>
        </div>
      </section>

      <section>
        <h4 className=' font-semibold mt-4'>Productos seleccionados</h4>
        <div className='mt-2'>
          <p>{data.productSelection.selected_products.map((product) => products.find((p) => p.id === product)?.name).join(', ')}</p>
        </div>
      </section>
    </>
  )
}

export default Confirmation
