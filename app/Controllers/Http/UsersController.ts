import { Attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import FaceApi from 'App/Services/FaceApi'
import Drive from '@ioc:Adonis/Core/Drive'
import Face from 'App/Models/Face'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Hash from '@ioc:Adonis/Core/Hash'

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

  public async index({ request }: HttpContextContract) {
    const { page = 1, search } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
        search: schema.string.optional(),
      }),
    })

    const limit = 20
    const offset = (page - 1) * limit

    const usersQuery = User.query()

    if (search)
      usersQuery.where((query) =>
        query.whereILike('fullname', `%${search}%`).orWhereILike('registered_number', `%${search}%`)
      )

    const usersCount = await usersQuery.clone().count('* as total')
    const users = await usersQuery.clone().preload('face').offset(offset).limit(limit)

    return {
      page_count: Math.ceil(Number(usersCount[0].$extras.total) / limit),
      rows: users.map((user) => user.serialize()),
    }
  }

  public async show({ params }: HttpContextContract) {
    const user = await User.findOrFail(params.id)

    return user.serialize()
  }

  public async destroy({ params }: HttpContextContract) {
    const user = await User.findOrFail(params.id)
    await user.delete()

    return user.serialize()
  }

  public async update({ request, params }: HttpContextContract) {
    const user = await User.findOrFail(params.id)

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
        registered_number: schema.string.optional({}, [
          rules.unique({
            table: 'users',
            column: 'registered_number',
          }),
        ]),
        password: schema.string.optional(),
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

    if (registeredNumber) user.registeredNumber = registeredNumber
    user.fullname = fullname
    user.gender = gender as 'male' | 'female'
    user.birthday = birthday
    user.role = role as 'administrator' | 'user'
    user.department = department

    if (password) user.password = password
    if (avatar) user.avatar = Attachment.fromFile(avatar)

    await user.save()

    return user.serialize()
  }

  public async saveFaceModel({ request, params, response }: HttpContextContract) {
    const user = await User.findOrFail(params.id)

    const { face } = await request.validate({
      schema: schema.create({
        face: schema.file({
          extnames: ['jpg', 'png'],
        }),
      }),
    })

    const faceDescriptor = await FaceApi.tranformToDescriptor(face.tmpPath!)
    if (!faceDescriptor) return response.unprocessableEntity()

    const faceFile = new Attachment({
      extname: 'json',
      mimeType: 'application/json',
      size: Buffer.from(faceDescriptor.toString()).length,
      name: `${cuid()}.json`,
    })

    faceFile.isPersisted = true

    return await Database.transaction(async (trx) => {
      const faceModel = await Face.updateOrCreate(
        {
          userId: user.id,
        },
        {
          file: faceFile,
        },
        {
          client: trx,
        }
      )

      await Drive.put(faceFile.name, faceDescriptor.toString())

      return faceModel.serialize()
    })
  }

  public async changePassword({ auth, request, response }: HttpContextContract) {
    const { old_password: oldPassword, new_password: newPassword } = await request.validate({
      schema: schema.create({
        new_password: schema.string(),
        old_password: schema.string(),
      }),
    })

    let passed: boolean = false
    const user = auth.use('api').user!
    if (user) {
      if (await Hash.verify(user.password, oldPassword)) {
        passed = true
      }
    }

    if (passed) {
      user.password = newPassword
      await user.save()

      return user.serialize()
    }

    return response.unauthorized()
  }
}
