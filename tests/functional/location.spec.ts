import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Location', () => {
  test('Location store', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')

    assert.isTrue(Boolean(user))

    const response = await client
      .post('/api/location')
      .form({
        name: 'Sadar Office',
        address: 'Jl. Sadar Raya, NO. 65',
        longitude: 106.81359047892053,
        latitude: -6.329794007959758,
      })
      .loginAs(user!)

    response.assertStatus(200)
  })

  test('Location index', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')

    assert.isTrue(Boolean(user))

    const response = await client.get('/api/location').loginAs(user!)

    response.assertStatus(200)
  })

  test('Location show', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')
    const locationToFind = await User.first()

    assert.isTrue(Boolean(user))
    assert.isTrue(Boolean(locationToFind))

    const response = await client.get(`/api/user/${locationToFind!.id}`).loginAs(user!)

    response.assertStatus(200)
  })

  test('Location update', async ({ client, assert }) => {
    const user = await User.findBy('role', 'administrator')
    const locationToFind = await User.first()

    assert.isTrue(Boolean(user))
    assert.isTrue(Boolean(locationToFind))

    const response = await client
      .put('/api/location/' + locationToFind!.id)
      .form({
        name: 'Sadar Office',
        address: 'Jl. Sadar Raya, NO. 65',
        longitude: 106.81359047892053,
        latitude: -6.329794007959758,
      })
      .loginAs(user!)

    response.assertStatus(200)
  })
})
