import { Incident } from '../../domain/incidents/Incident';
import { IncidentRepository } from '../../domain/incidents/IncidentRepository';

export class InMemoryIncidentRepository implements IncidentRepository {
  private incidents: Incident[] = [
    {
      id: 'campus-inc-001',
      title: 'Proyector dañado en Aulas 2',
      description: 'El proyector del salón 204 no enciende ni transmite señal.',
      status: 'open',
      category: 'maintenance',
      location: {
        source: 'manual',
        label: 'Edificio A, Salón 204',
        building: 'Edificio A',
        floor: '2',
        room: '204',
      },
      createdAt: '2026-09-14T10:00:00Z',
    },
    {
      id: 'campus-inc-002',
      title: 'Fuga de agua en Laboratorio B',
      description: 'Fuga visible debajo del lavabo principal del laboratorio.',
      status: 'in_progress',
      category: 'maintenance',
      location: {
        source: 'manual',
        label: 'Edificio C, Lab B',
        building: 'Edificio C',
        floor: '1',
        room: 'Lab B',
      },
      createdAt: '2026-09-14T11:30:00Z',
    },
    {
      id: 'campus-inc-003',
      title: 'Falta de conexión WiFi en Biblioteca',
      description: 'Intermitencia severa en la red inalámbrica del segundo piso.',
      status: 'resolved',
      category: 'maintenance',
      location: {
        source: 'manual',
        label: 'Biblioteca Central, Piso 2',
        building: 'Biblioteca',
        floor: '2',
        room: 'Sala de Estudio',
      },
      createdAt: '2026-09-14T12:00:00Z',
    },
  ];

  async getAll(): Promise<Incident[]> {
    return [...this.incidents];
  }

  async getById(id: string): Promise<Incident | null> {
    const found = this.incidents.find((inc) => inc.id === id);
    return found ? { ...found } : null;
  }
}
