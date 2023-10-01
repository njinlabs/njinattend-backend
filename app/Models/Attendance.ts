import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Location from './Location'

export default class Attendance extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public inLocationId: number

  @column()
  public outLocationId: number

  @column.dateTime()
  public period: DateTime

  @column.dateTime()
  public inRecord: DateTime

  @column.dateTime()
  public outRecord: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @belongsTo(() => Location, {
    foreignKey: 'inLocationId',
  })
  public in_location: BelongsTo<typeof Location>

  @belongsTo(() => Location, {
    foreignKey: 'outLocationId',
  })
  public out_location: BelongsTo<typeof Location>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
