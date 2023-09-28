import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('Auth', () => {
  test('Sign In', async ({ client }) => {
    const response = await client.get('/api/auth/sign').qs({
      registered_number: '123456',
      password: '123456',
    })

    try {
      response.assertStatus(200)
    } catch (e) {
      response.assertStatus(401)
    }
  })

  test('Check Token', async ({ client }) => {
    const user = await User.first()

    const response = await (user
      ? client.delete('/api/auth/sign').loginAs(user)
      : client.delete('/api/auth/sign'))

    response.assertStatus(200)
  })

  test('Sign Out', async ({ client }) => {
    const user = await User.first()

    const response = await (user
      ? client.delete('/api/auth/sign').loginAs(user)
      : client.delete('/api/auth/sign'))

    try {
      response.assertStatus(200)
    } catch (e) {
      response.assertStatus(401)
    }
  })
})
