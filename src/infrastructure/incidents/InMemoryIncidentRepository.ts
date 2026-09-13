import { Incident } from '../../domain/incidents/Incident';
import { IncidentRepository } from '../../domain/incidents/IncidentRepository';

export class InMemoryIncidentRepository implements IncidentRepository {
  private incidents: Incident[] = [
    {
      id: 'campus-inc-001',
      title: 'Fuga de agua en Laboratorio 2',
      description: 'Se detectó una fuga constante en la tubería principal bajo la tarja.',
      status: 'open',
      category: 'safety',
      location: {
        source: 'manual',
        label: 'Edificio B, Planta Baja, Lab 2',
      },
      createdAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'campus-inc-002',
      title: 'Fallo de proyector en Aula 104',
      description: 'El proyector no enciende el foco de iluminación.',
      status: 'in_progress',
      category: 'electrical',
      location: {
        source: 'manual',
        label: 'Edificio A, Piso 1, Aula 104',
      },
      createdAt: '2026-09-11T14:30:00Z',
    },
  ];

  async getIncidents(): Promise<Incident[]> {
    return [...this.incidents];
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const found = this.incidents.find((inc) => inc.id === id);
    return found ? { ...found } : null;
  }
}
