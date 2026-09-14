import React, { useEffect, useState } from 'react';
import { getIncidentByIdUseCase } from '../../composition/incidentsModule';
import { Incident } from '../../domain/incidents/Incident';

interface Props {
  incidentId: string;
  onBack: () => void;
}

export const IncidentDetailScreen: React.FC<Props> = ({ incidentId, onBack }) => {
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    getIncidentByIdUseCase.execute(incidentId).then(setIncident);
  }, [incidentId]);

  if (!incident) return <div>Cargando detalle...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <button onClick={onBack}>&larr; Volver</button>
      <h2>{incident.title}</h2>
      <p><strong>Estado:</strong> {incident.status}</p>
      <p><strong>Categoría:</strong> {incident.category}</p>
      <p><strong>Descripción:</strong> {incident.description}</p>
      <p>
        <strong>Ubicación:</strong> {incident.location.building}, {incident.location.floor} ({incident.location.room})
      </p>
    </div>
  );
};
