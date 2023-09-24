import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import Database from '@ioc:Adonis/Lucid/Database'
import Location from 'App/Models/Location'

export default class LocationsController {
  public async store({ request }: HttpContextContract) {
    const { name, address, longitude, latitude } = await request.validate({
      schema: schema.create({
        name: schema.string(),
        address: schema.string(),
        longitude: schema.number(),
        latitude: schema.number(),
      }),
    })

    const location = await Location.create({
      name,
      address,
      geom: `Point(${longitude} ${latitude})`,
    })

    return location.serialize()
  }

  public async index({ request }: HttpContextContract) {
    const { page = 1 } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
      }),
    })

    const limit = 20
    const offset = (page - 1) * limit

    const locationsQuery = Location.query()

    const locationsCount = await locationsQuery.clone().count('* as total')
    const locations = await locationsQuery
      .clone()
      .select(
        '*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude')
      )
      .offset(offset)
      .limit(limit)

    return {
      page_count: Math.ceil(Number(locationsCount[0].$extras.total) / limit),
      rows: locations.map((location) => location.serialize()),
    }
  }
}
