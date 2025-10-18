import { z } from 'zod'

// 3 letras (moral) o 4 letras (física) + YY + MM + DD + homoclave (3)
const RFC_REGEX = /^(?:[A-ZÑ&]{3}|[A-ZÑ&]{4})\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/

/** Heurística para convertir YY → 19xx/20xx (no permite fechas futuras). */
function expandYear(yy: number) {
  const now = new Date()
  const currentYY = now.getFullYear() % 100
  // Si es <= año actual → 20YY; si no → 19YY
  return yy <= currentYY ? 2000 + yy : 1900 + yy
}

export const rfcSchema = z
  .string()
  .min(1, 'Dato Requerido')
  .transform((s) => s.trim().toUpperCase().replaceAll('-', '')) // normaliza
  .refine((s) => RFC_REGEX.test(s), { message: 'RFC con formato inválido' })
  .superRefine((s, ctx) => {
    // Posición de la fecha depende de si es moral (3 letras) o física (4 letras)
    const isFisica = s.length === 13 // 4 + 6 + 3
    const dateStart = isFisica ? 4 : 3

    const yy = Number(s.slice(dateStart, dateStart + 2))
    const mm = Number(s.slice(dateStart + 2, dateStart + 4))
    const dd = Number(s.slice(dateStart + 4, dateStart + 6))

    const fullYear = expandYear(yy)
    const date = new Date(fullYear, mm - 1, dd)

    // Valida fecha real (coinciden componentes) y no futura
    const sameDate = date.getFullYear() === fullYear && date.getMonth() === mm - 1 && date.getDate() === dd

    if (!sameDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Fecha de RFC inválida' })
      return
    }

    const today = new Date()
    if (date > today) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha del RFC no puede ser futura' })
    }
  })
