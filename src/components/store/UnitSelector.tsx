import { Select, SelectItem, type Selection } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { BulkUnits } from '../../schemas/products.schema'
import { bulkUnitsAvailable } from '../../types/products'

type UnitSelectorProps = {
  quantity: number
  baseUnit?: string
  units?: BulkUnits // OBJETO (no array)
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
  const orderMap = useMemo(() => Object.fromEntries(bulkUnitsAvailable.map((u, i) => [u.key, i])) as Record<string, number>, [])

  // Claves desde units + baseUnit (si no estaba)
  const rawKeys = useMemo(() => {
    const fromUnits = Object.keys(units ?? {})
    const maybeBase = baseUnit ? [baseUnit] : []
    return Array.from(new Set([...fromUnits, ...maybeBase]))
  }, [units, baseUnit])

  // Ordenar: gr → oz → lb (desconocidas al final)
  const keys = useMemo(
    () =>
      [...rawKeys].sort((a, b) => {
        const ia = orderMap[a] ?? Number.POSITIVE_INFINITY
        const ib = orderMap[b] ?? Number.POSITIVE_INFINITY
        return ia - ib
      }),
    [rawKeys, orderMap]
  )

  // Opciones con labels
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

  // Selección (controlado/semicontrolado)
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
      classNames={{ trigger: 'bg-white border-black' }}
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
