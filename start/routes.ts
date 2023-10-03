/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.group(() => {
    Route.get('/check-installation', 'SettingsController.checkInstallation')
    Route.post('/setup-admin', 'SettingsController.storeInitialUser')
  }).prefix('/setting')

  Route.group(() => {
    Route.group(() => {
      Route.get('/', 'AuthController.signIn')
      Route.delete('/', 'AuthController.signOut').middleware('auth:api')
    }).prefix('/sign')

    Route.get('/check-token', 'AuthController.checkToken').middleware('auth:api')
  }).prefix('/auth')

  Route.group(() => {
    Route.put('/:id', 'LocationsController.update').middleware([
      'auth:api',
      'private:administrator',
    ])
    Route.delete('/:id', 'LocationsController.destroy').middleware([
      'auth:api',
      'private:administrator',
    ])
    Route.get('/:id', 'LocationsController.show').middleware(['auth:api', 'private:administrator'])
    Route.post('/', 'LocationsController.store').middleware(['auth:api', 'private:administrator'])
    Route.get('/', 'LocationsController.index').middleware(['auth:api'])
  }).prefix('/location')

  Route.group(() => {
    Route.put('/change-password', 'UsersController.changePassword').middleware(['auth:api'])
    Route.put('/:id/face', 'UsersController.saveFaceModel').middleware([
      'auth:api',
      'private:administrator',
    ])
    Route.delete('/:id', 'UsersController.destroy').middleware([
      'auth:api',
      'private:administrator',
    ])
    Route.put('/:id', 'UsersController.update').middleware(['auth:api', 'private:administrator'])
    Route.get('/:id', 'UsersController.show').middleware(['auth:api', 'private:administrator'])
    Route.get('/', 'UsersController.index').middleware(['auth:api', 'private:administrator'])
    Route.post('/', 'UsersController.store').middleware(['auth:api', 'private:administrator'])
  }).prefix('/user')

  Route.group(() => {
    Route.put('/in', 'AttendancesController.in').middleware(['auth:api'])
    Route.put('/out', 'AttendancesController.out').middleware(['auth:api'])
    Route.get('/today', 'AttendancesController.today').middleware(['auth:api'])
    Route.get('/history', 'AttendancesController.history').middleware(['auth:api'])
    Route.get('/daily', 'AttendancesController.daily').middleware([
      'auth:api',
      'private:administrator',
    ])
  }).prefix('/attendance')

  Route.get('/stats', 'StatsController.index').middleware(['auth:api', 'private:administrator'])
}).prefix('/api')
