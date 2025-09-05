import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { HostPage } from './pages/HostPage';
import { JoinPage } from './pages/JoinPage';
import { PlayerPage } from './pages/PlayerPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/join/:roomId" element={<JoinPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/player" element={<PlayerPage />} />
      </Routes>
    </Router>
  );
};

export default App;
