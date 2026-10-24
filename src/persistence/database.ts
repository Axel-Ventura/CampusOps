
import * as SQLite from 'expo-sqlite';

export type PendingOperation = {
  operationId: string;
  incidentId: string;
  authorId: string;
  baseVersion: number;
  payload: {
    status?: string;
    note?: string;
    photoReference?: string;
  };
};

type OperationRow = {
  operation_id: string;
  incident_id: string;
  author_id: string;
  base_version: number;
  payload_json: string;
};

const DATABASE_NAME = 'campusops-week08.db';

export async function openCampusDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY NOT NULL,
      version INTEGER NOT NULL,
      fields_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_operations (
      operation_id TEXT PRIMARY KEY NOT NULL,
      incident_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      base_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
  `);

  return db;
}

export async function enqueueOperation(
  db: SQLite.SQLiteDatabase,
  operation: PendingOperation,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO pending_operations
      (operation_id, incident_id, author_id, base_version, payload_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      operation.operationId,
      operation.incidentId,
      operation.authorId,
      operation.baseVersion,
      JSON.stringify(operation.payload),
    ],
  );
}

export async function getPendingOperations(
  db: SQLite.SQLiteDatabase,
): Promise<PendingOperation[]> {
  const rows = await db.getAllAsync<OperationRow>(
    `SELECT operation_id, incident_id, author_id,
            base_version, payload_json
     FROM pending_operations
     ORDER BY rowid ASC`,
  );

  return rows.map((row) => ({
    operationId: row.operation_id,
    incidentId: row.incident_id,
    authorId: row.author_id,
    baseVersion: row.base_version,
    payload: JSON.parse(row.payload_json) as PendingOperation['payload'],
  }));
}

export async function confirmOperation(
  db: SQLite.SQLiteDatabase,
  operationId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM pending_operations WHERE operation_id = ?',
    [operationId],
  );
}
