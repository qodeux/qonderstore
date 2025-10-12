const Confirmation = () => {
  return (
    <>
      <section>
        <h4 className=' font-semibold'>Datos del proveedor</h4>

        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Nombre: Nombre del proveedor</p>
          <p>Alias: Alias del proveedor</p>
          <p>Teléfono: 1234567890</p>
          <p>Email: email@proveedor.com</p>
          <p className='col-span-2'>Dirección: Calle Falsa 123, Ciudad, País</p>
          <p>Código Postal: 12345</p>
        </div>
      </section>

      <section>
        <h4 className=' font-semibold mt-4'>Datos bancarios</h4>
        <div className='text-sm space-y-1 mt-2 grid grid-cols-2'>
          <p>Banco: Banco Ejemplo</p>
          <p>Tipo de Cuenta: CLABE</p>
          <p>CLABE: 123456789012345678</p>
          <p>RFC: ABCD123456</p>
          <p className='col-span-2'>Titular: Nombre del Titular</p>
        </div>
      </section>

      <section>
        <h4 className=' font-semibold mt-4'>Productos seleccionados</h4>
        <div className='mt-2'>
          <p>Producto 1, Producto 2, Producto 3, Producto 4, Producto 5, Producto 6, Producto 7, Producto 8, Producto 9.</p>
        </div>
      </section>
    </>
  )
}

export default Confirmation
