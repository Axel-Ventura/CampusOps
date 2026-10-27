
import * as SQLite from 'expo-sqlite';

// Estructura de una operacion pendiente de sincronizacion.
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

// Estructura de los registros recuperados de SQLite.
type OperationRow = {
  operation_id: string;
  incident_id: string;
  author_id: string;
  base_version: number;
  payload_json: string;
};

const DATABASE_NAME = 'campusops-week08.db';

// Abre la base de datos y crea el esquema inicial
// mediante una transaccion.
export async function openCampusDatabase(
  simulateMigrationFailure = false,
): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');

    const version = await db.getFirstAsync<{
      user_version: number;
    }>('PRAGMA user_version');

    const currentVersion = version?.user_version ?? 0;

    if (currentVersion > 1) {
      throw new Error('Version de esquema no compatible');
    }

    if (currentVersion === 0) {
      await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.execAsync(`
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

        // Falla controlada para probar el rollback.
        if (simulateMigrationFailure) {
          throw new Error(
            'Falla sintetica durante la migracion',
          );
        }

        await tx.execAsync('PRAGMA user_version = 1');
      });
    }

    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

// Guarda una operacion en la cola persistente.
// La clave primaria evita duplicar operationId.
export async function enqueueOperation(
  db: SQLite.SQLiteDatabase,
  operation: PendingOperation,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO pending_operations
      (
        operation_id,
        incident_id,
        author_id,
        base_version,
        payload_json
      )
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

// Recupera las operaciones pendientes.
// Conserva el identificador y contenido originales.
export async function getPendingOperations(
  db: SQLite.SQLiteDatabase,
): Promise<PendingOperation[]> {
  const rows = await db.getAllAsync<OperationRow>(
    `SELECT
        operation_id,
        incident_id,
        author_id,
        base_version,
        payload_json
     FROM pending_operations
     ORDER BY rowid ASC`,
  );

  return rows.map((row) => ({
    operationId: row.operation_id,
    incidentId: row.incident_id,
    authorId: row.author_id,
    baseVersion: row.base_version,
    payload: JSON.parse(
      row.payload_json,
    ) as PendingOperation['payload'],
  }));
}

// Elimina una operacion unicamente cuando el servidor
// haya confirmado que fue procesada correctamente.
export async function confirmOperation(
  db: SQLite.SQLiteDatabase,
  operationId: string,
): Promise<void> {
  await db.runAsync(
    `DELETE FROM pending_operations
     WHERE operation_id = ?`,
    [operationId],
  );
}
