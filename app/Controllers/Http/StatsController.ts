import Database from '@ioc:Adonis/Lucid/Database'
import Attendance from 'App/Models/Attendance'
import Location from 'App/Models/Location'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

type ChartType = {
  period: DateTime
  value: number
}

export default class StatsController {
  public async index() {
    const charts: ChartType[] = []
    const attendances = await Attendance.query()
      .select(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD') as period_date", {
          zone: DateTime.now().zoneName!,
        })
      )
      .count('* as total')
      .groupBy('period_date')
      .where(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
          zone: DateTime.now().zoneName!,
        }),
        '>',
        DateTime.now().minus({ days: 7 }).toFormat('yyyy-LL-dd')
      )

    for (let i = 0; i < 7; i++) {
      const date = DateTime.now().minus({ days: i })

      const value = attendances.find(
        (value) => value.$extras.period_date === date.toFormat('yyyy-LL-dd')
      )

      charts.push({
        period: date,
        value: value ? Number(value.$extras.total) : 0,
      })
    }

    const attendancesCount = await Attendance.query()
      .select(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD') as period_date", {
          zone: DateTime.now().zoneName!,
        })
      )
      .count('in_record as total_in')
      .count('out_record as total_out')
      .groupBy('period_date')
      .where(
        Database.raw("TO_CHAR(period AT TIME ZONE :zone, 'YYYY-MM-DD')", {
          zone: DateTime.now().zoneName!,
        }),
        DateTime.now().toFormat('yyyy-LL-dd')
      )

    const usersCount = await User.query().count('* as users_count')
    const locationsCount = await Location.query().count('* as locations_count')

    return {
      charts,
      in_records: attendancesCount[0].$extras.total_in
        ? Number(attendancesCount[0].$extras.total_in)
        : null,
      out_records: attendancesCount[0].$extras.total_out
        ? Number(attendancesCount[0].$extras.total_out)
        : null,
      users: usersCount[0].$extras.users_count ? Number(usersCount[0].$extras.users_count) : 0,
      locations: locationsCount[0].$extras.locations_count
        ? Number(locationsCount[0].$extras.locations_count)
        : 0,
    }
  }
}
