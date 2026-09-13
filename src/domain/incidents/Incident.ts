import { IncidentStatus, IncidentCategory, IncidentLocation } from '../../campusops/contracts';

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  category: IncidentCategory;
  location: IncidentLocation;
  createdAt: string;
}
