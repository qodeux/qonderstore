import type { UseFormReturn } from 'react-hook-form'

export type Step = {
  title: string
  content: React.FC<any> // permitirá pasar props al paso de Confirmación
  form?: UseFormReturn<any>
}

// export type Step = {
//   title: string
//   content: React.FC<Record<string, unknown>> // permitirá pasar props al paso de Confirmación
//   form?: UseFormReturn<FieldValues>
// }
