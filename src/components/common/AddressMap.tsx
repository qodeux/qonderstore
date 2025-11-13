// SingleLocationMap.tsx
import { Spinner } from '@heroui/react'
import { GoogleMap, MarkerF } from '@react-google-maps/api'
import { useEffect, useMemo, useState } from 'react'
import { useGoogleMaps } from '../../hooks/useGoogleMaps'

type LatLng = { lat: number; lng: number }

type SingleLocationMapProps = {
  /** Coordenadas obligatorias */
  coords: LatLng
  /** Altura del mapa */
  mapHeight?: number | string
  /** Zoom inicial */
  zoom?: number
  /** Idioma del mapa */
  language?: string
  /** Región del mapa */
  region?: string
}

/** Estilo del contenedor del mapa */
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  border: '1px solid #ccc'
}

/** Punto de referencia (ej. tu sucursal, almacén, etc.) */
const REFERENCE_POINT: LatLng = {
  lat: 19.3658916,
  lng: -99.1252809
}

const AddressMap = ({ coords, mapHeight = 300, zoom = 17, language = 'es', region = 'MX' }: SingleLocationMapProps) => {
  const { isLoaded } = useGoogleMaps(language, region)

  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [elevRef, setElevRef] = useState<number | null>(null)
  const [elevDest, setElevDest] = useState<number | null>(null)
  const [elevationError, setElevationError] = useState<string | null>(null)

  // Nos aseguramos de crear un nuevo objeto center solo cuando cambian las coords
  const center = useMemo(
    () => ({
      lat: coords.lat,
      lng: coords.lng
    }),
    [coords.lat, coords.lng]
  )

  const mapStyle = useMemo(
    () => ({
      ...containerStyle,
      height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight
    }),
    [mapHeight]
  )

  // 🔹 Calcula distancia cuando esté cargado Maps y cambien las coords
  useEffect(() => {
    if (!isLoaded) return

    const point1 = new google.maps.LatLng(REFERENCE_POINT.lat, REFERENCE_POINT.lng)
    const point2 = new google.maps.LatLng(coords.lat, coords.lng)

    const dist = google.maps.geometry.spherical.computeDistanceBetween(point1, point2)
    setDistanceMeters(dist)
  }, [isLoaded, coords.lat, coords.lng])

  // 🔹 Obtiene elevación de ambos puntos (referencia y destino)
  useEffect(() => {
    if (!isLoaded) return

    const service = new google.maps.ElevationService()

    service.getElevationForLocations(
      {
        locations: [REFERENCE_POINT, coords]
      },
      (results, status) => {
        if (status === 'OK' && results && results.length >= 2) {
          setElevRef(results[0].elevation)
          setElevDest(results[1].elevation)
          setElevationError(null)
        } else {
          console.error('Error elevación:', status, results)
          setElevationError('No se pudo obtener la elevación.')
        }
      }
    )
  }, [isLoaded, coords.lat, coords.lng])

  if (!isLoaded) {
    return (
      <div className='w-full flex items-center justify-center' style={{ height: mapHeight }}>
        <Spinner size='sm' label='Cargando mapa…' />
      </div>
    )
  }

  const distanceKm = distanceMeters != null ? distanceMeters / 1000 : null
  const elevationDiff = elevRef != null && elevDest != null ? elevDest - elevRef : null

  return (
    <>
      <div className='w-full relative my-2' style={{ height: mapHeight }}>
        <GoogleMap
          mapContainerStyle={mapStyle}
          center={center}
          zoom={zoom}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: true
          }}
        >
          <MarkerF position={center} />
        </GoogleMap>
        <div className='mt-3 text-sm space-y-1 grid grid-cols-2 absolute bottom-0 w-[76%] bg-white/80 p-2 z-0 backdrop-blur rounded-xl rounded-br-none rounded-tl-none shadow'>
          {distanceKm != null && (
            <div>
              <b>Distancia:</b> {distanceKm.toFixed(2)} km
            </div>
          )}

          {elevRef != null && elevDest != null && (
            <>
              <div>
                <b>Diferencia de elevación:</b>{' '}
                {elevationDiff! >= 0 ? `+${elevationDiff!.toFixed(1)} m ` : `${elevationDiff!.toFixed(1)} m `}
              </div>
              <div>
                <b>Altitud de referencia:</b> {elevRef.toFixed(1)} m
              </div>
              <div>
                <b>Altitud del destino:</b> {elevDest.toFixed(1)} m
              </div>
            </>
          )}

          {elevationError && <div className='text-danger-500'>{elevationError}</div>}
        </div>
      </div>
    </>
  )
}

export default AddressMap
