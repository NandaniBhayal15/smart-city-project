import React from 'react';

export default function GenericPage({ title, description }) {
  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{description}</p>
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <p>This module is connected to the backend API services and ready for data inspection.</p>
      </div>
    </div>
  );
}
