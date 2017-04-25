/* eslint-env mocha */

const { expect } = require('chai')

const { getConnection } = require('./helpers')
const adapter = require('../index')

const log = console.log.bind(console)
const defaultLogger = {
  debug: log,
  verbose: log,
  info: log,
  warn: console.warn.bind(console),
  error: console.error.bind(console)
}

describe('rethinkdb adapter', function () {
  let db
  const getIds = (items) => items.map(({ id }) => id)
  const mockInfoCollection = '_adbm_mock'

  before(async () => {
    db = await getConnection()
    await db.table(mockInfoCollection).insert([
      { id: 'first', completed: new Date() },
      { id: 'second', completed: new Date() }
    ]).run()
  })
  after(async () => {
    await db.tableDrop(mockInfoCollection).run()
  })

  it('gets a list of all completed migrations', async function () {
    const ids = await adapter.getCompletedMigrationIds({ db, metadata: mockInfoCollection, logger: defaultLogger })

    expect(ids).to.be.an('array')
    expect(ids).to.have.all.members([ 'first', 'second' ])
  })

  it('registers a successful migration', async function () {
    const mockId = 'mock'
    expect(getIds(await db.table(mockInfoCollection).pluck('id').run())).to.not.contain(mockId)

    await adapter.registerMigration({ id: mockId, metadata: mockInfoCollection, db })
    expect(getIds(await db.table(mockInfoCollection).pluck('id').run())).to.contain(mockId)
  })

  it('removes an entry from the list of performed migrations', async function () {
    expect(getIds(await db.table(mockInfoCollection).pluck('id').run())).to.contain('first')

    await adapter.unregisterMigration({ id: 'first', metadata: mockInfoCollection, db })
    expect(getIds(await db.table(mockInfoCollection).pluck('id').run())).to.not.contain('first')
  })
})
