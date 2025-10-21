import { BanknoteArrowUp, PackageCheck, SquareUserRound } from 'lucide-react'
import { PatternFormat } from 'react-number-format'
import { useSelector } from 'react-redux'
import type { ProviderInputBankData, ProviderInputContactData, ProviderInputProductSelection } from '../../../../schemas/providers.schema'
import type { RootState } from '../../../../store/store'
import { accountTypes } from '../../../../types/banks'
import type { Neighborhood } from '../../../../types/location'

type Props = {
  data: {
    contactData: ProviderInputContactData
    bankData: ProviderInputBankData
    productSelection: ProviderInputProductSelection
  }
}

const Confirmation = ({ data }: Props) => {
  const products = useSelector((state: RootState) => state.products.items)
  const banks = useSelector((state: RootState) => state.catalogs.banks)

  const neighborhoodData: Neighborhood | null = data.contactData.neighborhood_data ? JSON.parse(data.contactData.neighborhood_data) : null
  return (
    <div className='space-y-4'>
      <section>
        <h4 className=' font-semibold flex gap-1'>
          <SquareUserRound /> Datos del proveedor
        </h4>

        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Nombre: {data.contactData.name}</p>
          <p>Alias: {data.contactData.alias}</p>
          <p>
            Teléfono: <PatternFormat value={data.contactData.phone} displayType='text' format={'### #### ####'} />
          </p>

          {data.contactData.email && <p>Email: {data.contactData.email}</p>}

          {data.contactData.neighborhood && (
            <>
              <p>Dirección</p>
              <div className='col-span-2 max-w-xs flex flex-col text-xs text-gray-600'>
                {data.contactData.address} <br /> {neighborhoodData?.d_tipo_asenta} {neighborhoodData?.d_asenta},
                <br /> {neighborhoodData?.D_mnpio}, {neighborhoodData?.d_estado} <br />
                Código Postal: {data.contactData.postal_code}
              </div>
            </>
          )}
        </div>
      </section>

      <section>
        <h4 className=' font-semibold flex gap-1'>
          <BanknoteArrowUp /> Datos bancarios
        </h4>
        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Banco: {banks.find((bank) => bank.id == data.bankData.bank)?.short_name}</p>
          <p>
            {accountTypes.find((type) => type.key === data.bankData.account_type)?.label}:{' '}
            <PatternFormat
              value={data.bankData.account} // viene sin espacios
              displayType='text' // solo renderiza texto
              format={
                data.bankData.account_type === 'clabe'
                  ? '### ### ########### #'
                  : data.bankData.account_type === 'card'
                  ? '#### #### #### ####'
                  : '############' // cuenta (sin espacios)
              }
            />
          </p>
          <p>RFC: {data.bankData.rfc}</p>
          <p className='col-span-2'>Titular: {data.bankData.holder_name}</p>
        </div>
      </section>

      <section>
        <h4 className=' font-semibold flex gap-1'>
          <PackageCheck /> Productos seleccionados
        </h4>
        <div className='mt-2'>
          <p>{data.productSelection.selected_products.map((product) => products.find((p) => p.id === product)?.name).join(', ')}</p>
        </div>
      </section>
    </div>
  )
}

export default Confirmation
