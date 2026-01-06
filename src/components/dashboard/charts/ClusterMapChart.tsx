import * as am5 from '@amcharts/amcharts5'
import * as am5map from '@amcharts/amcharts5/map'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import am5geodata_mexico from '@amcharts/amcharts4-geodata/mexicoHigh'

export type ClusterCity = {
  title: string
  latitude: number
  longitude: number
}

type Props = {
  cities: ClusterCity[]
  height?: number | string
  className?: string
}

export default function ClusterMapChart({ cities, height = 520, className }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<am5.Root | null>(null)
  const [ready, setReady] = useState(false)

  const safeCities = useMemo(() => cities ?? [], [cities])

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    setReady(false)

    if (rootRef.current) {
      rootRef.current.dispose()
      rootRef.current = null
    }

    const root = am5.Root.new(el)
    root._logo?.dispose()
    rootRef.current = root

    root.setThemes([am5themes_Animated.new(root)])
    const mexicoBounds = am5map.getGeoBounds(am5geodata_mexico as any)

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'translateX',
        panY: 'translateY',
        projection: am5map.geoMercator(),
        homeZoomLevel: 1,
        minZoomLevel: 3.3666768850557656,
        //zoomStep: 1.5,

        homeGeoPoint: { latitude: 23.6345, longitude: -102.5528 }
      })
    )

    const zoomControl = chart.set('zoomControl', am5map.ZoomControl.new(root, {}))
    zoomControl.homeButton.set('visible', true)

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_mexico as any
      })
    )

    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0xdadada)
    })

    const pointSeries = chart.series.push(am5map.ClusteredPointSeries.new(root, {}))

    pointSeries.set('clusteredBullet', (r) => {
      const container = am5.Container.new(r, { cursorOverStyle: 'pointer' })

      container.children.push(am5.Circle.new(r, { radius: 8, tooltipY: 0, fill: am5.color(0xff8c00) }))
      container.children.push(am5.Circle.new(r, { radius: 12, fillOpacity: 0.3, tooltipY: 0, fill: am5.color(0xff8c00) }))
      container.children.push(am5.Circle.new(r, { radius: 16, fillOpacity: 0.3, tooltipY: 0, fill: am5.color(0xff8c00) }))

      container.children.push(
        am5.Label.new(r, {
          centerX: am5.p50,
          centerY: am5.p50,
          fill: am5.color(0xffffff),
          populateText: true,
          fontSize: '8',
          text: '{value}'
        })
      )

      container.events.on('click', (e) => {
        pointSeries.zoomToCluster(e.target.dataItem as any)
      })

      return am5.Bullet.new(r, { sprite: container })
    })

    pointSeries.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 6,
        tooltipY: 0,
        fill: am5.color(0xff8c00),
        tooltipText: '{title}'
      })
      return am5.Bullet.new(root, { sprite: circle })
    })

    pointSeries.data.setAll(
      safeCities.map((c) => ({
        geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
        title: c.title
      }))
    )

    const fitToMexico = () => {
      if (!mexicoBounds) return

      // Fit instantáneo al cargar
      chart.zoomToGeoBounds(mexicoBounds, 0)

      // espera a que el chart aplique el zoom y actualice center/zoomLevel
      requestAnimationFrame(() => {
        const center = chart.get('centerGeoPoint' as any)
        const zoom = chart.get('zoomLevel')

        console.log(zoom)

        if (center) chart.set('homeGeoPoint', center)
        if (zoom != null) chart.set('homeZoomLevel', zoom)

        setReady(true)
      })
    }

    // ✅ Fit sólido usando geoJSON bounds
    polygonSeries.events.once('datavalidated', () => {
      requestAnimationFrame(() => {
        root.resize()
        fitToMexico()
      })
    })

    // (opcional) puedes dejarlo o quitarlo; no afecta el fit ahora
    chart.appear(300, 10)

    return () => {
      root.dispose()
      rootRef.current = null
    }
  }, [safeCities])

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        width: '100%',
        height,
        opacity: ready ? 1 : 0,
        transition: 'opacity 120ms ease'
      }}
    />
  )
}
