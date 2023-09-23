import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  public async signIn({ request, auth, response }: HttpContextContract) {
    const { registered_number: registeredNumber, password } = await request.validate({
      schema: schema.create({
        registered_number: schema.string(),
        password: schema.string(),
      }),
    })

    let passed: boolean = false
    const user = await User.findBy('registered_number', registeredNumber)
    if (user) {
      if (await Hash.verify(user.password, password)) {
        passed = true
      }
    }

    if (passed) {
      const { token } = await auth.use('api').generate(user!)

      return {
        ...user?.serialize(),
        token,
      }
    }

    return response.unauthorized()
  }
}
