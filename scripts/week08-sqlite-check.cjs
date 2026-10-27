
const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'campusops-week08-'),
);
const filename = path.join(directory, 'synthetic-test.db');

function open() {
  return new DatabaseSync(filename);
}

function schemaVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

function snapshot(db) {
  return {
    version: schemaVersion(db),
    incidents: db.prepare(
      'SELECT * FROM incidents ORDER BY id',
    ).all(),
    operations: db.prepare(
      'SELECT * FROM pending_operations ORDER BY operation_id',
    ).all(),
  };
}

function migrateToV2(db, injectFailure = false) {
  db.exec('BEGIN TRANSACTION');

  try {
    db.exec(`
      ALTER TABLE pending_operations
      ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';
    `);

    if (injectFailure) {
      throw new Error('Falla sintetica de migracion');
    }

    db.exec('PRAGMA user_version = 2');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

try {
  let db = open();

  // Esquema previo, version 1.
  db.exec(`
    CREATE TABLE incidents (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      fields_json TEXT NOT NULL
    );

    CREATE TABLE pending_operations (
      operation_id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );

    PRAGMA user_version = 1;
  `);

  const payload = JSON.stringify({
    status: 'in_progress',
    note: 'Revision de laboratorio ficticio',
    photoReference: 'mock://photos/evidence-001',
  });

  db.prepare(
    'INSERT INTO incidents VALUES (?, ?, ?)',
  ).run(
    'campus-inc-001',
    1,
    JSON.stringify({ status: 'assigned' }),
  );

  db.prepare(
    `INSERT INTO pending_operations
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    'op-001',
    'campus-inc-001',
    'technician-1',
    1,
    payload,
  );

  const beforeRestart = snapshot(db);
  db.close();

  // Reabrir el archivo de base de datos.
  db = open();
  const afterRestart = snapshot(db);

  assert.deepEqual(afterRestart, beforeRestart);
  assert.equal(afterRestart.operations[0].operation_id, 'op-001');
  assert.equal(afterRestart.operations[0].payload_json, payload);

  console.log('PASS reinicio de conexion: identidad y contenido conservados');

  // Falla inyectada y rollback.
  const beforeFailure = snapshot(db);

  assert.throws(
    () => migrateToV2(db, true),
    /Falla sintetica/,
  );

  const afterFailure = snapshot(db);
  assert.deepEqual(afterFailure, beforeFailure);

  const columnsAfterFailure = db.prepare(
    'PRAGMA table_info(pending_operations)',
  ).all();

  assert.equal(
    columnsAfterFailure.some(
      (column) => column.name === 'sync_status',
    ),
    false,
  );

  console.log('PASS rollback: esquema y registros originales intactos');

  // Migracion correcta.
  migrateToV2(db);

  assert.equal(schemaVersion(db), 2);

  const afterMigration = snapshot(db);
  assert.equal(afterMigration.incidents.length, 1);
  assert.equal(afterMigration.operations.length, 1);
  assert.equal(afterMigration.operations[0].sync_status, 'pending');

  console.log('PASS migracion: datos y cola conservados');

  // Repeticion de operacion sin duplicar.
  db.prepare(
    `INSERT OR IGNORE INTO pending_operations
     (operation_id, incident_id, author_id, base_version, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    'op-001',
    'campus-inc-001',
    'technician-1',
    1,
    payload,
  );

  assert.equal(
    db.prepare(
      'SELECT COUNT(*) AS total FROM pending_operations',
    ).get().total,
    1,
  );

  console.log('PASS deduplicacion local: una sola operacion pendiente');

  db.close();
  console.log('RESULTADO: 4 comprobaciones SQLite aprobadas');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
