import { test } from '@japa/runner'
import Drive from '@ioc:Adonis/Core/Drive'
import { file } from '@ioc:Adonis/Core/Helpers'
import User from 'App/Models/User'

test.group('User', () => {
  test('User store', async ({ client, assert }) => {
    const fakeDrive = await Drive.fake()
    const fakeAvatar = await file.generatePng('1mb')
    const user = await User.findBy('role', 'administrator')

    assert.isTrue(Boolean(user))

    const response = await client
      .post('/api/user')
      .fields({
        registered_number: '2018210068',
        password: '123456',
        fullname: 'Akbar Aditama',
        gender: 'male',
        birthday: '2000-08-11',
        department: 'DevOps',
        role: 'user',
      })
      .file('avatar', fakeAvatar.contents, { filename: fakeAvatar.name })
      .loginAs(user!)

    try {
      response.assertStatus(200)
      assert.isTrue(await fakeDrive.exists(fakeAvatar.name))

      Drive.restore()
    } catch (e) {
      response.assertStatus(422)
    }
  })

  test('User index', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')

    assert.isTrue(Boolean(user))

    const response = await client.get('/api/user').loginAs(user!)

    response.assertStatus(200)
  })

  test('User show', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')
    const userToFind = await User.findBy('role', 'user')

    assert.isTrue(Boolean(user))
    assert.isTrue(Boolean(userToFind))

    const response = await client.get(`/api/user/${userToFind!.id}`).loginAs(user!)

    response.assertStatus(200)
  })

  test('User update', async ({ client, assert }) => {
    const fakeDrive = await Drive.fake()
    const fakeAvatar = await file.generatePng('1mb')
    const user = await User.findBy('role', 'administrator')
    const userToFind = await User.findBy('role', 'user')

    assert.isTrue(Boolean(user))

    const response = await client
      .put(`/api/user/${userToFind?.id || 2}`)
      .fields({
        password: '123456',
        fullname: 'Akbar Aditama',
        gender: 'male',
        birthday: '2000-08-11',
        department: 'DevOps',
        role: 'user',
      })
      .file('avatar', fakeAvatar.contents, { filename: fakeAvatar.name })
      .loginAs(user!)

    try {
      response.assertStatus(200)
      assert.isTrue(await fakeDrive.exists(fakeAvatar.name))

      Drive.restore()
    } catch (e) {
      response.assertStatus(404)
    }
  })

  test('User destroy', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')
    const userToFind = await User.findBy('role', 'user')

    assert.isTrue(Boolean(user))
    assert.isTrue(Boolean(userToFind))

    const response = await client.delete(`/api/user/${userToFind!.id}`).loginAs(user!)

    response.assertStatus(200)
  })
})
