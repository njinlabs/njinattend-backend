import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PrivateRoute {
  public async handle(
    { auth, response }: HttpContextContract,
    next: () => Promise<void>,
    roles: string[] = ['administrator']
  ) {
    const user = auth.use('api').user!

    if (!roles.includes(user.role)) {
      return response.methodNotAllowed()
    }

    await next()
  }
}
