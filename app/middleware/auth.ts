import type { HttpContext } from '@adonisjs/core/http'
import jwt from 'jsonwebtoken'
const { TokenExpiredError } = jwt
import User from '#models/Users'

/**
 * Payload JWT yang kita definisikan.
 */
interface JwtPayload {
  userId: string
  iat: number // issued at
  exp: number // expiration
}

/**
 * Middleware untuk memverifikasi JWT dan mengautentikasi pengguna.
 * Middleware ini wajib dipasang pada semua endpoint yang membutuhkan token.
 */
export default class Auth {
  /**
   * Mengambil token dari header Authorization (Bearer Token).
   */
  getTokenFromHeader(header?: string): string | null {
    if (!header) return null
    
    // Format: "Bearer <token>"
    const parts = header.split(' ')
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1]
    }
    return null
  }

  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const { request, response } = ctx
    
    // 1. Ambil token dari header Authorization
    const token = this.getTokenFromHeader(request.header('authorization'))
    if (!token) {
      return response.unauthorized({ error: 'Authorization token not provided.' })
    }

    const secret = process.env.JWT_SECRET || 'your-default-secret-key'

    try {
      // 2. Verifikasi token
      const decoded = jwt.verify(token, secret) as JwtPayload
      
      // 3. Cari pengguna berdasarkan userId dari payload token
      const user = await User.findById(decoded.userId)

      if (!user) {
        // Token valid, tapi user tidak ditemukan di database (mungkin sudah dihapus)
        return response.unauthorized({ error: 'Invalid token or user not found.' })
      }

      // 4. Set objek user ke dalam request agar bisa diakses di controller
      // @ts-ignore – Menambahkan properti 'user' ke objek request
      request['user'] = user

      // Lanjutkan ke controller atau middleware berikutnya
      await next()

    } catch (error) {
      // Tangani kesalahan verifikasi JWT (expired, signature invalid, dll.)
      if (error instanceof TokenExpiredError) {
        return response.unauthorized({ error: 'Token has expired.' })
      }
      return response.unauthorized({ error: 'Invalid or malformed token.' })
    }
  }
}
