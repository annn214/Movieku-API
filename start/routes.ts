/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import './mongo.js'
import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import type { Response } from '@adonisjs/core/http'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'

import AuthController from '#controllers/AuthControllers'
import MoviesController from '#controllers/MovieControllers'
import Auth from '#middleware/auth'   // <-- penting: import kelas middleware

router.group(() => {
  // Auth (public)
  router.post('/auth/register', [AuthController, 'register'])
  router.post('/auth/login', [AuthController, 'login'])

  // Profil (protected)
  router.get('/auth/me', [AuthController, 'me']).use((ctx, next) => new Auth().handle(ctx, next))

  // Movies
  router.get('/movies', [MoviesController, 'index'])
  router.get('/movies/:id', [MoviesController, 'show'])
  router.post('/movies', [MoviesController, 'store']).use((ctx, next) => new Auth().handle(ctx, next))
  router.put('/movies/:id', [MoviesController, 'update']).use((ctx, next) => new Auth().handle(ctx, next))
  router.delete('/movies/:id', [MoviesController, 'destroy']).use((ctx, next) => new Auth().handle(ctx, next))
}).prefix('/api')

const frontendRoot = app.makePath('frontend')

function serveFrontend(response: Response, file: string, type = 'text/html') {
  const filePath = join(frontendRoot, file)
  if (!existsSync(filePath)) {
    return response.notFound({ message: 'Halaman tidak ditemukan' })
  }

  response.header('Content-Type', type)
  return response.stream(createReadStream(filePath))
}

const pages = [
  { paths: ['/', '/index', '/index.html'], file: 'index.html' },
  { paths: ['/login', '/login.html'], file: 'login.html' },
  { paths: ['/register', '/register.html'], file: 'register.html' },
  { paths: ['/search', '/search.html'], file: 'search.html' },
  { paths: ['/create', '/create.html'], file: 'create.html' },
  { paths: ['/edit', '/edit.html'], file: 'edit.html' },
  { paths: ['/delete', '/delete.html'], file: 'delete.html' },
]

const assets = [
  { path: '/styles.css', file: 'styles.css', type: 'text/css' },
  { path: '/common.js', file: 'common.js', type: 'application/javascript' },
]

pages.forEach(({ paths, file }) => {
  paths.forEach((path) => {
    router.get(path, async ({ response }) => serveFrontend(response, file))
  })
})

assets.forEach(({ path, file, type }) => {
  router.get(path, async ({ response }) => serveFrontend(response, file, type))
})


