export const bulkUnitsAvailable = [
  { label: 'Gramo', key: 'gr', value: 1 },
  { label: 'Onza', key: 'oz', value: 28.3495 },
  { label: 'Libra', key: 'lb', value: 453.592 }
]
export type BulkUnit = (typeof bulkUnitsAvailable)[number]['key']
