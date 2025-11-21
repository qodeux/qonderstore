import { Alert, Button, Input, Radio, RadioGroup, Select, SelectItem, Spinner } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Key } from '@react-types/shared'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import AddressMapPicker, { type AddressResult } from '../../components/common/AddressMapPicker'
import CartItemBox from '../../components/store/CartItemBox'
import { useAddressComplete } from '../../hooks/useAddressComplete'
import { useDeviceScreen } from '../../hooks/useDeviceScreen'
import { checkoutSchema, type CheckoutFormInput } from '../../schemas/checkout.schema'
import { locationService } from '../../services/locationService'
import { storeOrderService } from '../../services/storeOrderService'
import { clearCart, selectCartTotals } from '../../store/slices/cartSlice'
import type { RootState } from '../../store/store'
import type { Neighborhood } from '../../types/location'
import type { SublocalityData } from '../../types/storeOrders'
import { deliveryRoutesMap } from '../../types/storeOrders'
import { formatMoney } from '../../utils/money'

const normalize = (s?: string) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const isFiveDigits = (s?: string) => /^\d{5}$/.test((s ?? '').trim())

const Checkout = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const cartTotals = useSelector(selectCartTotals)
  const { items: cartItems, totalPrice } = useSelector((state: RootState) => state.cart)
  const [shippingPrice, setShippingPrice] = useState(null as number | null)

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { control, handleSubmit, watch, setValue, clearErrors, setError, trigger, getValues, formState } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    mode: 'all',
    defaultValues: {
      name: user?.role === 'customer' ? user.full_name : '',
      phone: user?.role === 'customer' ? user.phone || '' : '',
      email: user?.role === 'customer' ? user.email : '',
      postal_code_lookup: '',
      postal_code: '',
      state: '',
      locality: '',
      sublocality: '',
      street_address: '',
      street_number: '',
      interior_number: undefined,
      delivery_type: 'standard',
      delivery_date: 'today',
      delivery_route: undefined,
      shipping_price: 0,
      address_notes: undefined,
      coupon_code: undefined
    }
  })

  const watchPostalCodeLookup = watch('postal_code_lookup')

  const watchState = watch('state')
  const watchDeliveryType = watch('delivery_type')

  const watchCouponCode = watch('coupon_code')

  const watchShippingPrice = watch('shipping_price')

  const listRef = useRef<HTMLDivElement>(null)
  const fetchIdRef = useRef(0)

  const [showApplyCoupon, setShowApplyCoupon] = useState(false)
  const [cartHasDiscount, setCartHasDiscount] = useState(false)
  const [canShipToCP, setCanShipToCP] = useState<boolean>(false)
  const [neighborhoodsOptions, setNeighborhoodsOptions] = useState<Neighborhood[]>([])
  const [isBannedCP, setIsBannedCP] = useState(false)
  const [isLoadingCP, setIsLoadingCP] = useState(false)
  const [searchingPostalCode, setSearchingPostalCode] = useState(false)

  const isAddressComplete = useAddressComplete({
    control,
    neighborhoods: neighborhoodsOptions,
    canShipToCP,
    isLoadingCP,
    errors: formState.errors // opcional
  })

  const { isMobile } = useDeviceScreen()

  const toggleApplyCoupon = () => setShowApplyCoupon((v) => !v)

  const getCPData = async (postalCode: string) => {
    try {
      return await locationService.fetchPostalCodeData(postalCode)
    } catch {
      return []
    }
  }

  /** Carga bundle por CP: copia a postal_code, setea estado/municipio, llena colonias y selecciona preferida o primera */
  const loadCPBundle = async (cp: string, preferredColoniaName?: string) => {
    setIsBannedCP(false) // Reset banned flag on new search
    if (!isFiveDigits(cp)) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setError('postal_code_lookup', { type: 'manual', message: 'Código postal inválido' })
      return
    }

    // Copia lookup → postal_code
    setValue('postal_code', cp, { shouldValidate: true, shouldDirty: true })

    const myFetchId = ++fetchIdRef.current
    setIsLoadingCP(true)

    const cpData = await getCPData(cp)

    if (myFetchId !== fetchIdRef.current) return // llegó otra búsqueda más nueva

    setIsLoadingCP(false)

    if (!cpData.length) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setError('postal_code_lookup', { type: 'manual', message: 'El código postal no existe' })
      return
    }

    if (cpData[0]?.is_banned) {
      setNeighborhoodsOptions([])
      setCanShipToCP(false)
      setError('postal_code_lookup', { type: 'manual' })
      setIsBannedCP(true)

      return
    }

    clearErrors(['state', 'locality'])

    // Estado / Municipio
    setValue('state', cpData[0]?.d_estado || '', { shouldDirty: true })
    setValue('locality', cpData[0]?.d_mnpio || '', { shouldDirty: true })

    // Colonias
    setNeighborhoodsOptions(cpData)
    setCanShipToCP(true)

    // Selección de colonia: preferida (si matchea por nombre) o la primera
    let selected = cpData[0]?.id?.toString() ?? ''
    if (preferredColoniaName) {
      const hit = cpData.find((n: SublocalityData) => normalize(n.d_asenta) === normalize(preferredColoniaName))
      if (hit) selected = String(hit.id)
    }

    setValue('sublocality', selected, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    })

    const { data } = await storeOrderService.getShippingPrice(Number(selected))

    if (!data) {
      setShippingPrice(null)
      setValue('shipping_price', 0, { shouldValidate: true, shouldDirty: true })
    } else {
      setShippingPrice(data?.shipping_price)
      setValue('shipping_price', data?.shipping_price ?? 0, { shouldValidate: true, shouldDirty: true })
    }
  }

  /** Cambio desde el mapa */
  const handleChange = async (value: AddressResult) => {
    // Campos base
    setValue('street_address', value.components.route || '')
    setValue('street_number', value.components.street_number || '')
    setValue('locality', value.components.locality || '')
    setValue('state', value.components.state || '')

    setValue('google_location', value.coords)

    const newCP = (value.components.postal_code ?? '').trim()

    // Si Google trae CP raro (p.ej. P0001), no toques CP/colonias
    if (!isFiveDigits(newCP)) {
      clearErrors(['street_address', 'street_number', 'postal_code', 'locality', 'state', 'sublocality'])
      return
    }

    const currentCP = getValues('postal_code') ?? ''

    if (newCP !== currentCP) {
      // CP cambió → recarga colonias y luego selecciona colonia del mapa (si existe)
      await loadCPBundle(newCP, value.components.sublocality)
    } else {
      // CP igual → solo intenta seleccionar colonia existente por nombre
      if (neighborhoodsOptions.length) {
        const hit = neighborhoodsOptions.find((n) => normalize(n.d_asenta) === normalize(value.components.sublocality))
        const selected = hit ? String(hit.id) : String(neighborhoodsOptions[0].id)
        setValue('sublocality', selected, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
      }
    }

    clearErrors(['street_address', 'street_number', 'postal_code', 'locality', 'state', 'sublocality'])
  }

  /** Buscar por CP inicial (postal_code_lookup) */
  /** Buscar por CP inicial (postal_code_lookup) */
  useEffect(() => {
    const run = async () => {
      const lookup = watchPostalCodeLookup ?? ''
      if (!lookup) return

      const ok = await trigger('postal_code_lookup')
      if (!ok) return

      setSearchingPostalCode(true)
      await loadCPBundle(lookup)
      setSearchingPostalCode(false)
    }
    run()
    return () => {
      setIsBannedCP(false) // Reset banned flag on unmount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPostalCodeLookup])
  useEffect(() => {
    if (shippingPrice === null) return

    if (watchDeliveryType === 'pickup') {
      setValue('shipping_price', 0, {
        shouldValidate: true,
        shouldDirty: true
      })
    }

    if (watchDeliveryType === 'express') {
      const newPrice = shippingPrice + 150
      setValue('shipping_price', newPrice, {
        shouldValidate: true,
        shouldDirty: true
      })
    } else if (watchDeliveryType === 'standard' || watchDeliveryType === 'custom') {
      const baseShippingPrice = shippingPrice ?? null
      setValue('shipping_price', baseShippingPrice, {
        shouldValidate: true,
        shouldDirty: true
      })
    }
  }, [watchDeliveryType, shippingPrice, setValue])

  const handlePromoApply = () => {
    if ((watchCouponCode ?? '').toUpperCase() !== 'QONDER10') {
      setError('coupon_code', { type: 'manual', message: 'Código de cupón inválido' })
      setTimeout(() => {
        clearErrors('coupon_code')
        setValue('coupon_code', '')
      }, 1000)
      return
    }
    setCartHasDiscount(true)
  }

  const getIP = async () => {
    try {
      const ipResponse = await fetch('/.netlify/functions/whoami')
      const ipData = await ipResponse.json()
      console.log('IP Address:', ipData.ip)
      return ipData.ip
    } catch (error) {
      console.error('Error fetching IP address:', error)
      return 'Unknown'
    }
  }

  const handleCreateOrder = handleSubmit(
    async (data) => {
      //console.log('Datos del pedido:', data)

      if (!user) return

      try {
        const orderTransmission = await storeOrderService.createOrder({
          orderData: data,
          items: cartItems,
          cartTotals: { ...cartTotals, shippingPrice: watchShippingPrice ?? 0 },
          metadata: {
            ip: await getIP(),
            user_agent: navigator.userAgent
          },
          userId: user?.id
        })

        if (shippingPrice === null) {
          //Agregamos a la base el costo de envío para futuras ocasiones
          await storeOrderService.addShippingPrice(data.postal_code, Number(data.sublocality), watchShippingPrice ?? 0)
        }

        if (orderTransmission.id) {
          dispatch(clearCart())
          //Guardar orden en el storage para detalles
          sessionStorage.setItem('admin_selected_store_order', JSON.stringify(orderTransmission))
        }

        if (user?.role === 'customer') {
          navigate(`/tienda/checkout/confirmacion/${orderTransmission.id}`)
        }

        if (['admin', 'staff'].includes(user.role)) {
          navigate(`/admin/orden/${orderTransmission.id}`)
        }
      } catch (error) {
        console.log(error)
      }
    },
    (errors) => {
      console.log('Errores en el formulario:', errors)
    }
  )

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/tienda/productos')
    }
  }, [cartItems.length, navigate])

  return (
    <form
      className='grid grid-cols-1 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_350px] container mx-auto gap-8 p-8'
      onSubmit={handleCreateOrder}
    >
      {/* Columna izquierda */}
      <div className='flex-grow'>
        <h3 className='text-xl font-bold'>Datos de contacto</h3>
        <p className='text-small'>Ingresa los datos para recibir el envío</p>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-2 my-4'>
          <Controller
            control={control}
            name='name'
            render={({ field, fieldState }) => (
              <Input
                type='text'
                label='Nombre'
                {...field}
                size='sm'
                isClearable
                onClear={() => field.onChange('')}
                classNames={{ inputWrapper: 'bg-white' }}
                variant='bordered'
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
              />
            )}
          />

          <Controller
            name='phone'
            control={control}
            render={({ field, fieldState }) => (
              <PatternFormat
                {...field}
                customInput={Input}
                format='## #### ####'
                type='tel'
                inputMode='tel'
                label='Teléfono'
                autoComplete='tel'
                classNames={{ inputWrapper: 'bg-white' }}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                variant='bordered'
                size='sm'
                isClearable
                onClear={() => field.onChange('')}
              />
            )}
          />

          <Controller
            control={control}
            name='email'
            render={({ field, fieldState }) => (
              <Input
                type='text'
                label='Correo electrónico'
                {...field}
                size='sm'
                isClearable
                onClear={() => field.onChange('')}
                classNames={{ inputWrapper: 'bg-white' }}
                variant='bordered'
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
              />
            )}
          />
        </div>

        <h3 className='text-xl font-bold'>Dirección de envío</h3>

        {!canShipToCP && (
          <div className='flex flex-col'>
            <p className='text-sm max-w-lg'>
              Antes de continuar necesitamos saber tu código postal para verificar la cobertura en tu zona, además de ayudarte a localizar
              tu dirección usaremos esta información para calcular los costos de envío.
            </p>
            <div className='flex items-center'>
              <Controller
                control={control}
                name='postal_code_lookup'
                render={({ field, fieldState }) => (
                  <PatternFormat
                    format='#####'
                    customInput={Input}
                    label='Código Postal'
                    size='sm'
                    className='w-full sm:max-w-[180px] my-4'
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v.value)}
                    inputMode='numeric'
                    isAllowed={(vals) => vals.value.length <= 5}
                    isClearable
                    onClear={() => field.onChange('')}
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    classNames={{ inputWrapper: 'bg-white' }}
                    variant='bordered'
                    endContent={searchingPostalCode ? <Spinner size='sm' className='mr-2' /> : undefined}
                    isDisabled={searchingPostalCode}
                  />
                )}
              />
            </div>
          </div>
        )}

        {!canShipToCP && isBannedCP && (
          <div className='flex justify-center'>
            <Alert className='mt-4 max-w-lg' variant='faded' color='warning'>
              <p>
                Desafortunadamente no realizamos envíos para ese código postal. Intenta con otro código o contáctanos para más información.
              </p>
            </Alert>
          </div>
        )}

        {canShipToCP && (
          <>
            <p className='text-sm mb-4'>Busca tu dirección en el mapa</p>
            <AddressMapPicker onChange={handleChange} mapHeight={400} postalCode={watchPostalCodeLookup} />

            <div className='grid grid-cols-1 lg:grid-cols-3 max-w-full gap-2 my-4 items-start'>
              {/* CP (editable si quieres) */}
              <Controller
                control={control}
                name='postal_code'
                render={({ field, fieldState }) => (
                  <PatternFormat
                    format='#####'
                    customInput={Input}
                    label='Código Postal'
                    size='sm'
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v.value)}
                    inputMode='numeric'
                    isAllowed={(vals) => vals.value.length <= 5}
                    isClearable
                    onClear={() => field.onChange('')}
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    classNames={{ inputWrapper: 'bg-white' }}
                    variant='bordered'
                  />
                )}
              />

              <Controller
                control={control}
                name='locality'
                render={({ field, fieldState }) => (
                  <Input
                    type='text'
                    label='Municipio'
                    {...field}
                    size='sm'
                    classNames={{ inputWrapper: 'bg-white' }}
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    variant='bordered'
                    readOnly
                  />
                )}
              />

              <Controller
                control={control}
                name='state'
                render={({ field, fieldState }) => (
                  <Input
                    type='text'
                    label='Estado'
                    {...field}
                    size='sm'
                    classNames={{ inputWrapper: 'bg-white' }}
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    variant='bordered'
                    readOnly
                  />
                )}
              />

              {/* Colonia */}
              <Controller
                control={control}
                name='sublocality'
                render={({ field, fieldState }) => (
                  <Select
                    label='Colonia'
                    size='sm'
                    className='w-full'
                    classNames={{ trigger: 'bg-white' }}
                    items={neighborhoodsOptions}
                    disallowEmptySelection
                    isDisabled={isLoadingCP || neighborhoodsOptions.length === 0}
                    selectedKeys={field.value ? new Set([String(field.value)]) : new Set()}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string | undefined
                      field.onChange(key ?? '')
                    }}
                    variant='bordered'
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    endContent={isLoadingCP ? <Spinner size='sm' className='mr-2' /> : undefined}
                  >
                    {(item) => <SelectItem key={item.id}>{item.d_asenta}</SelectItem>}
                  </Select>
                )}
              />

              {/* Calle / Número / Interior */}
              <div className='lg:col-span-2 grid grid-cols-2 gap-2 lg:grid-cols-[1fr_100px_100px]'>
                <div className='col-span-2 lg:col-span-1'>
                  <Controller
                    control={control}
                    name='street_address'
                    render={({ field, fieldState }) => (
                      <Input
                        type='text'
                        label='Calle'
                        {...field}
                        size='sm'
                        classNames={{ inputWrapper: 'bg-white' }}
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        variant='bordered'
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    control={control}
                    name='street_number'
                    render={({ field, fieldState }) => (
                      <Input
                        type='text'
                        label='Número'
                        {...field}
                        size='sm'
                        classNames={{ inputWrapper: 'bg-white' }}
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        variant='bordered'
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    control={control}
                    name='interior_number'
                    render={({ field, fieldState }) => (
                      <Input
                        type='text'
                        label='Interior'
                        {...field}
                        size='sm'
                        classNames={{ inputWrapper: 'bg-white' }}
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        variant='bordered'
                      />
                    )}
                  />
                </div>
              </div>
              <Controller
                control={control}
                name='google_location'
                render={({ field }) => <input type='hidden' value={JSON.stringify(field.value)} />}
              />
            </div>

            {/* Tipo de entrega */}
            {isAddressComplete && (
              <fieldset>
                <legend className='font-bold text-xl'>Tipo de entrega</legend>
                <p className='text-sm mb-4'>Selecciona el tipo de entrega que prefieras para tu pedido.</p>

                <div className='flex justify-between w-full items-center'>
                  <Controller
                    control={control}
                    name='delivery_type'
                    render={({ field, fieldState }) => (
                      <RadioGroup
                        {...field}
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        // className='flex-grow'
                        orientation={isMobile ? 'vertical' : 'horizontal'}
                        //className={isMobile ? 'space-y-3' : 'space-x-6'}
                      >
                        {watchState === 'Ciudad de México' ? (
                          <>
                            <Radio value={'standard'}>Próxima ruta disponible</Radio>
                            <Radio value={'custom'}>Seleccionar ruta</Radio>
                            {shippingPrice !== null && <Radio value={'express'}>Entrega express</Radio>}
                            {user?.role !== 'customer' && <Radio value={'pickup'}>Pickup</Radio>}
                          </>
                        ) : (
                          <Radio value={'foreign'}>Envío foráneo</Radio>
                        )}
                      </RadioGroup>
                    )}
                  />
                  {watchDeliveryType !== 'pickup' && (
                    <Controller
                      name='shipping_price'
                      control={control}
                      render={({ field, fieldState }) => (
                        <NumericFormat
                          variant='bordered'
                          className='max-w-[150px]'
                          classNames={{ inputWrapper: 'bg-white' }}
                          label='Precio de envío'
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v.floatValue ?? undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                          getInputRef={field.ref}
                          thousandSeparator
                          decimalScale={2}
                          fixedDecimalScale
                          allowNegative={false}
                          prefix='$ '
                          inputMode='decimal'
                          customInput={Input}
                          size='sm'
                          isInvalid={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                          onFocus={(e) => {
                            setTimeout(() => e.currentTarget.select(), 0)
                          }}
                          onPointerDown={(e) => {
                            const el = e.currentTarget as HTMLInputElement
                            if (document.activeElement !== el) {
                              e.preventDefault()
                              el.focus()
                              el.select()
                            }
                          }}
                        />
                      )}
                    />
                  )}
                </div>

                {watchDeliveryType === 'custom' && (
                  <div className='grid grid-cols-2 max-w-[300px] md:items-start gap-2'>
                    <p className='pt-3 text-sm col-span-2'>Rutas disponibles</p>
                    <Controller
                      control={control}
                      name='delivery_date'
                      render={({ field, fieldState }) => (
                        <Select
                          {...field}
                          defaultSelectedKeys={[field.value]}
                          className='max-w-[150px]'
                          classNames={{ trigger: 'bg-white' }}
                          errorMessage={fieldState.error?.message}
                          isInvalid={!!fieldState.error}
                          variant='bordered'
                          label='Día'
                          size='sm'
                          disallowEmptySelection
                        >
                          <SelectItem key='today'>Hoy</SelectItem>
                          <SelectItem key='tomorrow'>Mañana</SelectItem>
                        </Select>
                      )}
                    />

                    <Controller
                      name='delivery_route'
                      control={control}
                      render={({ field, fieldState }) => {
                        const valueAsKey = field.value as Key | undefined
                        const selectedKeys: Iterable<Key> | undefined = valueAsKey != null ? [valueAsKey] : undefined
                        return (
                          <Select
                            label='Horario'
                            classNames={{ trigger: 'bg-white' }}
                            errorMessage={fieldState.error?.message}
                            isInvalid={!!fieldState.error}
                            variant='bordered'
                            disallowEmptySelection
                            size='sm'
                            selectionMode='single'
                            selectedKeys={selectedKeys}
                            onSelectionChange={(keys) => {
                              if (keys === 'all') return
                              const [key] = Array.from(keys)
                              field.onChange(key as keyof typeof deliveryRoutesMap)
                            }}
                          >
                            <SelectItem key='12'>12:00 PM</SelectItem>
                            <SelectItem key='14'>2:00 PM</SelectItem>
                            <SelectItem key='16'>4:00 PM</SelectItem>
                            <SelectItem key='18'>6:00 PM</SelectItem>
                            <SelectItem key='20'>8:00 PM</SelectItem>
                          </Select>
                        )
                      }}
                    />
                  </div>
                )}

                {watchDeliveryType !== undefined && user?.role === 'customer' && (
                  <Alert
                    className='mt-4 text-xs'
                    variant='flat'
                    color='primary'
                    title='Información de entrega'
                    classNames={{ title: 'font-bold', base: 'items-start' }}
                    description={
                      <div className='text-xs'>
                        {watchDeliveryType === 'standard' && (
                          <p>
                            Una vez que tu pago sea <strong>acreditado</strong>, procesaremos tu pedido y lo incluiremos en la próxima ruta
                            de entrega disponible, te enviaremos un mensaje de confirmación. Los tiempos de entrega pueden variar según la
                            disponibilidad y la ubicación. Te notificaremos si hay algún cambio o contratiempo.
                          </p>
                        )}
                        {watchDeliveryType === 'custom' && (
                          <p>
                            Si seleccionas una ruta específica, tu pago <strong>debe ser acreditado</strong> antes del horario elegido, te
                            enviaremos un mensaje de confirmación con los detalles de la entrega. Por favor, asegúrate de estar disponible
                            en la dirección proporcionada durante el horario seleccionado.
                          </p>
                        )}
                        {watchDeliveryType === 'express' && (
                          <p>
                            Nuestro equipo te contactará para coordinar la entrega lo <strong>antes posible</strong>. Ten en cuenta que las
                            entregas express pueden tener un <strong>costo adicional</strong> y están sujetas a la disponibilidad en tu área
                            y a nuestros <strong>horarios de rutas</strong>.
                          </p>
                        )}
                      </div>
                    }
                  />
                )}
              </fieldset>
            )}
          </>
        )}
      </div>

      {/* Columna derecha (carrito) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
        className='flex flex-col w-full md:sticky md:top-20 lg:max-h-[65vh] h-fit border border-foreground-400 rounded-md overflow-hidden bg-white shadow-md'
      >
        <AnimatePresence>
          {cartItems.length !== 0 && (
            <header key='cart-header' className='px-4 py-2 flex items-center justify-between border-b border-foreground-400'>
              <h2 className='text-lg'>Resumen de tu pedido</h2>
              <motion.span className='text-sm text-gray-500'>
                {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
              </motion.span>
            </header>
          )}

          <section ref={listRef} className='flex flex-col gap-4 overflow-y-auto overflow-x-hidden p-4'>
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.unitSelected ?? item.base_unit}-${index}`}>
                  <CartItemBox item={item} isLast={index === cartItems.length - 1} listRef={listRef} />
                </div>
              ))}
            </AnimatePresence>
          </section>

          {cartItems.length !== 0 && (
            <footer
              key='cart-footer'
              className='flex flex-col shrink-0 p-4 border-t border-foreground-400 bg-white gap-4 overflow-hidden z-10 sticky bottom-0 w-full'
            >
              <AnimatePresence>
                {showApplyCoupon && !cartHasDiscount && (
                  <motion.section
                    className='flex items-center gap-2 absolute w-full left-0 top-0 bg-white p-4 border-b border-foreground-400 h-full z-10'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.2, type: 'spring' }}
                  >
                    <div className='flex flex-grow'>
                      <Controller
                        control={control}
                        name='coupon_code'
                        render={({ field, fieldState }) => (
                          <Input
                            label='Código de descuento'
                            maxLength={10}
                            value={field.value ?? ''}
                            onValueChange={(v) => field.onChange(v.toUpperCase())}
                            size='sm'
                            classNames={{ inputWrapper: 'rounded-r-none border-black' }}
                            variant='bordered'
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                      <Button size='lg' className='rounded-l-none bg-black text-white' variant='solid' onPress={() => handlePromoApply()}>
                        Aplicar
                      </Button>
                    </div>

                    <Button size='lg' variant='solid' isIconOnly color='danger' onPress={toggleApplyCoupon}>
                      <X />
                    </Button>
                  </motion.section>
                )}
              </AnimatePresence>

              <div className='flex flex-col justify-between items-center'>
                <div className='w-full flex justify-between items-center'>
                  {!showApplyCoupon && !cartHasDiscount && (
                    <motion.span
                      onClick={toggleApplyCoupon}
                      className='cursor-pointer w-full text-right'
                      whileHover={{ textDecoration: 'underline' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      ¿Tienes un cupón?
                    </motion.span>
                  )}
                </div>
                {watchDeliveryType !== undefined && watchShippingPrice !== 0 && (
                  <div className='text-2xl text-right w-full'>
                    Envío : <span className='font-bold'>{formatMoney(watchShippingPrice ?? 0)}</span>
                  </div>
                )}
                {cartHasDiscount && (
                  <div className='text-right text-2xl w-full'>
                    Descuento: <span className='font-bold'>$0.00</span>
                  </div>
                )}
                <div className='text-2xl text-right w-full'>
                  Total : <span className='font-bold'>{formatMoney(totalPrice)}</span>
                </div>
              </div>

              <Button
                type='submit'
                isDisabled={formState.isSubmitting || (formState.isSubmitted && !formState.isValid)}
                size='md'
                className='w-full bg-black text-white'
              >
                Realizar pedido
              </Button>
            </footer>
          )}
        </AnimatePresence>
      </motion.div>
    </form>
  )
}

export default Checkout
