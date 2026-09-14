import { IncidentRepository } from '../../domain/incidents/IncidentRepository';
import { Incident } from '../../domain/incidents/Incident';

export class GetIncidentsUseCase {
  constructor(private incidentRepository: IncidentRepository) {}

  async execute(): Promise<Incident[]> {
    return this.incidentRepository.getAll();
  }
}
