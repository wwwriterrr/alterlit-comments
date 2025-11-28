import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('comments-root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
