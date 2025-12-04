import { useLoadScript } from '@react-google-maps/api'

const libraries: ('places' | 'geometry')[] = ['places', 'geometry']

export function useGoogleMaps(language = 'es', region = 'MX') {
  return useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    language,
    region,
    libraries,
    version: 'weekly'
  })
}
