async function init ({ db, dbName, metadata, logger }) {

}

async function getCompletedMigrationIds ({ db, metadata, logger }) {
  const completed = []

  logger.debug('○ Found %s completed migrations in metadata table "%s".', completed.length, metadata)

  return completed.map(({ id }) => id)
}

async function registerMigration ({ id, db, metadata }) {
}

async function unregisterMigration ({ id, db, metadata }) {
}

module.exports = {
  init,
  getCompletedMigrationIds,
  registerMigration,
  unregisterMigration
}
