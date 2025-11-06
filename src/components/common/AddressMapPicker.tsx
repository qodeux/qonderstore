import { Button, Input, Spinner, Tooltip } from '@heroui/react'
import { Autocomplete, GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'
import { Crosshair } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDeviceScreen } from '../../hooks/useDeviceScreen'

type LatLng = { lat: number; lng: number }

export type AddressComponentsMX = {
  street_number?: string
  route?: string
  street?: string
  neighborhood?: string
  sublocality?: string
  locality?: string
  municipality?: string
  state?: string
  state_code?: string
  postal_code?: string
  country?: string
  country_code?: string
}

export type AddressResult = {
  address: string
  coords: LatLng
  placeId?: string
  components: AddressComponentsMX
}

type Props = {
  /** Si NO pasas postalCode, usamos este centro por defecto */
  defaultCenter?: LatLng
  postalCode?: string
  defaultZoom?: number
  defaultAddress?: string
  onChange?: (value: AddressResult) => void
  mapHeight?: string | number
  draggableMarker?: boolean
  placeholder?: string
  country?: string // default 'mx'
  language?: string // default 'es'
  region?: string // default 'MX'
  /** Mostrar marcador cuando solo hay centro por CP (normalmente false) */
  showMarkerOnPostalCenter?: boolean
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  border: '1px solid #ccc'
}

const libraries: 'places'[] = ['places']

const toTypesMap = (place: google.maps.places.PlaceResult) => {
  const mapLong = new Map<string, string>()
  const mapShort = new Map<string, string>()
  ;(place.address_components || []).forEach((c) => {
    c.types.forEach((t) => {
      mapLong.set(t, c.long_name)
      mapShort.set(t, c.short_name)
    })
  })
  return { mapLong, mapShort }
}

const mapToMX = (place: google.maps.places.PlaceResult): AddressComponentsMX => {
  const { mapLong, mapShort } = toTypesMap(place)
  const street_number = mapLong.get('street_number')
  const route = mapLong.get('route')
  const neighborhood = mapLong.get('sublocality_level_1') || mapLong.get('neighborhood') || undefined
  const sublocality = mapLong.get('sublocality') || undefined
  const locality = mapLong.get('locality') || mapLong.get('postal_town') || undefined
  const municipality = mapLong.get('administrative_area_level_2') || undefined
  const state = mapLong.get('administrative_area_level_1') || undefined
  const state_code = mapShort.get('administrative_area_level_1') || undefined
  const postal_code = mapLong.get('postal_code') || undefined
  const country = mapLong.get('country') || undefined
  const country_code = mapShort.get('country') || undefined
  const street = [route, street_number].filter(Boolean).join(' ')
  return {
    street_number,
    route,
    street: street || undefined,
    neighborhood,
    sublocality,
    locality,
    municipality,
    state,
    state_code,
    postal_code,
    country,
    country_code
  }
}

export default function AddressMapPicker({
  // Nota: este default SOLO se usa si no hay postalCode
  defaultCenter = { lat: 19.432608, lng: -99.133209 }, // CDMX
  defaultZoom = 14,
  defaultAddress = '',
  postalCode,
  onChange,
  mapHeight = 400,
  draggableMarker = true,
  placeholder = 'Escribe una dirección…',
  country = 'mx',
  language = 'es',
  region = 'MX',
  showMarkerOnPostalCenter = false
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
    language,
    region
  })

  const { isMobile } = useDeviceScreen()

  // ⚠️ Importante: center inicia en null para NO renderizar mapa hasta tener CP resuelto
  const [center, setCenter] = useState<LatLng | null>(postalCode ? null : defaultCenter)
  const [zoom, setZoom] = useState(defaultZoom)
  const [address, setAddress] = useState(defaultAddress)
  const [locating, setLocating] = useState(false)
  const [hasAddress, setHasAddress] = useState<boolean>(false) // marcador solo con dirección explícita
  const [isCenteredFromCP, setIsCenteredFromCP] = useState<boolean>(false) // ya centramos por CP

  const mapRef = useRef<google.maps.Map | null>(null)
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const debounceRef = useRef<number | null>(null)
  const lastCpRef = useRef<string | null>(null)

  const ensureGeocoder = () => {
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder()
    return geocoderRef.current
  }

  const onLoadMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    ensureGeocoder()
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
    geocoderRef.current = null
  }, [])

  const commitChange = useCallback(
    (placeLike: {
      formatted_address?: string | null
      geometry?: { location?: google.maps.LatLng | null } | null
      place_id?: string
      address_components?: google.maps.GeocoderAddressComponent[]
    }) => {
      const loc = placeLike.geometry?.location
      if (!loc) return
      const coords = { lat: loc.lat(), lng: loc.lng() }
      const addrText = placeLike.formatted_address || inputRef.current?.value || ''
      const components = mapToMX(placeLike as unknown as google.maps.places.PlaceResult)

      if (country?.toLowerCase() === 'mx') {
        const cc = (components.country_code || '').toUpperCase()
        if (cc && cc !== 'MX') console.warn('Resultado fuera de México:', addrText)
      }

      setCenter(coords)
      //Zoom automático al seleccionar dirección
      setZoom(19)
      setAddress(addrText)
      setHasAddress(true) // ahora sí hay una dirección
      onChange?.({ address: addrText, coords, placeId: placeLike.place_id, components })
    },
    [onChange, country]
  )

  const geocodeLatLng = useCallback(async (coords: LatLng) => {
    const geocoder = ensureGeocoder()
    const { results } = await geocoder.geocode({ location: coords })
    return results?.[0] ?? null
  }, [])

  const handlePlaceChanged = useCallback(() => {
    if (!autoRef.current) return
    const place = autoRef.current.getPlace()
    if (!place?.geometry?.location) return
    commitChange(place)
  }, [commitChange])

  const onMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      setCenter(coords)
      try {
        const result = await geocodeLatLng(coords)
        if (result) {
          commitChange(result)
        } else {
          onChange?.({ address, coords, components: {} as AddressComponentsMX })
          setHasAddress(true)
        }
      } catch (err) {
        console.error(err)
      }
    },
    [address, commitChange, geocodeLatLng, onChange]
  )

  const handleUseMyLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalización no soportada en este navegador.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          const result = await geocodeLatLng(coords)
          if (result) {
            commitChange(result)
          } else {
            setCenter(coords)
            setZoom(17)
            onChange?.({ address: '', coords, components: {} as AddressComponentsMX })
            setHasAddress(true)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        console.error(err)
        setLocating(false)
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado.'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Ubicación no disponible.'
              : err.code === err.TIMEOUT
                ? 'Tiempo de espera agotado al obtener la ubicación.'
                : 'No se pudo obtener tu ubicación.'
        alert(msg)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    )
  }, [commitChange, geocodeLatLng, onChange])

  const mapStyle = useMemo(
    () => ({
      ...containerStyle,
      height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight
    }),
    [mapHeight]
  )

  // 👉 Geocode del CP ANTES de renderizar el <GoogleMap> (center inicia en null si hay CP)
  useEffect(() => {
    const cp = postalCode?.trim()
    if (!cp || cp.length < 4) {
      // Si no hay CP, mostramos defaultCenter
      if (!postalCode && center === null) setCenter(defaultCenter)
      return
    }
    if (!isLoaded) return
    const geocoder = ensureGeocoder()
    if (lastCpRef.current === cp) return

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      geocoder.geocode({ address: cp, componentRestrictions: { country: (country || 'mx').toUpperCase() } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const g = results[0].geometry
          if (g?.viewport) {
            const c = g.viewport.getCenter()
            if (c) setCenter({ lat: c.lat(), lng: c.lng() })
            //Zoom automático al geocode por CP
            setZoom(14)
          } else if (g?.location) {
            const loc = g.location
            setCenter({ lat: loc.lat(), lng: loc.lng() })
            setZoom(14)
          }
          lastCpRef.current = cp
          setHasAddress(false) // solo centrado por CP
          setIsCenteredFromCP(true) // ya podemos renderizar el mapa
        } else {
          console.warn('Geocode CP falló:', status)
          // En caso de fallo, evita quedarte sin mapa: usa defaultCenter
          if (center === null) setCenter(defaultCenter)
          setIsCenteredFromCP(true)
        }
      })
    }, 250)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [postalCode, country, isLoaded, defaultCenter, center])

  // ⛔️ No renderizamos el mapa hasta que tengamos center calculado:
  // - Si hay postalCode: esperamos a isCenteredFromCP
  // - Si NO hay postalCode: center ya viene con defaultCenter
  const shouldShowMap = center !== null && (postalCode ? isCenteredFromCP : true)

  if (!isLoaded) {
    return (
      <div className='w-full flex items-center justify-center' style={{ height: mapHeight }}>
        <Spinner size='sm' label='Cargando…' />
      </div>
    )
  }
  if (!shouldShowMap) {
    return (
      <div className='w-full flex items-center justify-center' style={{ height: mapHeight }}>
        <Spinner size='sm' label='Localizando tu código postal…' />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='w-full relative' style={{ height: mapHeight }}>
        <div className='flex items-center gap-2 w-full absolute z-10 bg-white/60 backdrop-blur-sm p-3 border border-gray-300 '>
          <Autocomplete
            onLoad={(ac) => (autoRef.current = ac)}
            onPlaceChanged={handlePlaceChanged}
            options={{
              fields: ['geometry', 'formatted_address', 'address_components', 'place_id', 'name'],
              types: ['address'],
              componentRestrictions: { country }
            }}
            className=' w-full'
          >
            <Input
              ref={inputRef}
              value={address}
              placeholder={placeholder}
              label='Dirección'
              size='sm'
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
              onChange={(e) => setAddress(e.target.value)}
              isClearable
              onClear={() => {
                setAddress('')
                //setCenter(null)
                //setZoom(2)
              }}
            />
          </Autocomplete>

          <Tooltip content='Usar mi ubicación actual'>
            <Button
              isLoading={locating}
              onPress={handleUseMyLocation}
              variant='solid'
              className='shrink-0'
              startContent={<Crosshair size={16} />}
              size='md'
              isIconOnly={isMobile}
            >
              <p className='hidden md:block'>Mi ubicación</p>
            </Button>
          </Tooltip>
        </div>
        <GoogleMap
          mapContainerStyle={mapStyle}
          center={center!}
          zoom={zoom}
          onLoad={onLoadMap}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: true
          }}
        >
          {(hasAddress || showMarkerOnPostalCenter) && (
            <MarkerF position={center!} draggable={hasAddress && draggableMarker} onDragEnd={onMarkerDragEnd} />
          )}
        </GoogleMap>

        {!hasAddress ? (
          <div className='pointer-events-none absolute bottom-0 flex items-center justify-start'>
            <div className='bg-white/80 backdrop-blur rounded-xl px-4 py-2 text-sm  shadow rounded-br-none rounded-tl-none'>
              <p className='text-lg font-semibold'>Coloca un marcador</p>
              <p>Busca y selecciona una dirección en el mapa para colocar el marcador</p>
            </div>
          </div>
        ) : (
          <div className='pointer-events-none absolute bottom-0 w-full flex items-center justify-start'>
            <div className='bg-white/80 backdrop-blur rounded-xl px-4 py-2 text-sm  shadow rounded-br-none rounded-tl-none'>
              <p className='text-lg font-semibold'>¿La ubicación del mapa es correcta? </p>
              <p>Ajusta el marcador si es necesario, o cambia los datos en el siguiente formulario</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug opcional */}
      {/* <div className='text-sm opacity-70 space-y-1'>
        <div>
          <b>Dirección:</b> {address || '—'}
        </div>
        <div>
          <b>Lat:</b> {center!.lat.toFixed(6)} &nbsp; <b>Lng:</b> {center!.lng.toFixed(6)}
        </div>
        <div>
          <b>Marcador activo:</b> {hasAddress ? 'sí' : 'no'}
        </div>
      </div> */}
    </div>
  )
}
