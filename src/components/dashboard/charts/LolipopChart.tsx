import { useLayoutEffect, useMemo, useRef } from 'react'

import * as am5 from '@amcharts/amcharts5'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'

type DayPoint = {
  day: string // "YYYY-MM-DD"
  count: number
}

type Props<Item> = {
  data?: DayPoint[]
  items?: Item[]
  getDate?: (item: Item) => Date | string
  formatDayLabel?: (dayISO: string) => string
  sort?: 'asc' | 'desc'
  height?: number | string
  className?: string
  bulletRadius?: number
}

function toISODateOnly(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDayToLocalMidnightMs(dayISO: string) {
  // Evita problemas de timezone de new Date("YYYY-MM-DD") (se interpreta UTC en muchos browsers)
  const [y, m, d] = dayISO.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime()
}

export default function LollipopByDayChart<Item>({
  data,
  items,
  getDate,
  formatDayLabel,
  sort = 'asc',
  height = '100%',
  className,
  bulletRadius = 6
}: Props<Item>) {
  const divRef = useRef<HTMLDivElement | null>(null)

  // 👉 ahora generamos data para DateAxis:
  // date: timestamp (ms), value: count, label: para tooltip/axis
  const chartData: { date: number; value: number; dayISO: string; label: string }[] = useMemo(() => {
    // A) Ya viene agregado por día
    if (data?.length) {
      const normalized = data.map((d) => {
        const dayISO = d.day
        return {
          dayISO,
          date: parseDayToLocalMidnightMs(dayISO),
          value: Number(d.count ?? 0),
          label: formatDayLabel ? formatDayLabel(dayISO) : dayISO
        }
      })

      normalized.sort((a, b) => (sort === 'asc' ? a.date - b.date : b.date - a.date))
      return normalized
    }

    // B) Agrupar items -> dayISO -> count
    if (!items?.length || !getDate) return []

    const map = new Map<string, number>()

    for (const it of items) {
      const raw = getDate(it)
      const d = raw instanceof Date ? raw : new Date(raw)
      if (Number.isNaN(d.getTime())) continue

      const dayISO = toISODateOnly(d)
      map.set(dayISO, (map.get(dayISO) ?? 0) + 1)
    }

    const arr = Array.from(map.entries()).map(([dayISO, count]) => ({
      dayISO,
      date: parseDayToLocalMidnightMs(dayISO),
      value: count,
      label: formatDayLabel ? formatDayLabel(dayISO) : dayISO
    }))

    arr.sort((a, b) => (sort === 'asc' ? a.date - b.date : b.date - a.date))
    return arr
  }, [data, items, getDate, formatDayLabel, sort])

  useLayoutEffect(() => {
    const el = divRef.current
    if (!el) return

    const root = am5.Root.new(el)

    root._logo?.dispose()
    root.setThemes([am5themes_Animated.new(root)])

    // ✅ verticalLayout ayuda a que el scrollbar “preview” se vea bien separado
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelY: 'zoomX',
        pinchZoomX: true,
        layout: root.verticalLayout,
        paddingLeft: 0
      })
    )

    // Cursor
    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, { behavior: 'none' }))
    cursor.lineY.set('visible', false)

    // ✅ DateAxis en X
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        maxDeviation: 0.5,
        groupData: true,
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 60,
          minorGridEnabled: true,
          pan: 'zoom'
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 1,
        renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    // ✅ Series: ColumnSeries (stick) usando valueXField (date)
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueYField: 'value',
        valueXField: 'date',
        adjustBulletPosition: false,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{label}: {valueY}'
        })
      })
    )

    // stick del lollipop
    series.columns.template.setAll({
      width: 2, // con DateAxis conviene usar px en vez de 0.5
      strokeOpacity: 1
    })

    // circulito arriba
    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Circle.new(root, {
          radius: bulletRadius,
          fill: series.get('fill')
        })
      })
    })

    // Set data
    series.data.setAll(chartData)

    // ✅ “Selector de días” tipo preview: XYChartScrollbar
    const scrollbarX = am5xy.XYChartScrollbar.new(root, {
      orientation: 'horizontal',
      height: 50
    })
    chart.set('scrollbarX', scrollbarX)

    const sbxAxis = scrollbarX.chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {
          opposite: false,
          strokeOpacity: 0,
          minorGridEnabled: true,
          minGridDistance: 60
        })
      })
    )

    const sbyAxis = scrollbarX.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    )

    const sbSeries = scrollbarX.chart.series.push(
      am5xy.LineSeries.new(root, {
        xAxis: sbxAxis,
        yAxis: sbyAxis,
        valueYField: 'value',
        valueXField: 'date'
      })
    )
    sbSeries.data.setAll(chartData)

    // (Opcional) pre-zoom a los últimos N días si quieres
    // if (chartData.length >= 2) {
    //   const last = chartData[chartData.length - 1].date
    //   const first = chartData[Math.max(0, chartData.length - 14)].date
    //   xAxis.zoomToValues(first, last)
    // }

    series.appear(800)
    chart.appear(800, 80)

    return () => root.dispose()
  }, [chartData, bulletRadius])

  return <div ref={divRef} className={className} style={{ height, width: '100%' }} />
}
