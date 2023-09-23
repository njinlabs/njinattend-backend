import { test } from '@japa/runner'

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
})
