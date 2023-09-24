import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
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
}
