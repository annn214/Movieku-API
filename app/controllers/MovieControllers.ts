import type { HttpContext } from '@adonisjs/core/http'
import Movie from '#models/Movie'
import axios from 'axios' // Pastikan Anda sudah menginstal 'axios' atau gunakan 'fetch'

// --- KONFIGURASI API EKSTERNAL ---
// TODO: Ganti dengan URL dan API KEY Anda yang sebenarnya di .env
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

/**
 * [INTEGRASI API EKSTERNAL KE-1]
 * Mengambil informasi film tambahan (poster, rating, overview) dari TMDb
 * berdasarkan ID TMDb.
 */
async function fetchTmdbDetails(tmdbId: number) {
  if (!TMDB_API_KEY) return null
  
  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    const response = await axios.get(url)
    const data = response.data
    
    return {
      tmdbId: data.id,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      tagline: data.tagline,
      tmdbOverview: data.overview,
      tmdbRating: data.vote_average,
      releaseDate: data.release_date,
    }
  } catch (error) {
    console.error('Error fetching from TMDb:', error.message)
    return null
  }
}

/**
 * [INTEGRASI API EKSTERNAL KE-2]
 * Mencari film di TMDb berdasarkan judul.
 */
async function searchTmdbMovies(query: string) {
  if (!TMDB_API_KEY) return []
  
  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
    const response = await axios.get(url)
    return response.data.results.slice(0, 5).map((movie: any) => ({
      tmdbId: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      tmdbPoster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
    }))
  } catch (error) {
    console.error('Error searching TMDb:', error.message)
    return []
  }
}

export default class MoviesController {
  // GET /api/movies?q=&genre=&page=&limit=
  async index({ request }: HttpContext) {
    const q = request.input('q') as string | undefined
    const genre = request.input('genre') as string | undefined
    const page = Number(request.input('page') || 1)
    const limit = Math.min(Number(request.input('limit') || 10), 50)

    const filter: any = {}
    if (q) filter.$text = { $search: q }
    if (genre) filter.genre = { $in: genre.split(',').map((g) => g.trim()) }

    const skip = (page - 1) * limit

    // Mengambil data dari database lokal
    const cursor = Movie.find(filter, q ? { score: { $meta: 'textScore' } } : undefined)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const [localItems, total] = await Promise.all([
      cursor.exec(),
      Movie.countDocuments(filter),
    ])

    let tmdbResults = []

    // [INTEGRASI API KE-2 DIGUNAKAN DI SINI]
    if (q) {
      // Jika ada query, cari juga di TMDb untuk hasil eksternal
      tmdbResults = await searchTmdbMovies(q)
    }

    return {
      data: localItems,
      meta: { total, perPage: limit, currentPage: page },
      tmdb_suggestions: tmdbResults, // Menampilkan hasil dari API eksternal
    }
  }

  async show({ params, response }: HttpContext) {
    const movie = await Movie.findById(params.id)
    if (!movie) return response.notFound({ error: 'Movie not found' })

    // [INTEGRASI API KE-1 DIGUNAKAN DI SINI]
    // Untuk tujuan demo, asumsikan kita menyimpan ID TMDb di properti 'tmdbId' film
    // Anda perlu memodifikasi model Movie.ts dan controller store() untuk menyimpan ID TMDb saat membuat film baru.
    // Saat ini, kita hanya melakukan pencarian berdasarkan judul (hanya untuk demo).
    const tmdbResults = await searchTmdbMovies(movie.title)
    let tmdbDetails = null

    if (tmdbResults.length > 0) {
      // Ambil detail lengkap dari film pertama yang cocok
      tmdbDetails = await fetchTmdbDetails(tmdbResults[0].tmdbId)
    }

    return {
      ...movie.toObject(),
      external_details: tmdbDetails, // Menambahkan detail dari API eksternal
    }
  }

  async store({ request, response }: HttpContext) {
    const body = request.only(['title','year','genre','synopsis','rating'])
    if (!body.title) return response.badRequest({ error: 'title wajib' })
    if (body.rating && (body.rating < 0 || body.rating > 10)) {
      return response.badRequest({ error: 'rating 0–10' })
    }
    // @ts-ignore
    const user = request['user']
    const doc = await Movie.create({ ...body, createdBy: user._id })
    return response.created(doc)
  }

  async update({ params, request, response }: HttpContext) {
    const body = request.only(['title','year','genre','synopsis','rating'])
    // @ts-ignore
    const user = request['user']
    // Tambahkan filter kepemilikan agar user hanya bisa update film miliknya
    const movie = await Movie.findOneAndUpdate(
      { _id: params.id, createdBy: user._id },
      body, 
      { new: true }
    )
    if (!movie) return response.notFound({ error: 'Movie not found or unauthorized' })
    return movie
  }
  
  async destroy({ params, response }: HttpContext) {
    // @ts-ignore
    const user = request['user']
    // Tambahkan filter kepemilikan agar user hanya bisa hapus film miliknya
    const result = await Movie.deleteOne({ _id: params.id, createdBy: user._id })
    
    if (result.deletedCount === 0) {
      return response.notFound({ error: 'Movie not found or unauthorized' })
    }
    return response.noContent()
  }
}