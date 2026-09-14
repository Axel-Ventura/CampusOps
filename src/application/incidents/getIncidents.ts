import { IncidentRepository } from '../../domain/incidents/IncidentRepository';
import { Incident } from '../../domain/incidents/Incident';

export class GetIncidents {
  constructor(private readonly repository: IncidentRepository) {}

  async execute(): Promise<Incident[]> {
    return this.repository.getAll();
  }
}
