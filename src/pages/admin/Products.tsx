import type { Selection, SortDescriptor } from '@heroui/react'
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  getKeyValue,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  useDisclosure
} from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CopyPlus, EllipsisVertical, SquareMousePointer, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import supabase from '../../lib/supabase'
import { productSchema, productUnitSchema } from '../../schemas/products.schema'
const Products = () => {
  type Row = {
    key: string
    sku: string
    name: string
    slug: string
    price: string
    category: string
    brand?: string
    stock: number
    is_active: boolean
    featured: boolean
    created_at: string
  }

  const categories = [
    { id: '1', name: 'Cat' },
    { id: '2', name: 'Dog' },
    { id: '3', name: 'Elephant' },
    { id: '4', name: 'Lion' },
    { id: '5', name: 'Tiger' },
    { id: '6', name: 'Giraffe' },
    { id: '7', name: 'Dolphin' },
    { id: '8', name: 'Penguin' },
    { id: '9', name: 'Zebra' },
    { id: '10', name: 'Shark' },
    { id: '11', name: 'Whale' }
  ]

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      allowsSorting: true
    },
    {
      key: 'price',
      label: 'Precio',
      allowsSorting: true
    },
    {
      key: 'category',
      label: 'Categoría',
      allowsSorting: true
    },
    {
      key: 'stock',
      label: 'Existencias',
      allowsSorting: true
    },
    {
      key: 'is_active',
      label: 'Estado',
      allowsSorting: true
    },
    {
      key: 'featured',
      label: '',
      allowsSorting: false
    },
    {
      key: 'actions',
      label: 'Acciones',
      allowsSorting: false
    }
  ]

  const getProducts = async () => {
    const { data: products, error } = await supabase.from('products_view').select('*')
    if (error) {
      console.error('Error fetching products:', error)
    }
    return products
  }

  const [rowsDB, setRowsDB] = useState<Row[]>([])

  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { isOpen: isOpenDeleteProduct, onOpen: onOpenDeleteProduct, onOpenChange: onOpenChangeDeleteProduct } = useDisclosure()

  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  const [filterValue, setFilterValue] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['2']))
  const [selectionBehavior, setSelectionBehavior] = useState<'replace' | 'toggle'>('replace')

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'price',
    direction: 'ascending'
  })

  const [categoryFilter, setCategoryFilter] = useState<Selection>('all')

  const [selectedTypeUnit, setSelectedTypeUnit] = useState<string>('')

  const [lowStockSwitch, setLowStockSwitch] = useState<boolean>(false)
  const [minSaleSwitch, setMinSaleSwitch] = useState<boolean>(false)
  const [maxSaleSwitch, setMaxSaleSwitch] = useState<boolean>(false)

  const [activeTab, setActiveTab] = useState<'data' | 'unit' | 'bulk'>('data')

  const {
    register: registerData,
    handleSubmit: handleSubmitData,
    watch: watchData,
    trigger: triggerData,
    getValues: getValuesData,
    formState: { errors: errorsData }
  } = useForm({
    resolver: zodResolver(productSchema)
  })

  const {
    register: registerUnit,
    handleSubmit: handleSubmitUnit,
    watch: watchUnit,
    trigger: triggerUnit,
    getValues: getValuesUnit,
    formState: { errors: errorsUnit }
  } = useForm({
    resolver: zodResolver(productUnitSchema)
  })

  const toggleSelectionBehavior = () => {
    setSelectionBehavior((prevMode) => (prevMode === 'replace' ? 'toggle' : 'replace'))
    setSelectedKeys(new Set()) // Clear selection when mode changes
  }

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value)
    } else {
      setFilterValue('')
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue('')
  }, [])

  const hasSearchFilter = Boolean(filterValue)

  const filteredItems = useMemo(() => {
    let filteredRows = [...rowsDB]

    if (hasSearchFilter) {
      filteredRows = filteredRows.filter(
        (row) => row.name.toLowerCase().includes(filterValue.toLowerCase()) || row.stock.toString() === filterValue.toLocaleLowerCase()
      )
    }

    if (categoryFilter !== 'all' && Array.from(categoryFilter).length !== categories.length) {
      filteredRows = filteredRows.filter((row) => Array.from(categoryFilter).includes(row.category))
    }

    return filteredRows
  }, [rowsDB, filterValue, categoryFilter])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: Row, b: Row) => {
      const first = a[sortDescriptor.column as keyof Row] as number
      const second = b[sortDescriptor.column as keyof Row] as number
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, filteredItems])

  const renderCell = (item: Row, columnKey: React.Key) => {
    const key = String(columnKey) as keyof Row | 'actions'

    switch (key) {
      case 'is_active':
        return <Switch defaultSelected={item.is_active} size='sm' />
      case 'actions':
        return (
          <div className='flex justify-end gap-2'>
            <Dropdown>
              <DropdownTrigger>
                <Button variant='bordered' isIconOnly>
                  <EllipsisVertical />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label='Static Actions'>
                <DropdownItem key='edit'>Editar</DropdownItem>
                <DropdownItem
                  key='delete'
                  className='text-danger'
                  color='danger'
                  onPress={() => {
                    setDeleteProductId(item.key)
                    onOpenDeleteProduct()
                  }}
                >
                  Eliminar
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )
      case 'featured':
        return item.featured ? <Star fill='#111' /> : <Star />
      default:
        break
    }

    // fallback: muestra el valor de la celda normalmente
    return getKeyValue(item, key as keyof Row)
  }

  const selectionCount = selectedKeys === 'all' ? rowsDB.length : (selectedKeys as Set<React.Key>).size

  const TableFooter = ({ selectionCount }: { selectionCount: number }) => {
    return (
      <section className='flex justify-between items-center mt-4'>
        <div>
          {sortedItems.length} {sortedItems.length === 1 ? 'resultado' : 'resultados'}
          {selectionCount > 0 && (
            <>
              {' '}
              | {selectionCount} {selectionCount === 1 ? 'seleccionado' : 'seleccionados'}
            </>
          )}
        </div>
        <div>Filtros</div>
      </section>
    )
  }

  async function fetchData() {
    const productsDB = await getProducts()
    console.log(productsDB)

    if (productsDB) {
      setRowsDB(
        productsDB.map((product) => ({
          key: product.id.toString(),
          name: product.name,
          price: product.price,
          category: categories.find((cat) => cat.id.toString() === product.category)?.name || 'N/A',
          stock: product.stock,
          is_active: product.is_active,
          featured: product.featured,
          sku: product.sku,
          slug: product.slug,
          created_at: product.created_at
        }))
      )
    }
  }

  async function deleteProduct(productId: string | null) {
    if (!productId) return

    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
    } else {
      console.log('Product deleted successfully')
      onOpenChangeDeleteProduct()
      fetchData()
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddProduct = async () => {
    console.log('Agregando producto')

    try {
      // 1) Validamos los datos principales
      const isProductValid = await triggerData()
      if (!isProductValid) {
        setActiveTab('data')
        return
      }

      const productDataForm = getValuesData()
      const saleType = productDataForm.type_unit

      // 2) Si es unidad, validamos el formulario unidad
      if (saleType === 'unit') {
        const isUnitValid = await triggerUnit()
        if (!isUnitValid) {
          setActiveTab('unit')
          return
        }
      }
      // 3) Insertar Producto
      const { data: productInserted, error: productError } = await supabase
        .from('products')
        .insert([
          {
            name: productDataForm.name,
            slug: productDataForm.slug,
            sku: productDataForm.sku,
            category: productDataForm.category,
            //price: productDataForm.price,
            //stock: productDataForm.stock,
            sale_type: productDataForm.type_unit,
            is_active: productDataForm.is_active,
            featured: productDataForm.featured || false,
            description: productDataForm.description,
            //tags: productDataForm.tags,
            brand: productDataForm.brand
            //images: productDataForm.images
          }
        ])
        .select()
        .single()

      if (productError) {
        console.error('Error inserting product:', productError)
        return
      }

      // 4) Insertar datos de unidad si es necesario
      if (saleType === 'unit') {
        const productUnitForm = getValuesUnit()
        const { data: productUnitInserted, error: productUnitError } = await supabase
          .from('products_unit')
          .insert([
            {
              product_id: productInserted.id,
              unit: productUnitForm.sale_unit,
              base_cost: productUnitForm.base_cost,
              public_price: productUnitForm.public_price
              // Aquí van los datos específicos de la unidad
            }
          ])
          .select()
          .single()

        if (productUnitError) {
          console.error('Error inserting unit data:', productUnitError)
          return
        }

        console.log('Product and unit data inserted:', productInserted, productUnitInserted)

        // 5) Cerrar el modal
        onOpenChange()
        fetchData()
      }
    } catch (error) {
      console.error('Error adding product and unit data:', error)
    }
  }

  return (
    <div>
      <section className='space-y-6'>
        <div className='flex justify-between items-center gap-4'>
          <section className='flex-grow flex items-center gap-4 md:max-w-xl '>
            <Input label='Buscar...' type='text' size='md' value={filterValue} onClear={() => onClear()} onValueChange={onSearchChange} />
            <Select className='max-w-xs' label='Categoria' selectionMode='multiple' isClearable size='sm'>
              {categories.map((animal) => (
                <SelectItem key={animal.id}>{animal.name}</SelectItem>
              ))}
            </Select>
          </section>
          <div className='flex items-center gap-2'>
            <Button isIconOnly onPress={toggleSelectionBehavior} aria-label='Toggle Selection Mode'>
              {selectionBehavior === 'replace' ? <CopyPlus className='w-5 h-5' /> : <SquareMousePointer className='w-5 h-5' />}
            </Button>
            <Button color='primary' onPress={onOpen}>
              Agregar Producto
            </Button>
          </div>
        </div>

        <Table
          aria-label='Controlled table example with dynamic content'
          selectedKeys={selectedKeys}
          selectionMode='multiple'
          selectionBehavior={selectionBehavior}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          bottomContent={<TableFooter selectionCount={selectionCount} />}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} allowsSorting={column.allowsSorting}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={sortedItems}>
            {(item) => <TableRow key={item.key}>{(columnKey) => <TableCell>{renderCell(item as Row, columnKey)}</TableCell>}</TableRow>}
          </TableBody>
        </Table>
      </section>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='2xl'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>Agregar producto</ModalHeader>
              <ModalBody className='flex flex-row gap-4'>
                <section className='w-1/3'>
                  Imagenes
                  <br />
                  {selectedTypeUnit}
                  Stock bajo: {lowStockSwitch ? 'Si' : 'No'}
                  <div className='flex flex-col gap-4'>
                    <Switch defaultSelected size='sm' {...registerData('is_active')}>
                      Activo
                    </Switch>
                    <Checkbox icon={<Star fill='#000' />} size='lg' color='warning' {...registerData('featured')}>
                      Destacado
                    </Checkbox>
                  </div>
                </section>
                <section className='w-2/3'>
                  <Tabs
                    aria-label='Nuevo producto'
                    color='primary'
                    variant='solid'
                    disableAnimation
                    selectedKey={activeTab}
                    onSelectionChange={(key) => {
                      setActiveTab(key as 'data' | 'unit' | 'bulk')
                    }}
                  >
                    <Tab key='data' title='Datos'>
                      <form className='space-y-2' name='product-data-form'>
                        <Input
                          label='Nombre'
                          type='text'
                          size='sm'
                          isInvalid={!!errorsData.name}
                          errorMessage={errorsData.name?.message}
                          {...registerData('name')}
                        />
                        <Input
                          label='Slug'
                          type='text'
                          size='sm'
                          isInvalid={!!errorsData.slug}
                          errorMessage={errorsData.slug?.message}
                          {...registerData('slug')}
                          value={
                            watchData('slug') ||
                            watchData('name')
                              ?.toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^\w-]+/g, '') ||
                            ''
                          }
                        />
                        <Input
                          label='SKU'
                          type='text'
                          size='sm'
                          isInvalid={!!errorsData.sku}
                          errorMessage={errorsData.sku?.message}
                          {...registerData('sku')}
                        />
                        <Select
                          label='Categoria'
                          size='sm'
                          {...registerData('category')}
                          isInvalid={!!errorsData.category}
                          errorMessage={errorsData.category?.message}
                          disallowEmptySelection
                        >
                          {categories.map((cat) => (
                            <SelectItem key={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label='Tipo de venta'
                          size='sm'
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string
                            setSelectedTypeUnit(value)
                          }}
                          defaultSelectedKeys={selectedTypeUnit ? [selectedTypeUnit] : []}
                          selectionMode='single'
                          {...registerData('type_unit')}
                          isInvalid={!!errorsData.type_unit}
                          errorMessage={errorsData.type_unit?.message}
                        >
                          <SelectItem key='unit'>Unidad</SelectItem>
                          <SelectItem key='bulk'>Granel</SelectItem>
                        </Select>

                        <Input
                          label='Marca'
                          type='text'
                          size='sm'
                          className={selectedTypeUnit === 'unit' ? '' : 'hidden'}
                          {...registerData('brand')}
                        />
                        <Textarea
                          label='Descripcion'
                          size='sm'
                          isInvalid={!!errorsData.description}
                          errorMessage={errorsData.description?.message}
                          {...registerData('description')}
                        />

                        <Input
                          label='Etiquetas'
                          type='text'
                          size='sm'
                          {...registerData('tags')}
                          isInvalid={!!errorsData.tags}
                          errorMessage={errorsData.tags?.message}
                        />
                      </form>
                    </Tab>
                    <Tab key='unit' title='Unidad' className={selectedTypeUnit === 'unit' ? '' : 'hidden'}>
                      <form className='space-y-2' name='product-unit-form'>
                        <Select
                          label='Unidad de venta'
                          size='sm'
                          {...registerUnit('sale_unit')}
                          isInvalid={!!errorsUnit.sale_unit}
                          errorMessage={errorsUnit.sale_unit?.message}
                          disallowEmptySelection
                        >
                          <SelectItem key='pz'>Pieza</SelectItem>
                          <SelectItem key='pk'>Paquete</SelectItem>
                          <SelectItem key='box'>Caja</SelectItem>
                        </Select>
                        <div className='flex flex-row justify-between'>
                          <Switch
                            aria-label='Alerta de stock bajo'
                            size='sm'
                            isSelected={lowStockSwitch}
                            onChange={(e) => setLowStockSwitch(e.target.checked)}
                          >
                            Alerta de stock bajo
                          </Switch>

                          <NumberInput
                            isDisabled={!lowStockSwitch}
                            size='sm'
                            className='max-w-20 text-center'
                            maxValue={999}
                            minValue={1}
                            // {...registerUnit('lowStockAlert')}
                          />
                        </div>
                        <div className='flex flex-row justify-between'>
                          <Switch
                            aria-label='Compra mínima'
                            size='sm'
                            isSelected={minSaleSwitch}
                            onChange={(e) => setMinSaleSwitch(e.target.checked)}
                          >
                            Mínimo de compra
                          </Switch>

                          <NumberInput size='sm' className='max-w-20 text-center' isDisabled={!minSaleSwitch} maxValue={999} minValue={1} />
                        </div>
                        <div className='flex flex-row justify-between'>
                          <Switch
                            aria-label='Compra máxima'
                            size='sm'
                            isSelected={maxSaleSwitch}
                            onChange={(e) => setMaxSaleSwitch(e.target.checked)}
                          >
                            Máximo por transacción
                          </Switch>
                          <NumberInput
                            size='sm'
                            className='max-  w-20 text-center'
                            isDisabled={!maxSaleSwitch}
                            maxValue={999}
                            minValue={1}
                          />
                        </div>

                        <div className='flex flex-row gap-2'>
                          <Input
                            label='Costo base'
                            type='number'
                            size='sm'
                            {...registerUnit('base_cost')}
                            errorMessage={errorsUnit.base_cost?.message}
                            isInvalid={!!errorsUnit.base_cost}
                          />
                          <Input
                            label='Precio'
                            type='number'
                            size='sm'
                            {...registerUnit('public_price')}
                            errorMessage={errorsUnit.public_price?.message}
                            isInvalid={!!errorsUnit.public_price}
                          />
                        </div>

                        <section>
                          <div className='flex flex-row justify-between'>
                            <Switch aria-label='Compra máxima' size='sm'>
                              Mayoreo
                            </Switch>
                            <Button>Agregar precio</Button>
                          </div>
                          <div>
                            <div className='flex flex-row gap-2'>
                              <Input label='Mínimo' type='text' size='sm' />
                              <Input label='Precio' type='text' size='sm' />
                            </div>
                          </div>
                        </section>
                      </form>
                    </Tab>
                    <Tab key='bulk' title='Granel' className={selectedTypeUnit === 'bulk' ? '' : 'hidden'}>
                      <form className='space-y-2'>
                        <CheckboxGroup color='secondary' label='Unidades de venta disponibles' orientation='horizontal'>
                          <Checkbox value='gr'>Gramos</Checkbox>
                          <Checkbox value='oz'>Onzas</Checkbox>
                          <Checkbox value='lb'>Libras</Checkbox>
                        </CheckboxGroup>
                        <div className='flex flex-row gap-2'>
                          <Select label='Unidad base' size='sm'>
                            <SelectItem key='gr'>Gramo</SelectItem>
                            <SelectItem key='oz'>Onza</SelectItem>
                            <SelectItem key='lb'>Libra</SelectItem>
                          </Select>
                          <Input label='Precio' type='text' size='sm' />
                        </div>
                        <RadioGroup label='Ajuste por unidad' orientation='horizontal'>
                          <Radio value='gr'>
                            Gramo
                            <Input type='text' size='sm' label='Factor' />
                          </Radio>
                          <Radio value='oz'>
                            Onza
                            <Input type='text' size='sm' label='Factor' />
                          </Radio>
                          <Radio value='lb'>
                            Libra
                            <Input type='text' size='sm' label='Factor' />
                          </Radio>
                        </RadioGroup>

                        <section className='flex flex-row justify-between'>
                          <div className='flex flex-row justify-between'>
                            <Switch aria-label='Compra mínima' size='sm'>
                              Mínimo
                            </Switch>
                            <Input type='text' size='sm' maxLength={3} className='max-w-12 text-center' />
                          </div>
                          <div className='flex flex-row justify-between'>
                            <Switch aria-label='Compra máxima' size='sm'>
                              Máximo
                            </Switch>
                            <Input type='text' size='sm' maxLength={3} className='max-w-12 text-center' />
                          </div>
                        </section>

                        <table className='w-full text-left'>
                          <thead>
                            <tr>
                              <th>Unidad</th>
                              <th>Margen</th>
                              <th>Precio</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Gramo</td>
                              <td>5%</td>
                              <td>$10.00</td>
                            </tr>
                          </tbody>
                        </table>
                      </form>
                    </Tab>
                  </Tabs>
                </section>
              </ModalBody>
              <ModalFooter>
                <Button color='danger' variant='light' onPress={onClose}>
                  Cerrar
                </Button>
                <Button color='primary' onPress={handleAddProduct}>
                  Aceptar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={isOpenDeleteProduct} onOpenChange={onOpenChangeDeleteProduct}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className='flex flex-col gap-1'>Eliminar producto</ModalHeader>
              <ModalBody>
                <p>¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
              </ModalBody>
              <ModalFooter>
                <Button color='danger' variant='light' onPress={onClose}>
                  Cerrar
                </Button>
                <Button color='primary' onPress={() => deleteProduct(deleteProductId)}>
                  Aceptar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default Products
