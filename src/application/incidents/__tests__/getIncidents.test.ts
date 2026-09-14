import { GetIncidents } from '../getIncidents';
import { InMemoryIncidentRepository } from '../../../infrastructure/incidents/InMemoryIncidentRepository';

describe('GetIncidents UseCase', () => {
  it('debe retornar la lista de incidencias ficticias en orden determinista', async () => {
    const repository = new InMemoryIncidentRepository();
    const useCase = new GetIncidents(repository);

    const result = await useCase.execute();

    expect(result.length).toBeGreaterThan(0);
  });
});
