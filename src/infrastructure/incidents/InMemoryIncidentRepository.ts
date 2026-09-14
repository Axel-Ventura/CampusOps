import { Incident } from '../../domain/incidents/Incident';
import { IncidentRepository } from '../../domain/incidents/IncidentRepository';

const MOCK_INCIDENTS: any[] = [
  {
    id: 'campus-inc-001',
    title: 'Fuga de agua en Laboratorio 3',
    description: 'Se observa goteo constante debajo del lavabo principal.',
    category: 'electrical',
    status: 'open',
    location: { source: 'manual' as const, label: 'Edificio A - Piso 2 - Lab 3', building: 'Edificio A', floor: 'Piso 2', room: 'Lab 3' },
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'campus-inc-002',
    title: 'Proyector sin señal en Aula 102',
    description: 'El cable HDMI está dañado y la pantalla parpadea.',
    category: 'equipment',
    status: 'in_progress',
    location: { source: 'manual' as const, label: 'Edificio B - Piso 1 - Aula 102', building: 'Edificio B', floor: 'Piso 1', room: 'Aula 102' },
    createdAt: '2026-03-01T11:30:00Z',
  },
  {
    id: 'campus-inc-003',
    title: 'Luz fundida en pasillo central',
    description: 'El pasillo del tercer piso se encuentra a oscuras.',
    category: 'maintenance',
    status: 'resolved',
    location: { source: 'manual' as const, label: 'Edificio Central - Piso 3 - Pasillo', building: 'Edificio Central', floor: 'Piso 3', room: 'Pasillo' },
    createdAt: '2026-03-01T14:15:00Z',
  },
];

export class InMemoryIncidentRepository implements IncidentRepository {
  async getAll(): Promise<Incident[]> {
    return [...MOCK_INCIDENTS];
  }

  async getById(id: string): Promise<Incident | null> {
    const item = MOCK_INCIDENTS.find((inc) => inc.id === id);
    return item ? { ...item } : null;
  }
}
