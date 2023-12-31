import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  hasOne,
  HasOne,
  beforeDelete,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import { AttachmentContract, attachment } from '@ioc:Adonis/Addons/AttachmentLite'
import Face from './Face'
import Attendance from './Attendance'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public registeredNumber: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public fullname: string

  @column()
  public gender: 'male' | 'female'

  @column.dateTime()
  public birthday: DateTime

  @column()
  public role: 'administrator' | 'user'

  @attachment({
    preComputeUrl: true,
  })
  public avatar: AttachmentContract

  @column()
  public department: string

  @hasOne(() => Face)
  public face: HasOne<typeof Face>

  @hasMany(() => Attendance)
  public attendances: HasMany<typeof Attendance>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  @beforeDelete()
  public static async removeFaceModel(user: User) {
    await user.load('face')
    await user.face?.delete()
  }

  public serializeExtras() {
    return {
      face: Boolean(this.face),
    }
  }
}
