import { Incident } from '../../domain/incidents/Incident';
import { IncidentRepository } from '../../domain/incidents/IncidentRepository';

const MOCK_INCIDENTS: any[] = [
  {
    id: 'campus-inc-001',
    title: 'Fuga de agua en Laboratorio 3',
    description: 'Se observa goteo constante debajo del lavabo principal.',
 feature/mart-esqueleto-incidencias
    category: 'INFRASTRUCTURE',
    status: 'OPEN',
    location: { buildingId: 'Edificio A', floorId: 'Piso 2', spaceId: 'Lab 3' },

    category: 'electrical',
    status: 'open',
    location: { source: 'manual' as const, label: 'Edificio A - Piso 2 - Lab 3', building: 'Edificio A', floor: 'Piso 2', room: 'Lab 3' },
 main
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'campus-inc-002',
    title: 'Proyector sin señal en Aula 102',
    description: 'El cable HDMI está dañado y la pantalla parpadea.',
 feature/mart-esqueleto-incidencias
    category: 'EQUIPMENT',
    status: 'IN_PROGRESS',
    location: { buildingId: 'Edificio B', floorId: 'Piso 1', spaceId: 'Aula 102' },

    category: 'equipment',
    status: 'in_progress',
    location: { source: 'manual' as const, label: 'Edificio B - Piso 1 - Aula 102', building: 'Edificio B', floor: 'Piso 1', room: 'Aula 102' },
 main
    createdAt: '2026-03-01T11:30:00Z',
  },
  {
    id: 'campus-inc-003',
    title: 'Luz fundida en pasillo central',
    description: 'El pasillo del tercer piso se encuentra a oscuras.',
 feature/mart-esqueleto-incidencias
    category: 'MAINTENANCE',
    status: 'RESOLVED',
    location: { buildingId: 'Edificio Central', floorId: 'Piso 3', spaceId: 'Pasillo' },

    category: 'maintenance',
    status: 'resolved',
    location: { source: 'manual' as const, label: 'Edificio Central - Piso 3 - Pasillo', building: 'Edificio Central', floor: 'Piso 3', room: 'Pasillo' },
 main
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
