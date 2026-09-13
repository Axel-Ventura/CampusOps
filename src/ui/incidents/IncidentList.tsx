import React, { useEffect, useState } from 'react';
import { Incident } from '../../domain/incidents/Incident';
import { getIncidentsUseCase, getIncidentByIdUseCase } from '../../composition/incidentsModule';

export const IncidentList: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    getIncidentsUseCase.execute().then(setIncidents);
  }, []);

  const handleSelect = async (id: string) => {
    const detail = await getIncidentByIdUseCase.execute(id);
    setSelectedIncident(detail);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Lista de Incidencias</h2>
      <ul>
        {incidents.map((inc) => (
          <li key={inc.id} style={{ cursor: 'pointer', marginBottom: '10px' }} onClick={() => handleSelect(inc.id)}>
            <strong>{inc.title}</strong> — <span>{inc.status}</span>
          </li>
        ))}
      </ul>

      {selectedIncident && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>Detalle de Incidencia</h3>
          <p><strong>ID:</strong> {selectedIncident.id}</p>
          <p><strong>Título:</strong> {selectedIncident.title}</p>
          <p><strong>Categoría:</strong> {selectedIncident.category}</p>
          <p><strong>Estado:</strong> {selectedIncident.status}</p>
          <p><strong>Descripción:</strong> {selectedIncident.description}</p>
          <p><strong>Ubicación:</strong> {selectedIncident.location.label}</p>
        </div>
      )}
    </div>
  );
};
