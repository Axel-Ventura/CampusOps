import { GetIncidentsUseCase } from '../getIncidents';
import { GetIncidentByIdUseCase } from '../getIncidentById';
import { InMemoryIncidentRepository } from '../../../infrastructure/incidents/InMemoryIncidentRepository';

describe('Incidents Application Use Cases', () => {
  let repository: InMemoryIncidentRepository;

  beforeEach(() => {
    repository = new InMemoryIncidentRepository();
  });

  test('getIncidents returns all mock incidents', async () => {
    const useCase = new GetIncidentsUseCase(repository);
    const incidents = await useCase.execute();

    expect(incidents).toHaveLength(3);
    expect(incidents[0]?.id).toBe('campus-inc-001');
  });

  test('getIncidentById returns correct incident when found', async () => {
    const useCase = new GetIncidentByIdUseCase(repository);
    const incident = await useCase.execute('campus-inc-002');

    expect(incident).not.toBeNull();
    expect(incident?.title).toBe('Fuga de agua en Laboratorio B');
  });
});
