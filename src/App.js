import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0' }}>
          CSV Analysis Tool
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Schlatter Industries - Spannung/Weg Diagramm Analyse
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🚀 Electron + React Setup erfolgreich!</h2>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '20px', 
            borderRadius: '10px',
            margin: '20px 0' 
          }}>
            <h3>Nächste Schritte:</h3>
            <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
              <li>✅ Electron + React Grundgerüst</li>
              <li>🔄 CSV Upload Interface</li>
              <li>📊 D3.js Charts Integration</li>
              <li>🔍 Kalman Filter Implementation</li>
              <li>🎯 Draggable Marker</li>
              <li>📤 Export Funktionalität</li>
            </ul>
          </div>

          <button style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '1.1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}>
            Los geht's! 🎉
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;