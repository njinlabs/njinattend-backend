import { test } from '@japa/runner'
import User from 'App/Models/User'

test.group('6 stats', () => {
  test('Get stats', async ({ client, assert }) => {
    const user = await User.query().where('role', 'administrator').first()

    assert.isTrue(Boolean(user))

    const response = await client.get('/api/stats').loginAs(user!)

    response.assertStatus(200)
  })
})
