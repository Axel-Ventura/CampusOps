
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { getBackendHealth } from './src/api/courseBackend';
import {
  enqueueOperation,
  getPendingOperations,
  openCampusDatabase,
} from './src/persistence/database';

export default function App() {
  const [status, setStatus] = useState<'checking' | 'available' | 'offline'>('checking');
  const [operations, setOperations] = useState<string[]>([]);
  const [storageMessage, setStorageMessage] = useState('Sin comprobar');

  useEffect(() => {
    let active = true;

    getBackendHealth()
      .then(() => active && setStatus('available'))
      .catch(() => active && setStatus('offline'));

    return () => {
      active = false;
    };
  }, []);

  async function refreshPendingOperations() {
    const db = await openCampusDatabase();

    try {
      const pending = await getPendingOperations(db);

      setOperations(
        pending.map(
          (operation) =>
            `${operation.operationId} | ${operation.incidentId} | ${JSON.stringify(operation.payload)}`,
        ),
      );

      setStorageMessage(`${pending.length} operación(es) pendiente(s)`);
    } catch (error) {
      setStorageMessage(`Error: ${String(error)}`);
    } finally {
      await db.closeAsync();
    }
  }

  async function saveSyntheticOperation() {
    const db = await openCampusDatabase();

    try {
      await enqueueOperation(db, {
        operationId: 'op-001',
        incidentId: 'campus-inc-001',
        authorId: 'technician-1',
        baseVersion: 1,
        payload: {
          status: 'in_progress',
          note: 'Inicio de revisión de laboratorio ficticio',
          photoReference: 'mock://photos/evidence-001',
        },
      });

      setStorageMessage('Operación ficticia guardada');
    } catch (error) {
      setStorageMessage(`Error: ${String(error)}`);
    } finally {
      await db.closeAsync();
    }
  }

  return (
    <View style={styles.screen}>
      <View accessibilityRole="summary" style={styles.card}>
        <Text style={styles.title}>CampusOps</Text>
        <Text>Incidencias del campus · entorno académico ficticio</Text>
        <Text testID="backend-status">Backend: {status}</Text>

        <Text style={styles.subtitle}>Semana 8 — Persistencia</Text>
        <Text testID="storage-status">{storageMessage}</Text>

        <Button
          title="Guardar operación ficticia"
          onPress={saveSyntheticOperation}
        />

        <Button
          title="Consultar cola SQLite"
          onPress={refreshPendingOperations}
        />

        {operations.map((operation) => (
          <Text key={operation}>{operation}</Text>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { gap: 12, padding: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
});
