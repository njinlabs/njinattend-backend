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
    const {
      page = 1,
      latitude,
      longitude,
      search,
    } = await request.validate({
      schema: schema.create({
        page: schema.number.optional(),
        latitude: schema.number.optional(),
        longitude: schema.number.optional(),
        search: schema.string.optional(),
      }),
    })

    const limit = 20
    const offset = (page - 1) * limit

    const locationsQuery = Location.query()

    if (search) locationsQuery.whereILike('name', `%${search}%`)

    const locationsCount = await locationsQuery.clone().count('* as total')

    if (longitude && latitude) {
      locationsQuery
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
    } else {
      locationsQuery.select(
        '*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude')
      )
    }

    const locations = await locationsQuery.clone().offset(offset).limit(limit)

    return {
      page_count: Math.ceil(Number(locationsCount[0].$extras.total) / limit),
      rows: locations.map((location) => {
        if (latitude && longitude) {
          location.setCurrentLatLng(latitude, longitude)
        }

        return location.serialize()
      }),
    }
  }

  public async show({ params }: HttpContextContract) {
    const location = await Location.query()
      .where('id', params.id)
      .select(
        '*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude')
      )
      .firstOrFail()

    return location.serialize()
  }

  public async update({ request, params }: HttpContextContract) {
    const location = await Location.query()
      .where('id', params.id)
      .select(
        '*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude')
      )
      .firstOrFail()

    const { name, address, longitude, latitude } = await request.validate({
      schema: schema.create({
        name: schema.string(),
        address: schema.string(),
        longitude: schema.number(),
        latitude: schema.number(),
      }),
    })

    location.name = name
    location.address = address
    location.geom = `Point(${longitude} ${latitude})`

    await location.save()
    await location.refresh()

    return location.serialize()
  }

  public async destroy({ params }: HttpContextContract) {
    const location = await Location.query()
      .where('id', params.id)
      .select(
        '*',
        Database.st().x('locations.geom').as('longitude'),
        Database.st().y('locations.geom').as('latitude')
      )
      .firstOrFail()
    await location.delete()

    return location.serialize()
  }
}
