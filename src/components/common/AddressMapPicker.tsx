import { Button, Input, Spinner, Tooltip } from '@heroui/react'
import { GoogleMap, MarkerF } from '@react-google-maps/api'
import { Crosshair } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDeviceScreen } from '../../hooks/useDeviceScreen'
import { useGoogleMaps } from '../../hooks/useGoogleMaps'

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
  onMarkerChange?: (hasMarker: boolean, value?: AddressResult | null) => void
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  border: '1px solid #ccc'
}

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
  showMarkerOnPostalCenter = false,
  onMarkerChange
}: Props) {
  const { isLoaded } = useGoogleMaps(language, region)
  const { isMobile } = useDeviceScreen()

  // ⚠️ Importante: center inicia en null para NO renderizar mapa hasta tener CP resuelto
  const [center, setCenter] = useState<LatLng | null>(postalCode ? null : defaultCenter)
  const [zoom, setZoom] = useState(defaultZoom)
  const [address, setAddress] = useState(defaultAddress)
  const [locating, setLocating] = useState(false)
  const [hasAddress, setHasAddress] = useState<boolean>(false) // marcador solo con dirección explícita
  const [isCenteredFromCP, setIsCenteredFromCP] = useState<boolean>(false) // ya centramos por CP

  // Autocomplete (Data API)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [loadingPredictions, setLoadingPredictions] = useState(false)

  const mapRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const debounceRef = useRef<number | null>(null)
  const lastCpRef = useRef<string | null>(null)

  const ensureGeocoder = () => {
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder()
    return geocoderRef.current
  }

  const onLoadMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    ensureGeocoder()

    // PlacesService para getDetails
    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(map)
    }
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
    geocoderRef.current = null
    placesServiceRef.current = null
  }, [])

  // Crear AutocompleteService cuando esté cargado Google
  useEffect(() => {
    if (!isLoaded) return
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    }
  }, [isLoaded])

  const applyResult = useCallback(
    (addrText: string, coords: LatLng, components: AddressComponentsMX, placeId?: string) => {
      const result: AddressResult = {
        address: addrText,
        coords,
        placeId,
        components
      }

      setCenter(coords)
      setZoom(19)
      setAddress(addrText)
      setHasAddress(true)

      onChange?.(result)
      onMarkerChange?.(true, result)
    },
    [onChange, onMarkerChange]
  )

  const commitChange = useCallback(
    (placeLike: google.maps.places.PlaceResult) => {
      const loc = placeLike.geometry?.location
      if (!loc) return
      const coords = { lat: loc.lat(), lng: loc.lng() }
      const addrText = placeLike.formatted_address || address || ''
      const components = mapToMX(placeLike)

      if (country?.toLowerCase() === 'mx') {
        const cc = (components.country_code || '').toUpperCase()
        if (cc && cc !== 'MX') console.warn('Resultado fuera de México:', addrText)
      }

      applyResult(addrText, coords, components, placeLike.place_id)
    },
    [applyResult, address, country]
  )

  const geocodeLatLng = useCallback(async (coords: LatLng) => {
    const geocoder = ensureGeocoder()
    const { results } = await geocoder.geocode({ location: coords })
    return results?.[0] ?? null
  }, [])

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
          const fallback: AddressResult = {
            address,
            coords,
            components: {} as AddressComponentsMX
          }
          onChange?.(fallback)
          setHasAddress(true)
          onMarkerChange?.(true, fallback)
        }
      } catch (err) {
        console.error(err)
      }
    },
    [address, commitChange, geocodeLatLng, onChange, onMarkerChange]
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
            const fallback: AddressResult = {
              address: '',
              coords,
              components: {} as AddressComponentsMX
            }
            setCenter(coords)
            setZoom(17)
            onChange?.(fallback)
            setHasAddress(true)
            onMarkerChange?.(true, fallback)
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
  }, [commitChange, geocodeLatLng, onChange, onMarkerChange])

  const mapStyle = useMemo(
    () => ({
      ...containerStyle,
      height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight
    }),
    [mapHeight]
  )

  // 🔍 Manejo de Autocomplete (Data API + dropdown propio)
  const requestPredictions = useCallback(
    (input: string) => {
      if (!autocompleteServiceRef.current) return
      if (!input || input.length < 3) {
        setPredictions([])
        setShowPredictions(false)
        return
      }

      setLoadingPredictions(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: (country || 'mx').toUpperCase() },
          types: ['address']
        },
        (preds) => {
          setLoadingPredictions(false)
          const list = preds || []
          setPredictions(list)
          setShowPredictions(list.length > 0)
        }
      )
    },
    [country]
  )

  const handleAddressChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setAddress(value)

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      requestPredictions(value)
    }, 250)
  }

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    setAddress(prediction.description)
    setShowPredictions(false)
    setPredictions([])

    if (!placesServiceRef.current) return

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'address_component', 'place_id']
      },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          console.warn('getDetails falló:', status)
          return
        }
        commitChange(place)
      }
    )
  }

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

    // 👇 NUEVO: si ya hay marcador (dirección elegida),
    // NO recentramos al centro del CP, solo marcamos que el mapa ya puede verse.
    if (hasAddress) {
      lastCpRef.current = cp
      setIsCenteredFromCP(true)
      return
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      geocoder.geocode({ address: cp, componentRestrictions: { country: (country || 'mx').toUpperCase() } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const g = results[0].geometry
          if (g?.viewport) {
            const c = g.viewport.getCenter()
            if (c) setCenter({ lat: c.lat(), lng: c.lng() })
            setZoom(15)
          } else if (g?.location) {
            const loc = g.location
            setCenter({ lat: loc.lat(), lng: loc.lng() })
            setZoom(15)
          }
          lastCpRef.current = cp
          // 👇 YA NO hacemos setHasAddress(false) aquí
          setIsCenteredFromCP(true)
        } else {
          console.warn('Geocode CP falló:', status)
          if (center === null) setCenter(defaultCenter)
          setIsCenteredFromCP(true)
        }
      })
    }, 250)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // 👇 importante agregar hasAddress a las deps
  }, [postalCode, country, isLoaded, defaultCenter, center, hasAddress])

  // ⛔️ No renderizamos el mapa hasta que tengamos center calculado:
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
          {/* Input propio + dropdown de predicciones */}
          <div className='relative w-full'>
            <Input
              value={address}
              placeholder={placeholder}
              label='Dirección'
              size='sm'
              variant='bordered'
              classNames={{ inputWrapper: 'bg-white' }}
              onChange={handleAddressChange}
              isClearable
              onClear={() => {
                setAddress('')
                setPredictions([])
                setShowPredictions(false)
                setHasAddress(false)
                onMarkerChange?.(false, null)
              }}
            />

            {showPredictions && (
              <div className='absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg'>
                {loadingPredictions && <div className='px-3 py-2 text-xs text-gray-500'>Buscando direcciones…</div>}
                {!loadingPredictions && predictions.length === 0 && <div className='px-3 py-2 text-xs text-gray-500'>Sin resultados</div>}
                {predictions.map((p) => (
                  <button
                    key={p.place_id}
                    type='button'
                    onClick={() => handlePredictionClick(p)}
                    className='flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-100'
                  >
                    <span>{p.structured_formatting?.main_text || p.description}</span>
                    {p.structured_formatting?.secondary_text && (
                      <span className='text-xs text-gray-500'>{p.structured_formatting.secondary_text}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              <p>Ajusta el marcador si es necesario, o ajusta los datos en el siguiente formulario</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
