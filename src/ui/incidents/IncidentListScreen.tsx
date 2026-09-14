import React, { useEffect, useState } from 'react';
import { getIncidentsUseCase } from '../../composition/incidentsModule';
import { Incident } from '../../domain/incidents/Incident';

interface Props {
  onSelectIncident: (id: string) => void;
}

export const IncidentListScreen: React.FC<Props> = ({ onSelectIncident }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    getIncidentsUseCase.execute().then(setIncidents);
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <h2>Incidencias de Campus</h2>
      <ul>
        {incidents.map((incident) => (
          <li
            key={incident.id}
            onClick={() => onSelectIncident(incident.id)}
            style={{ cursor: 'pointer', marginBottom: '8px' }}
          >
            <strong>{incident.id}</strong> - {incident.title} [{incident.status}]
          </li>
        ))}
      </ul>
    </div>
  );
};
