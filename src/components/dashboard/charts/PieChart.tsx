import * as am5 from '@amcharts/amcharts5'
import * as am5percent from '@amcharts/amcharts5/percent'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'
import { useLayoutEffect, useMemo, useRef } from 'react'

export type PieChartDatum = {
  value: number
  category: string
}

type PieChartProps = {
  data: PieChartDatum[]
  height?: number | string
  className?: string
  showLegend?: boolean
}

export default function PieChart({ data, height = 320, className, showLegend = true }: PieChartProps) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<am5.Root | null>(null)

  const safeData = useMemo(() => data ?? [], [data])

  useLayoutEffect(() => {
    if (!divRef.current) return

    // Evita duplicados en hot reload / remount
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
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout
      })
    )

    // Series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category'
      })
    )

    series.labels.template.set('visible', false)
    series.ticks.template.set('visible', false)

    // Data
    series.data.setAll(safeData)

    // Legend
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          marginTop: 15,
          marginBottom: 15
        })
      )

      legend.data.setAll(series.dataItems)
    }

    // Animate
    series.appear(1000, 100)

    return () => {
      root.dispose()
      rootRef.current = null
    }
  }, [safeData, showLegend])

  return <div ref={divRef} className={className} style={{ width: '100%', height }} />
}
