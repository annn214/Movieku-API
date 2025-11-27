// app/models/User.ts
import { Schema, model, type InferSchemaType } from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  provider: { type: String, default: 'local' },
}, { timestamps: true })

userSchema.methods.verifyPassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash)
}

export type User = InferSchemaType<typeof userSchema> & {
  verifyPassword(plain: string): Promise<boolean>
}

export default model<User>('User', userSchema)