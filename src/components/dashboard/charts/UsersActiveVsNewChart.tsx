import * as am5 from '@amcharts/amcharts5'
import am5locales_es_ES from '@amcharts/amcharts5/locales/es_ES'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { useLayoutEffect, useMemo, useRef } from 'react'

export type UsersDay = {
  day: string // "YYYY-MM-DD"
  activeUsers: number
  newUsers: number
}

type Props = {
  data: UsersDay[]
  height?: number | string
  className?: string
  newUsersHeightPct?: number // % de altura para barras dentro del panel principal
  defaultRange?: 'week' | 'month' | 'all'
}

function parseDayToLocalMidnightMs(dayISO: string) {
  const [y, m, d] = dayISO.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime()
}

export default function UsersActiveVsNewChart({ data, height = 420, className, newUsersHeightPct = 22, defaultRange = 'week' }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null)

  const chartData = useMemo(() => {
    const arr = (data ?? []).map((d) => ({
      Date: parseDayToLocalMidnightMs(d.day),
      activeUsers: Number(d.activeUsers ?? 0),
      newUsers: Number(d.newUsers ?? 0)
    }))
    arr.sort((a, b) => a.Date - b.Date)
    return arr
  }, [data])

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    const root = am5.Root.new(el)
    root._logo?.dispose()
    root.setThemes([am5themes_Animated.new(root)])
    root.locale = am5locales_es_ES

    // Números con separadores
    root.numberFormatter.set('numberFormat', '#,###')

    // Chart base
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        paddingRight: 10
      })
    )

    // X Axis (fechas)
    const dateAxis = chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          pan: 'zoom',
          minorGridEnabled: true
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    // Y Axis principal (usuarios activos)
    const activeAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
        extraMin: 0.1
      })
    )

    // Línea: Activos
    const activeSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Usuarios activos',
        xAxis: dateAxis,
        yAxis: activeAxis,
        valueXField: 'Date',
        valueYField: 'activeUsers',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: 'Activos: {valueY.formatNumber("#,###")}'
        })
      })
    )
    activeSeries.strokes.template.setAll({ strokeWidth: 2 })
    activeSeries.data.setAll(chartData)

    // “Sub-eje” para barras (usuarios nuevos) pegado abajo
    const newAxisRenderer = am5xy.AxisRendererY.new(root, { inside: true })
    newAxisRenderer.labels.template.set('forceHidden', true)
    newAxisRenderer.grid.template.set('forceHidden', true)

    const newUsersAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(newUsersHeightPct),
        y: am5.percent(100),
        centerY: am5.percent(100),
        min: 0,
        maxPrecision: 0,
        renderer: newAxisRenderer
      })
    )

    // Barras: Nuevos
    const newSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Usuarios nuevos',
        clustered: false,
        xAxis: dateAxis,
        yAxis: newUsersAxis,
        valueXField: 'Date',
        valueYField: 'newUsers',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: 'Nuevos: {valueY.formatNumber("#,###")}'
        })
      })
    )
    newSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5
    })
    newSeries.data.setAll(chartData)

    // Cursor + snap a la línea (más “stock-like”)
    chart.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        xAxis: dateAxis,
        yAxis: activeAxis,
        snapToSeries: [activeSeries]
      })
    )

    // Scrollbar (mini chart + selector)
    const scrollbar = chart.set(
      'scrollbarX',
      am5xy.XYChartScrollbar.new(root, {
        orientation: 'horizontal',
        height: 55
      })
    )

    const sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {})
      })
    )

    const sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, { renderer: am5xy.AxisRendererY.new(root, {}) }))

    const sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        xAxis: sbDateAxis,
        yAxis: sbValueAxis,
        valueXField: 'Date',
        valueYField: 'activeUsers'
      })
    )
    sbSeries.fills.template.setAll({ visible: true, fillOpacity: 0.2 })
    sbSeries.data.setAll(chartData)

    // Zoom inicial (Semana / Mes / Todo)
    activeSeries.events.once('datavalidated', () => {
      if (!chartData.length) return

      const firstMs = chartData[0].Date
      const lastMs = chartData[chartData.length - 1].Date

      if (defaultRange === 'all') {
        dateAxis.zoomToDates(new Date(firstMs), new Date(lastMs + 24 * 60 * 60 * 1000))
        return
      }

      const end = new Date(lastMs)
      end.setDate(end.getDate() + 1) // incluye el último día completo
      end.setHours(0, 0, 0, 0)

      const start = new Date(lastMs)
      if (defaultRange === 'month') start.setDate(start.getDate() - 29)
      else start.setDate(start.getDate() - 6) // week
      start.setHours(0, 0, 0, 0)

      // Clamp si hay menos data
      const safeStart = new Date(Math.max(start.getTime(), firstMs))
      dateAxis.zoomToDates(safeStart, end)
    })

    // Animaciones
    activeSeries.appear(600)
    newSeries.appear(600)
    chart.appear(600, 60)

    return () => root.dispose()
  }, [chartData, newUsersHeightPct, defaultRange])

  return <div ref={divRef} className={className} style={{ width: '100%', height }} />
}
