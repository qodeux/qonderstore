import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { useLayoutEffect, useMemo, useRef } from 'react'

export type VerticalBarBulletDatum = {
  name: string
  steps: number
  pictureSettings?: {
    src: string
  }
}

type Props = {
  data: VerticalBarBulletDatum[]
  height?: number | string
  className?: string
}

export default function VerticalBarBulletChart({ data, height = '100%', className }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<am5.Root | null>(null)

  // (Opcional) para evitar re-montar por referencia diferente si te llega data nueva a cada render
  const safeData = useMemo(() => data ?? [], [data])

  useLayoutEffect(() => {
    if (!divRef.current) return

    // Limpia cualquier instancia previa (por hot reload / remount)
    if (rootRef.current) {
      rootRef.current.dispose()
      rootRef.current = null
    }

    const root = am5.Root.new(divRef.current)
    root._logo?.dispose()
    rootRef.current = root

    root.setThemes([am5themes_Animated.new(root)])

    // Chart
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingBottom: 50,
        paddingTop: 40,
        paddingLeft: 0,
        paddingRight: 0
      })
    )

    // X axis
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minorGridEnabled: true,
      minGridDistance: 60
    })
    xRenderer.grid.template.set('visible', false)

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        paddingTop: 40,
        categoryField: 'name',
        renderer: xRenderer
      })
    )

    // Y axis
    const yRenderer = am5xy.AxisRendererY.new(root, {})
    yRenderer.grid.template.set('strokeDasharray', [3])

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: yRenderer
      })
    )

    // Series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Income',
        xAxis,
        yAxis,
        valueYField: 'steps',
        categoryXField: 'name',
        sequencedInterpolation: true,
        calculateAggregates: true,
        maskBullets: false,
        tooltip: am5.Tooltip.new(root, {
          dy: -30,
          pointerOrientation: 'vertical',
          labelText: '{valueY}'
        })
      })
    )

    series.columns.template.setAll({
      strokeOpacity: 0,
      cornerRadiusBR: 10,
      cornerRadiusTR: 10,
      cornerRadiusBL: 10,
      cornerRadiusTL: 10,
      maxWidth: 50,
      fillOpacity: 0.8
    })

    // Bullets (circle + masked image)
    const circleTemplate = am5.Template.new<am5.Circle>({})

    series.bullets.push((_root, _series, dataItem) => {
      const bulletContainer = am5.Container.new(root, {})

      bulletContainer.children.push(am5.Circle.new(root, { radius: 34 }, circleTemplate))

      const maskCircle = bulletContainer.children.push(am5.Circle.new(root, { radius: 27 }))

      const imageContainer = bulletContainer.children.push(am5.Container.new(root, { mask: maskCircle }))

      imageContainer.children.push(
        am5.Picture.new(root, {
          templateField: 'pictureSettings',
          centerX: am5.p50,
          centerY: am5.p50,
          width: 60,
          height: 60
        })
      )

      return am5.Bullet.new(root, {
        locationY: 0,
        sprite: bulletContainer
      })
    })

    // Heat rules
    series.set('heatRules', [
      {
        dataField: 'valueY',
        min: am5.color(0xe5dc36),
        max: am5.color(0x5faa46),
        target: series.columns.template,
        key: 'fill'
      },
      {
        dataField: 'valueY',
        min: am5.color(0xe5dc36),
        max: am5.color(0x5faa46),
        target: circleTemplate,
        key: 'fill'
      }
    ])

    // Data
    series.data.setAll(safeData as any)
    xAxis.data.setAll(safeData as any)

    // Cursor
    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}))
    cursor.lineX.set('visible', false)
    cursor.lineY.set('visible', false)

    // Animate on load
    series.appear()
    chart.appear(1000, 100)

    return () => {
      root.dispose()
      rootRef.current = null
    }
  }, [safeData])

  return <div ref={divRef} className={className} style={{ width: '100%', height }} />
}
