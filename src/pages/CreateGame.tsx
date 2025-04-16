import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { getGame } from '../utils/db';

const CreateGame: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { createGame } = useGame();
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
        <Heading>Create New Game</Heading>
        <Box w="100%" p={6} borderWidth="1px" borderRadius="lg">
          <VStack spacing={4}>
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
        </Box>
      </VStack>
    </Container>
  );
};

export default CreateGame; 