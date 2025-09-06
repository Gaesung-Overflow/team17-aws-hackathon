import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PacmanGame } from './components/PacmanGame';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PacmanGame />
  </StrictMode>,
);
