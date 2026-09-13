import { Incident } from './Incident';

export interface IncidentRepository {
  getIncidents(): Promise<Incident[]>;
  getIncidentById(id: string): Promise<Incident | null>;
}
