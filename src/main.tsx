// 1. IMPORTS
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

// 2. MOUNT REACT ROOT
// Strictly typed HTML element mount to #root with React 19 StrictMode for lifecycle auditing
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);