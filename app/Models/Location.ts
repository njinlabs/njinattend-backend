import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import Database from '@ioc:Adonis/Lucid/Database'

export default class Location extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public address: string

  @column({
    prepare: (value?: string) => {
      return value ? Database.st().geomFromText(value, 4326) : value
    },
    serializeAs: null,
  })
  public geom: string

  public serializeExtras() {
    return {
      longitude: this.$extras.longitude,
      latitude: this.$extras.latitude,
    }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
