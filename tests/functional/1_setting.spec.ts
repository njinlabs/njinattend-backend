import { test } from '@japa/runner'
import Drive from '@ioc:Adonis/Core/Drive'
import { file } from '@ioc:Adonis/Core/Helpers'

test.group('Setting', () => {
  test('Check installation', async ({ client }) => {
    const response = await client.get('/api/setting/check-installation')

    try {
      response.assertStatus(405)
    } catch (e) {
      response.assertStatus(200)
    }
  })

  test('Store initial user', async ({ client, assert }) => {
    const fakeDrive = await Drive.fake()
    const fakeAvatar = await file.generatePng('1mb')

    const response = await client
      .post('/api/setting/setup-admin')
      .fields({
        registered_number: '123456',
        password: '123456',
        fullname: 'Akbar Aditama',
        gender: 'male',
        birthday: '2000-08-11',
        department: 'DevOps',
      })
      .file('avatar', fakeAvatar.contents, { filename: fakeAvatar.name })

    try {
      response.assertStatus(200)
      assert.isTrue(await fakeDrive.exists(fakeAvatar.name))

      Drive.restore()
    } catch (e) {
      response.assertStatus(405)
    }
  })
})
