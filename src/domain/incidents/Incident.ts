import { IncidentCategory, IncidentStatus, IncidentLocation } from '../../campusops/contracts';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  location: IncidentLocation;
  createdAt: string;
}
