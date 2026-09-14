import { Incident } from '../../domain/incidents/Incident';
import { IncidentRepository } from '../../domain/incidents/IncidentRepository';

const MOCK_INCIDENTS: any[] = [
  {
    id: 'campus-inc-001',
    title: 'Fuga de agua en Laboratorio 3',
    description: 'Se observa goteo constante debajo del lavabo principal.',
    category: 'INFRASTRUCTURE',
    status: 'OPEN',
    location: { buildingId: 'Edificio A', floorId: 'Piso 2', spaceId: 'Lab 3' },
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'campus-inc-002',
    title: 'Proyector sin señal en Aula 102',
    description: 'El cable HDMI está dañado y la pantalla parpadea.',
    category: 'EQUIPMENT',
    status: 'IN_PROGRESS',
    location: { buildingId: 'Edificio B', floorId: 'Piso 1', spaceId: 'Aula 102' },
    createdAt: '2026-03-01T11:30:00Z',
  },
  {
    id: 'campus-inc-003',
    title: 'Luz fundida en pasillo central',
    description: 'El pasillo del tercer piso se encuentra a oscuras.',
    category: 'MAINTENANCE',
    status: 'RESOLVED',
    location: { buildingId: 'Edificio Central', floorId: 'Piso 3', spaceId: 'Pasillo' },
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
