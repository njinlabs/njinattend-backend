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

    try {
      await this.validateInput(auth.use('api').user!, face.tmpPath!, latitude, longitude)
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }

    const attendance =
      (await Attendance.query()
        .where('user_id', auth.use('api').user!.id)
        .where(
          Database.raw("TO_CHAR(period AT TIME ZONE 'UTC', 'YYYY-MM-DD')"),
          DateTime.now().toUTC().toFormat('yyyy-LL-dd')
        )
        .first()) || new Attendance()

    attendance.userId = auth.use('api').user?.id!
    attendance.period = DateTime.now()
    attendance.in_record = DateTime.now()

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

    try {
      await this.validateInput(auth.use('api').user!, face.tmpPath!, latitude, longitude)
    } catch (e) {
      return response.unprocessableEntity({
        message: (e as Error).message,
      })
    }

    const attendance =
      (await Attendance.query()
        .where('user_id', auth.use('api').user!.id)
        .where(
          Database.raw("TO_CHAR(period AT TIME ZONE 'UTC', 'YYYY-MM-DD')"),
          DateTime.now().toUTC().toFormat('yyyy-LL-dd')
        )
        .first()) || new Attendance()

    attendance.userId = auth.use('api').user?.id!
    attendance.period = DateTime.now()
    attendance.out_record = DateTime.now()

    await attendance.save()

    return attendance.serialize()
  }
}
