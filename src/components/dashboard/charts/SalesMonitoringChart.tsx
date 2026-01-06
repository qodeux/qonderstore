import * as am5 from '@amcharts/amcharts5'
import am5locales_es_ES from '@amcharts/amcharts5/locales/es_ES'
import * as am5stock from '@amcharts/amcharts5/stock'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import * as am5xy from '@amcharts/amcharts5/xy'
import { Button } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

export type SalesDay = {
  day: string // "YYYY-MM-DD"
  totalSales: number
  shipments: number
  avgTicket: number
}

type Props = {
  data: SalesDay[]
  height?: number | string
  className?: string
  volumeHeightPct?: number // % de altura para barras (envíos) dentro del mainPanel
  toolbar?: boolean
}

function parseDayToLocalMidnightMs(dayISO: string) {
  const [y, m, d] = dayISO.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0).getTime()
}

export default function SalesStockLikeChart({ data, height = '95%', className, volumeHeightPct = 22, toolbar = true }: Props) {
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)

  // ✅ evita "multiple Roots"
  const rootRef = useRef<am5.Root | null>(null)

  // ✅ API para botones externos
  const apiRef = useRef<{ shift: (dir: -1 | 1) => void } | null>(null)

  // ✅ para ocultar botones en Max
  const [isMax, setIsMax] = useState(false)

  const chartData = useMemo(() => {
    const arr = (data ?? []).map((d) => ({
      Date: parseDayToLocalMidnightMs(d.day),
      totalSales: Number(d.totalSales ?? 0),
      shipments: Number(d.shipments ?? 0),
      avgTicket: Number(d.avgTicket ?? 0)
    }))
    arr.sort((a, b) => a.Date - b.Date)
    return arr
  }, [data])

  useLayoutEffect(() => {
    const el = chartRef.current
    if (!el) return

    // ✅ si ya había root (por hot reload / crash), disponerlo
    if (rootRef.current) {
      rootRef.current.dispose()
      rootRef.current = null
    }

    const root = am5.Root.new(el)
    rootRef.current = root

    root._logo?.dispose()
    root.setThemes([am5themes_Animated.new(root)])
    root.numberFormatter.set('numberFormat', '#,###.##')
    root.locale = am5locales_es_ES

    const stockChart = root.container.children.push(am5stock.StockChart.new(root, { paddingRight: 0 }))

    // =========================
    // PANEL 1 (ticket promedio) — ARRIBA
    // =========================
    const ticketPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        height: am5.percent(30),
        panX: true,
        panY: false,
        wheelY: 'zoomX'
      })
    )

    const ticketDateAxis = ticketPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, { pan: 'zoom', minorGridEnabled: true }),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    const ticketAxis = ticketPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    const avgSeries = ticketPanel.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Ticket promedio',
        xAxis: ticketDateAxis,
        yAxis: ticketAxis,
        valueYField: 'avgTicket',
        valueXField: 'Date',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: "Ticket promedio: ${valueY.formatNumber('#,###.00')}"
        })
      })
    )
    avgSeries.strokes.template.setAll({ strokeWidth: 2 })
    avgSeries.data.setAll(chartData)

    ticketPanel.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        xAxis: ticketDateAxis,
        yAxis: ticketAxis,
        snapToSeries: [avgSeries]
      })
    )

    // =========================
    // PANEL 2 (ventas + envíos) — ABAJO
    // =========================
    const mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: 'zoomX',
        panX: true,
        panY: false
      })
    )

    const dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: { timeUnit: 'day', count: 1 },
        renderer: am5xy.AxisRendererX.new(root, { pan: 'zoom', minorGridEnabled: true }),
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    const salesAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
        extraMin: 0.1,
        tooltip: am5.Tooltip.new(root, {})
      })
    )

    const salesSeries = mainPanel.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Ventas',
        xAxis: dateAxis,
        yAxis: salesAxis,
        valueYField: 'totalSales',
        valueXField: 'Date',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: "Ventas: {valueY.formatNumber('#,###.##')}"
        })
      })
    )
    salesSeries.strokes.template.setAll({ strokeWidth: 2 })
    salesSeries.data.setAll(chartData)

    // Pre-zoom a última semana
    salesSeries.events.once('datavalidated', () => {
      if (!chartData.length) return

      const lastMs = chartData[chartData.length - 1].Date

      const start = new Date(lastMs)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)

      const end = new Date(lastMs)
      end.setDate(end.getDate() + 1) // incluir último día

      dateAxis.zoomToDates(start, end)
      ticketDateAxis.zoomToDates(start, end)
    })

    // Envios (barras tipo volumen)
    const volumeAxisRenderer = am5xy.AxisRendererY.new(root, { inside: true })
    volumeAxisRenderer.labels.template.set('forceHidden', true)
    volumeAxisRenderer.grid.template.set('forceHidden', true)

    const shipmentsAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        height: am5.percent(volumeHeightPct),
        y: am5.percent(100),
        centerY: am5.percent(100),
        min: 0,
        maxPrecision: 0,
        renderer: volumeAxisRenderer
      })
    )

    const shipmentsSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Envíos',
        clustered: false,
        xAxis: dateAxis,
        yAxis: shipmentsAxis,
        valueYField: 'shipments',
        valueXField: 'Date',
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: 'horizontal',
          labelText: 'Envíos: {valueY}'
        })
      })
    )
    shipmentsSeries.columns.template.setAll({ strokeOpacity: 0, fillOpacity: 0.5 })
    shipmentsSeries.data.setAll(chartData)

    stockChart.set('stockSeries', salesSeries)

    mainPanel.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        xAxis: dateAxis,
        yAxis: salesAxis,
        snapToSeries: [salesSeries]
      })
    )

    // =========================
    // Mini chart selector
    // =========================
    const scrollbar = mainPanel.set('scrollbarX', am5xy.XYChartScrollbar.new(root, { orientation: 'horizontal', height: 50 }))
    stockChart.toolsContainer.children.push(scrollbar)

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
        valueYField: 'totalSales',
        valueXField: 'Date'
      })
    )
    sbSeries.fills.template.setAll({ visible: true, fillOpacity: 0.25 })
    sbSeries.data.setAll(chartData)

    // // Sync zoom: main -> ticket
    // dateAxis.events.on('startendchanged', () => {
    //   ticketDateAxis.setAll({
    //     start: dateAxis.get('start'),
    //     end: dateAxis.get('end')
    //   })
    // })

    // =========================
    // Toolbar (built-ins)
    // =========================
    if (toolbar && controlsRef.current) {
      const periodSelector = am5stock.PeriodSelector.new(root, {
        stockChart,
        periods: [
          { timeUnit: 'day', count: 7, name: 'Semana' },
          { timeUnit: 'month', count: 1, name: 'Mes' },
          { timeUnit: 'month', count: 3, name: '3 Meses' },
          { timeUnit: 'month', count: 6, name: '6 Meses' },
          { timeUnit: 'year', count: 1, name: '1 Año' },
          { timeUnit: 'max', name: 'Max' }
        ]
      })

      am5stock.StockToolbar.new(root, {
        stockChart,
        container: controlsRef.current,
        controls: [periodSelector]
      })
    }

    // =========================
    // ✅ Botones externos ◀ ▶ (avanza “una pantalla”)
    // =========================
    const DAY_MS = 24 * 60 * 60 * 1000
    const dataMin = chartData[0]?.Date ?? 0
    const dataMaxEnd = (chartData[chartData.length - 1]?.Date ?? 0) + DAY_MS

    function getSelectionRange() {
      const min = dateAxis.getPrivate('selectionMin') as number | undefined
      const max = dateAxis.getPrivate('selectionMax') as number | undefined
      if (min == null || max == null) return null
      return { min, max, span: Math.max(1, max - min) }
    }

    function zoomToRange(min: number, max: number) {
      dateAxis.zoomToDates(new Date(min), new Date(max))
      ticketDateAxis.zoomToDates(new Date(min), new Date(max))
    }

    function shiftByPages(dir: -1 | 1) {
      const sel = getSelectionRange()
      if (!sel) return

      const delta = sel.span * dir
      let nextMin = sel.min + delta
      let nextMax = sel.max + delta

      if (nextMin < dataMin) {
        nextMin = dataMin
        nextMax = dataMin + sel.span
      }
      if (nextMax > dataMaxEnd) {
        nextMax = dataMaxEnd
        nextMin = dataMaxEnd - sel.span
      }

      zoomToRange(nextMin, nextMax)
    }

    function isMaxSelected() {
      const sel = getSelectionRange()
      if (!sel) return false
      const eps = DAY_MS * 0.25
      return sel.min <= dataMin + eps && sel.max >= dataMaxEnd - eps
    }

    apiRef.current = { shift: shiftByPages }

    const applyMaxFlag = () => setIsMax(isMaxSelected())

    dateAxis.on('start', applyMaxFlag)
    dateAxis.on('end', applyMaxFlag)

    // Animaciones
    avgSeries.appear(800)
    salesSeries.appear(800)
    shipmentsSeries.appear(800)
    ticketPanel.appear(800, 40)
    mainPanel.appear(800, 60)

    return () => {
      apiRef.current = null
      root.dispose()
      rootRef.current = null
    }
  }, [chartData, volumeHeightPct, toolbar])

  return (
    <div className={className} style={{ width: '100%', height }}>
      {/* Barra superior (HTML) */}
      <div className='absolute left-5 right-5 z-10 flex items-center gap-2 ' style={{ padding: 8 }}>
        {/* Aquí vive el StockToolbar */}
        <div ref={controlsRef} className='flex-1' />
        <Button size='sm' isIconOnly onPress={() => apiRef.current?.shift(-1)} isDisabled={isMax}>
          <ChevronLeft />
        </Button>
        <Button size='sm' isIconOnly onPress={() => apiRef.current?.shift(1)} isDisabled={isMax}>
          <ChevronRight />
        </Button>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ width: '100%', height }} className='pt-14' />
    </div>
  )
}
