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


