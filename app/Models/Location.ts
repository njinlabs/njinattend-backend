import { DateTime } from 'luxon'
import { BaseModel, HasMany, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Database from '@ioc:Adonis/Lucid/Database'
import Attendance from './Attendance'

type LatLng = {
  latitude: number
  longitude: number
}

export default class Location extends BaseModel {
  public currentLatlng: LatLng | null = null

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

  private haversineDistance(
    { latitude: lat1, longitude: lon1 }: LatLng,
    { latitude: lat2, longitude: lon2 }: LatLng
  ) {
    const earthRadius = 6371

    const degToRad = (degrees) => {
      return degrees * (Math.PI / 180)
    }

    const dLat = degToRad(lat2 - lat1)
    const dLon = degToRad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) ** 2

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = earthRadius * c

    return distanceKm
  }

  public setCurrentLatLng(latitude: number, longitude: number) {
    this.currentLatlng = {
      latitude,
      longitude,
    }
  }

  public serializeExtras() {
    return {
      longitude: this.$extras.longitude,
      latitude: this.$extras.latitude,
      distance:
        this.$extras.longitude && this.$extras.latitude && this.currentLatlng
          ? this.haversineDistance(
              { latitude: this.$extras.latitude, longitude: this.$extras.longitude },
              this.currentLatlng
            )
          : undefined,
    }
  }

  @hasMany(() => Attendance, {
    foreignKey: 'inLocationId',
  })
  public in_attendances: HasMany<typeof Attendance>

  @hasMany(() => Attendance, {
    foreignKey: 'outLocationId',
  })
  public out_attendances: HasMany<typeof Attendance>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
