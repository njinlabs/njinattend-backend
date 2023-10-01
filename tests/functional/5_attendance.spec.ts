import { file } from '@ioc:Adonis/Core/Helpers'
import { test } from '@japa/runner'
import User from 'App/Models/User'
import Drive from '@ioc:Adonis/Core/Drive'

test.group('Attendance', () => {
  test('Save in record', async ({ client, assert }) => {
    const fakeDrive = await Drive.fake()
    const fakeAvatar = await file.generatePng('1mb')
    const user = await User.first()

    assert.isTrue(Boolean(user))

    const response = await client
      .put(`/api/attendance/in`)
      .file('face', fakeAvatar.contents, { filename: fakeAvatar.name })
      .fields({
        latitude: -6.3300833959002,
        longitude: 106.81370747608787,
      })
      .loginAs(user!)

    try {
      response.assertStatus(200)
      assert.isTrue(await fakeDrive.exists(fakeAvatar.name))
    } catch (e) {
      response.assertStatus(422)
    }
  })

  test('Save out record', async ({ client, assert }) => {
    const fakeDrive = await Drive.fake()
    const fakeAvatar = await file.generatePng('1mb')
    const user = await User.first()

    assert.isTrue(Boolean(user))

    const response = await client
      .put(`/api/attendance/out`)
      .file('face', fakeAvatar.contents, { filename: fakeAvatar.name })
      .fields({
        latitude: -6.3300833959002,
        longitude: 106.81370747608787,
      })
      .loginAs(user!)

    try {
      response.assertStatus(200)
      assert.isTrue(await fakeDrive.exists(fakeAvatar.name))
    } catch (e) {
      response.assertStatus(422)
    }
  })

  test('Get today', async ({ client, assert }) => {
    const user = await User.first()

    assert.isTrue(Boolean(user))

    const response = await client.get(`/api/attendance/today`).loginAs(user!)

    try {
      response.assertStatus(200)
    } catch (e) {
      response.assertStatus(404)
    }
  })

  test('Get history', async ({ client, assert }) => {
    const user = await User.first()

    assert.isTrue(Boolean(user))

    const response = await client.get('/api/attendance/history').loginAs(user!)

    response.assertStatus(200)
  })

  test('Get daily', async ({ client, assert }) => {
    const user = await User.query().where('role', 'administrator').first()

    assert.isTrue(Boolean(user))

    const response = await client.get('/api/attendance/daily').loginAs(user!)

    response.assertStatus(200)
  })
})
