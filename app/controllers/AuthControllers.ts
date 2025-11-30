// app/controllers/AuthController.ts
import type { HttpContext } from '@adonisjs/core/http'
import jwt, { type SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '#models/Users'

export default class AuthController {
  // REGISTER
  async register({ request, response }: HttpContext) {
    const { name, email, password } = request.only(['name', 'email', 'password'])

    if (!email || !password) {
      return response.badRequest({ error: 'email & password wajib' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return response.conflict({ error: 'Email sudah terdaftar' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const created = await User.create({ name, email, passwordHash, provider: 'local' })

    return response.created({ id: created._id, email: created.email, name: created.name })
  }

  // LOGIN
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findOne({ email })
    if (!user) return response.unauthorized({ error: 'Email atau password salah' })

    const ok = await user.verifyPassword(password)
    if (!ok) return response.unauthorized({ error: 'Email atau password salah' })

    // pastikan tipe sesuai overload
    type JwtExpires = NonNullable<SignOptions['expiresIn']>
    const raw = process.env.JWT_EXPIRES
    const expiresIn = (raw && /^\d+$/.test(raw) ? Number(raw) : (raw || '1d')) as JwtExpires
    const secret = process.env.JWT_SECRET || 'your-default-secret-key'
    const token = jwt.sign({ userId: String(user._id) }, secret, { expiresIn })

    return {
      token: { type: 'bearer', token },
      user: { id: user._id, email: user.email, name: user.name },
    }
  }

  // ME
  async me({ request }: HttpContext) {
    // @ts-ignore – diset di middleware
    const user = request.user
    return { id: user._id, email: user.email, name: user.name }
  }
}
