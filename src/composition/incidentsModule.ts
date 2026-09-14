import { InMemoryIncidentRepository } from '../infrastructure/incidents/InMemoryIncidentRepository';
import { GetIncidents } from '../application/incidents/getIncidents';
import { GetIncidentById } from '../application/incidents/getIncidentById';

const incidentRepository = new InMemoryIncidentRepository();

export const getIncidentsUseCase = new GetIncidents(incidentRepository);
export const getIncidentByIdUseCase = new GetIncidentById(incidentRepository);
