import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// React 18 Root API
const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);