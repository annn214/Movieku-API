// app/models/Movie.ts
import { Schema, model, type InferSchemaType } from 'mongoose'

const movieSchema = new Schema({
  title: { type: String, required: true, index: 'text' },        // text index untuk pencarian
  year: { type: Number },
  genre: [{ type: String, index: true }],                        // array of string (multikey)
  synopsis: { type: String },
  rating: { type: Number, min: 0, max: 10 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export type Movie = InferSchemaType<typeof movieSchema>
export default model<Movie>('Movie', movieSchema)