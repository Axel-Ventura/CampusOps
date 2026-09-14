import { IncidentRepository } from '../../domain/incidents/IncidentRepository';
import { Incident } from '../../domain/incidents/Incident';

export class GetIncidentById {
  constructor(private readonly repository: IncidentRepository) {}

  async execute(id: string): Promise<Incident | null> {
    return this.repository.getById(id);
  }
}
