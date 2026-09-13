import { InMemoryIncidentRepository } from '../infrastructure/incidents/InMemoryIncidentRepository';
import { GetIncidentsUseCase } from '../application/incidents/getIncidents';
import { GetIncidentByIdUseCase } from '../application/incidents/getIncidentById';

const incidentRepository = new InMemoryIncidentRepository();

export const getIncidentsUseCase = new GetIncidentsUseCase(incidentRepository);
export const getIncidentByIdUseCase = new GetIncidentByIdUseCase(incidentRepository);
