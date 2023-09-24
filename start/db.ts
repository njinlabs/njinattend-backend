import knexPostgis from 'knex-postgis'
import Database from '@ioc:Adonis/Lucid/Database'

Database.Database.macro('st', function (connectionName?: string) {
  connectionName = connectionName || this.primaryConnectionName
  this.manager.connect(connectionName)

  const connection = this.getRawConnection(connectionName)!.connection!

  if (connection.dialectName !== 'postgres') {
    throw new Error('The "st" function can only be used with PostgreSQL')
  }

  if (!connection.client!['postgis']) {
    knexPostgis(connection.client!)
    if (connection.hasReadWriteReplicas) {
      knexPostgis(connection.readClient!)
    }
  }

  return connection.client!['postgis']
})
