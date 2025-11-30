// start/mongo.ts
import mongoose from 'mongoose'

const uri = process.env.MONGO_URI as string

let connected = false
export async function ensureMongo() {
  if (connected) return
  await mongoose.connect(uri)
  connected = true
  console.log('[mongo] connected')
}

ensureMongo().catch((e) => {
  console.error('[mongo] connection error:', e)
  process.exit(1)
})
