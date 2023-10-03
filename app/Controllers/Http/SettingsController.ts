import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class SettingsController {
  public async checkInstallation({ response }: HttpContextContract) {
    const user = await User.first()

    return user ? response.methodNotAllowed() : response.ok({})
  }

  public async storeInitialUser({ response, request, auth }: HttpContextContract) {
    if (await User.first()) {
      return response.methodNotAllowed()
    }

    const {
      registered_number: registeredNumber,
      password,
      fullname,
      gender,
      birthday,
      avatar,
      department,
    } = await request.validate({
      schema: schema.create({
        registered_number: schema.string(),
        password: schema.string(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        birthday: schema.date(),
        avatar: schema.file.optional({
          extnames: ['jpg', 'png'],
        }),
        department: schema.string(),
      }),
    })

    const user = await User.create({
      registeredNumber,
      password,
      fullname,
      gender: gender as 'male' | 'female',
      birthday,
      role: 'administrator',
      avatar: avatar ? Attachment.fromFile(avatar) : undefined,
      department,
    })

    const { token } = await auth.use('api').generate(user)

    return {
      ...user.serialize(),
      token,
    }
  }
}
