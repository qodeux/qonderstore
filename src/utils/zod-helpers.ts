// utils/zod-helpers.ts
import { z } from 'zod'

/** String obligatorio real (sin espacios y no vacío) */
export const requiredString = (message = 'Requerido') => z.string().trim().min(1, message)

/**
 * String opcional normalizado:
 * - Si el usuario deja '' → lo convertimos a undefined
 * - Si escribe algo → trim + min
 */
export const optionalString = (min = 1, message = 'Valor inválido') =>
  z.union([z.string().trim().min(min, message), z.literal('')]).transform((v) => (v === '' ? undefined : v))

/** Código Postal de 5 dígitos (sólo valida; usa RHF para quitar espacios) */
export const postalCode5 = (message = 'Debe ser un CP de 5 dígitos') =>
  z
    .string()
    .trim()
    .regex(/^\d{5}$/, message)

export const emptyToNull = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (v === '' ? null : v), schema.nullable())
