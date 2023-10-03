import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Location from 'App/Models/Location'
import User from 'App/Models/User'
import FaceApi from 'App/Services/FaceApi'
import Drive from '@ioc:Adonis/Core/Drive'
import Attendance from 'App/Models/Attendance'
import { DateTime } from 'luxon'

export default class AttendancesController {
  private async validateInput(user: User, facePath: string, latitude: number, longitude: number) {
    await user.load('face')
    const locations = await Location.query()
      .select(
        'locations.*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude'),
        Database.st()
          .distance(
            'locations.geom',
            Database.st().geomFromText(`Point(${longitude} ${latitude})`, 4326)
          )
          .as('distance')
      )
      .orderBy('distance', 'asc')
      .limit(1)

    if (!locations.length) {
      throw new Error("Can't found location")
    }

    locations[0].setCurrentLatLng(latitude, longitude)
    if (locations[0].serialize().distance >= 0.5) {
      throw new Error("Can't reach attend point")
    }

    if (!user.face) {
      throw new Error('Face model not registered yet')
    }

    const faceRef = FaceApi.loadFromString(
      (await Drive.get(user.face.file.name)).toString()
    ).descriptor
    const faceQuery = (await FaceApi.tranformToDescriptor(facePath))?.descriptor

    if (!faceQuery) {
      throw new Error('Face not detected')
    }

    if (!FaceApi.matcher(faceRef, faceQuery)) {
      throw new Error('Face not match')
    }

    return locations[0].id
  }

  public async in({ request, auth, response }: HttpContextContract) {
    const { face, longitude, latitude } = await request.validate({
      schema: schema.create({
        face: schema.file({
          extnames: ['jpg', 'png'],
        }),
        longitude: schema.number(),
        latitude: schema.number(),
      }),
    })

    let locationId = 0
    try {
      locationId = await this.validateInput(
        auth.use('api').user!,
        face.tmpPath!,
        latitude,
        longitude
      )
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }

    const attendance =
      (await Attendance.query()
        .where('user_id', auth.use('api').user!.id)
        .where(
          Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
            zone: DateTime.now().zoneName!,
          }),
          DateTime.now().toFormat('yyyy-LL-dd')
        )
        .first()) || new Attendance()

    attendance.userId = auth.use('api').user?.id!
    attendance.period = DateTime.now()
    attendance.inRecord = DateTime.now()
    attendance.inLocationId = locationId

    await attendance.save()

    return attendance.serialize()
  }

  public async out({ request, auth, response }: HttpContextContract) {
    const { face, longitude, latitude } = await request.validate({
      schema: schema.create({
        face: schema.file({
          extnames: ['jpg', 'png'],
        }),
        longitude: schema.number(),
        latitude: schema.number(),
      }),
    })

    let locationId = 0
    try {
      locationId = await this.validateInput(
        auth.use('api').user!,
        face.tmpPath!,
        latitude,
        longitude
      )
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }

    const attendance =
      (await Attendance.query()
        .where('user_id', auth.use('api').user!.id)
        .where(
          Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
            zone: DateTime.now().zoneName!,
          }),
          DateTime.now().toFormat('yyyy-LL-dd')
        )
        .first()) || new Attendance()

    attendance.userId = auth.use('api').user?.id!
    attendance.period = DateTime.now()
    attendance.outRecord = DateTime.now()
    attendance.outLocationId = locationId

    await attendance.save()

    return attendance.serialize()
  }

  public async today({ auth }: HttpContextContract) {
    const attendance = await auth
      .use('api')
      .user!.related('attendances')
      .query()
      .where(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
          zone: DateTime.now().zoneName!,
        }),
        DateTime.now().toFormat('yyyy-LL-dd')
      )
      .preload('in_location')
      .preload('out_location')
      .firstOrFail()

    return attendance.serialize()
  }

  public async history({ request, auth }: HttpContextContract) {
    const { page = 1 } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
    })

    const limit = 20
    const offset = (page - 1) * limit

    const attendancesQuery = auth.use('api').user!.related('attendances').query()

    const attendancesCount = await attendancesQuery.clone().count('* as total')

    const attendances = await attendancesQuery
      .clone()
      .offset(offset)
      .limit(limit)
      .orderBy('period', 'desc')

    return {
      page_count: Math.ceil(Number(attendancesCount[0].$extras.total) / limit),
      rows: attendances.map((attendances) => attendances.serialize()),
    }
  }

  public async daily({ request }) {
    const {
      page = 1,
      period = DateTime.now(),
      search,
    } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
        period: schema.date.optional(),
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

    const users = await usersQuery.offset(offset).limit(limit)
    const attendancesCount = await User.query().count('* as total')

    const attendances = await Attendance.query()
      .where(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
          zone: period.zoneName,
        }),
        period.toFormat('yyyy-LL-dd')
      )
      .clone()
      .preload('user')
      .preload('in_location')
      .preload('out_location')
      .whereIn(
        'attendances.user_id',
        users.map((user) => user.id)
      )

    return {
      page_count: Math.ceil(Number(attendancesCount[0].$extras.total) / limit),
      rows: users.map((user) => {
        const attendance = attendances.find((item) => item.userId === user.id)

        return {
          ...user.serialize(),
          attendance,
        }
      }),
    }
  }
}
