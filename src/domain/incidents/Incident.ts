import { IncidentCategory, IncidentStatus, IncidentLocation } from '../../campusops/contracts';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: any;
  status: any;
  location: any;
  createdAt: string;
}