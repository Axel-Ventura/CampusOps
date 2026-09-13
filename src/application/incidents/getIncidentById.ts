import { IncidentRepository } from '../../domain/incidents/IncidentRepository';
import { Incident } from '../../domain/incidents/Incident';

export class GetIncidentByIdUseCase {
  constructor(private repository: IncidentRepository) {}

  async execute(id: string): Promise<Incident | null> {
    return this.repository.getIncidentById(id);
  }
}
