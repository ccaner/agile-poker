import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Heading,
  VStack,
  Input,
  Button,
  Text,
  useToast
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { getGame } from '../utils/db';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { createGame } = useGame();
  const toast = useToast();
  const [gameName, setGameName] = useState('');
  const [adminName, setAdminName] = useState('');

  const handleCreateGame = async () => {
    if (!gameName || !adminName) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await createGame(gameName, adminName);
      // Wait for the game to be created and loaded
      const games = await getGame();
      if (games) {
        const gameId = Object.keys(games).find(id => games[id].name === gameName);
        if (gameId) {
          navigate(`/game/${gameId}`);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create game',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Agile Planning Poker</Heading>
        <Text>Create a new game or join an existing one</Text>
        <VStack spacing={4} w="100%">
          <Input
            placeholder="Game Name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
          <Input
            placeholder="Your Name (Admin)"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
          <Button colorScheme="blue" onClick={handleCreateGame}>
            Create Game
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
};

export default Home; 