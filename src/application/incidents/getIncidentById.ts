import { IncidentRepository } from '../../domain/incidents/IncidentRepository';
import { Incident } from '../../domain/incidents/Incident';

export class GetIncidentByIdUseCase {
  constructor(private incidentRepository: IncidentRepository) {}

  async execute(id: string): Promise<Incident | null> {
    return this.incidentRepository.getById(id);
  }
}
