import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('registered_number', 255).notNullable().unique()
      table.string('password', 180).notNullable()
      table.string('fullname').notNullable()
      table.string('gender').notNullable()
      table.dateTime('birthday', { useTz: true }).notNullable()
      table.string('role').notNullable()
      table.json('avatar').nullable()
      table.string('department').notNullable()

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
