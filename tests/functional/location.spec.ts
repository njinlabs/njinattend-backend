import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Location', () => {
  test('Location Store', async ({ client, assert }) => {
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
})
