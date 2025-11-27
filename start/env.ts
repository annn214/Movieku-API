import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  
  // --- VARIABEL BARU DAN TAMBAHAN YANG DIPERLUKAN ---

  // Konfigurasi MongoDB (Digunakan di start/mongo.ts)
  MONGO_URI: Env.schema.string(),
  MONGO_DB_NAME: Env.schema.string(), // Ditambahkan berdasarkan screenshot .env Anda
  
  // Konfigurasi JWT (Digunakan di AuthControllers.ts)
  JWT_SECRET: Env.schema.string(),
  JWT_EXPIRES: Env.schema.string(), // Berupa string: '1d', '2h', dll.
  
  // Konfigurasi CORS (Ditambahkan berdasarkan screenshot .env Anda)
  // Empty string allowed by making this optional string
  CORS_ORIGIN: Env.schema.string.optional(), // Memungkinkan nilai '*'

  // External API Keys (Digunakan di MovieControllers.ts)
  TMDB_API_KEY: Env.schema.string.optional(), // Allow empty by making this optional
})
