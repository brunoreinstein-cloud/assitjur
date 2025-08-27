import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from './providers/HelmetProvider'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
