// UnitSelector.tsx
import { Select, SelectItem, type Selection } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { BulkUnits } from '../../schemas/products.schema'

type UnitSelectorProps = {
  quantity: number
  baseUnit?: string
  units?: BulkUnits
  value?: string
  onChange?: (unitId: string) => void
  className?: string
}

const LABELS: Record<string, { sing: string; plural: string }> = {
  gr: { sing: 'Gramo', plural: 'Gramos' },
  oz: { sing: 'Onza', plural: 'Onzas' },
  lb: { sing: 'Libra', plural: 'Libras' }
}

const titleCase = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export default function UnitSelector({ quantity, baseUnit, units, value, onChange, className }: UnitSelectorProps) {
  // 1) Solo claves provenientes de units + baseUnit (si no estaba)
  const keys = useMemo(() => {
    console.log(units)

    const fromUnits = Object.keys(units ?? {})
    const maybeBase = baseUnit ? [baseUnit] : []
    return Array.from(new Set([...fromUnits, ...maybeBase]))
  }, [units, baseUnit])

  // 2) Construir opciones usando LABELS solo para los textos (no para agregar claves)
  const options = useMemo(
    () =>
      keys.map((key) => {
        const lbl = LABELS[key]
        const sing = lbl?.sing ?? titleCase(key)
        const plural = lbl?.plural ?? `${titleCase(key)}s`
        return { key, sing, plural }
      }),
    [keys]
  )

  // 3) Fallback de selección
  const firstKey = options[0]?.key
  const [local, setLocal] = useState<string | undefined>(value ?? baseUnit ?? firstKey)
  const selected = value ?? local ?? baseUnit ?? firstKey
  const selectedKeys = selected ? new Set<string>([selected]) : new Set<string>()

  const handleSelection = (keysSel: Selection) => {
    const k = Array.from(keysSel)[0] as string | undefined
    if (!k) return
    onChange?.(k)
    if (value === undefined) setLocal(k)
  }

  return (
    <Select
      label='Unidad'
      size='sm'
      className={className ?? 'w-full md:max-w-[160px]'}
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelection}
      variant='bordered'
      disallowEmptySelection
      isDisabled={options.length === 0}
    >
      {options.map(({ key, sing, plural }) => (
        <SelectItem key={key} textValue={sing}>
          {quantity > 1 ? plural : sing}
        </SelectItem>
      ))}
    </Select>
  )
}
