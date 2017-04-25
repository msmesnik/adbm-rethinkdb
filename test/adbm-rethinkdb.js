/* eslint-env mocha */

const { expect } = require('chai')

const { getConnection, dbName } = require('./helpers')
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
  let dropDb = false
  const getIds = (items) => items.map(({ id }) => id)
  const mockInfoCollection = '_adbm_mock'

  before(async () => {
    db = await getConnection()

    const existing = await db.dbList().run()

    if (!existing.includes(dbName)) {
      await db.dbCreate(dbName).run()
      dropDb = true
    }

    try {
      await db.tableCreate(mockInfoCollection).run()
    } catch (e) { }

    await db.table(mockInfoCollection).insert([
      { id: 'first', completed: new Date() },
      { id: 'second', completed: new Date() }
    ]).run()
  })
  after(async () => {
    await db.tableDrop(mockInfoCollection).run()

    if (dropDb) {
      await db.dbDrop(dbName).run()
    }
  })

  describe('initialization', function () {
    const mockDb = `${dbName}_init_mock_`

    after(async () => {
      try {
        await db.dbDrop(mockDb).run()
      } catch (e) { }
    })

    it('initializes the database', async function () {
      expect(await db.dbList().run()).to.not.contain(mockDb)

      await adapter.init({ db, dbName: mockDb, metadata: mockInfoCollection, logger: defaultLogger })

      expect(await db.dbList().run()).to.contain(mockDb)
      expect(await db.db(mockDb).tableList().run()).to.contain(mockInfoCollection)
    })
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
