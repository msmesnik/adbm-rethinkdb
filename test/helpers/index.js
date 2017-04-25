const rethinkdb = require('rethinkdbdash')

const dbName = process.env.DB_NAME || 'adbm_rethinkdb'
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT,
  authKey: process.env.DB_AUTH_KEY,
  db: dbName
}

function getConnection (overrides = { }) {
  return rethinkdb(Object.assign({}, dbConfig, overrides))
}

module.exports = {
  getConnection,
  dbName
}
