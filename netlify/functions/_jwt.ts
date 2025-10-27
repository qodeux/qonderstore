import { decodeJwt, errors, jwtVerify, SignJWT, type JWTPayload } from 'jose'
import { formatDate } from '../../src/utils/date'

const ENC = new TextEncoder()

function isJWTExpiredError(error: unknown): error is errors.JWTExpired & { expiredAt?: Date } {
  return error instanceof errors.JWTExpired
}

function getKey() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET')
  return ENC.encode(secret)
}
export async function signEmailToken(payload: JWTPayload, exp: string | number = '30m') {
  return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt().setExpirationTime(exp).sign(getKey())
}

export async function verifyEmailToken<T extends JWTPayload = JWTPayload>(token: string) {
  try {
    const { payload } = await jwtVerify<T>(token, getKey(), {
      clockTolerance: '30s'
    })
    return payload
  } catch (error: unknown) {
    //console.log(error)

    if (isJWTExpiredError(error)) {
      // Ahora TypeScript sabe que puede tener expiredAt

      const expiredAt = error.expiredAt ?? new Date((decodeJwt(token).exp ?? 0) * 1000)

      console.warn('Token expirado:', formatDate(expiredAt.toISOString(), 'full'))
      throw new Error('Token expirado')
    }

    if (error instanceof errors.JWSInvalid) {
      throw new Error('Token inválido')
    }

    if (
      error instanceof errors.JWTInvalid ||
      error instanceof errors.JWSSignatureVerificationFailed ||
      error instanceof errors.JWTClaimValidationFailed // aud/iss/nbf no cumplen
    ) {
      throw new Error('Token inválido')
    }

    throw new Error('Error al verificar token')
  }
}

export function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  }
}
