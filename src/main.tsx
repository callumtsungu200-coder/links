import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrap } from './game/session';
import './styles.css';

const { game, stats } = bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialGame={game} initialStats={stats} />
  </StrictMode>,
);
