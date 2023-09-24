import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'

export default class UsersController {
  public async store({ request }: HttpContextContract) {
    const {
      registered_number: registeredNumber,
      password,
      fullname,
      gender,
      birthday,
      avatar,
      department,
      role,
    } = await request.validate({
      schema: schema.create({
        registered_number: schema.string({}, [
          rules.unique({
            table: 'users',
            column: 'registered_number',
          }),
        ]),
        password: schema.string(),
        fullname: schema.string(),
        gender: schema.enum(['male', 'female']),
        birthday: schema.date(),
        avatar: schema.file.optional({
          extnames: ['jpg', 'png'],
        }),
        role: schema.enum(['administrator', 'user']),
        department: schema.string(),
      }),
    })

    const user = await User.create({
      registeredNumber,
      password,
      fullname,
      gender: gender as 'male' | 'female',
      birthday,
      avatar: avatar ? Attachment.fromFile(avatar) : undefined,
      department,
      role: role as 'administrator' | 'user',
    })

    return user.serialize()
  }
}
