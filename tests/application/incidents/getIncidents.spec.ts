import { GetIncidentsUseCase } from '../../../src/application/incidents/getIncidents';
import { InMemoryIncidentRepository } from '../../../src/infrastructure/incidents/InMemoryIncidentRepository';

describe('GetIncidentsUseCase', () => {
  it('debe retornar la lista de incidencias desde el repositorio en memoria', async () => {
    const repo = new InMemoryIncidentRepository();
    const useCase = new GetIncidentsUseCase(repo);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('campus-inc-001');
  });
});
