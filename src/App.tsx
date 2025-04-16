import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Game from './pages/Game';
import CreateGame from './pages/CreateGame';

function App() {
  return (
    <GameProvider>
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </Box>
      </Router>
    </GameProvider>
  );
}

export default App;
