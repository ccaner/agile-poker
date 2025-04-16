import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Center,
  Spinner,
  FormControl,
  FormLabel,
  Link
} from '@chakra-ui/react';
import { useGame } from '../context/GameContext';
import { getGame } from '../utils/db';
import type { Game, Story, User } from '../types';
import { socketService } from '../utils/socket';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';

const GameComponent: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryLink, setNewStoryLink] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<{ [storyId: string]: number }>({});
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddStoryModalOpen, setIsAddStoryModalOpen] = useState(false);
  const [isCloseStoryModalOpen, setIsCloseStoryModalOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [finalPoints, setFinalPoints] = useState<number>(0);

  const game = state.currentGame;
  const currentUser = state.currentUser;

  useEffect(() => {
    if (gameId) {
      const loadGame = async () => {
        setIsLoading(true);
        try {
          const dbGames = await getGame(gameId);
          if (dbGames && gameId in dbGames) {
            const game = dbGames[gameId];
            dispatch({
              type: 'LOAD_STATE',
              payload: { games: dbGames }
            });
            dispatch({
              type: 'SET_CURRENT_GAME',
              payload: { gameId }
            });

            // Check if we have a saved user ID and the user exists in the game
            const savedUserId = localStorage.getItem('currentUserId');
            const savedGameId = localStorage.getItem('currentGameId');
            
            // Only restore the user if they were in this specific game
            if (savedUserId && savedGameId === gameId) {
              const user = game.users.find(u => u.id === savedUserId);
              if (user) {
                dispatch({
                  type: 'SET_CURRENT_USER',
                  payload: { userId: savedUserId }
                });
                setIsLoading(false);
                return;
              }
            }

            // If we have a saved user name but no user ID, try to find the user by name
            const savedUserName = localStorage.getItem('userName');
            if (savedUserName && savedGameId === gameId) {
              const user = game.users.find(u => u.name === savedUserName);
              if (user) {
                dispatch({
                  type: 'SET_CURRENT_USER',
                  payload: { userId: user.id }
                });
                localStorage.setItem('currentUserId', user.id);
                setIsLoading(false);
                return;
              }
            }

            // If we get here, we need to show the join screen
            setIsJoining(true);
          }
        } catch (error) {
          console.error('Error loading game:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadGame();
    }
  }, [gameId, dispatch]);

  // Handle real-time updates
  useEffect(() => {
    if (game) {
      const handleGameUpdate = (updatedGame: Game) => {
        if (updatedGame.id === game.id) {
          dispatch({
            type: 'LOAD_STATE',
            payload: { 
              games: {
                ...state.games,
                [game.id]: updatedGame
              },
              currentGame: updatedGame
            }
          });
        }
      };

      socketService.onGameUpdate(handleGameUpdate);

      return () => {
        socketService.offGameUpdate(handleGameUpdate);
      };
    }
  }, [game, state.games]);

  useEffect(() => {
    if (game && !currentUser && !isJoining && !isLoading) {
      setIsJoining(true);
    }
  }, [game, currentUser, isJoining, isLoading]);

  const handleJoinGame = () => {
    if (!game || !userName.trim()) return;

    dispatch({
      type: 'JOIN_GAME',
      payload: {
        gameId: game.id,
        userName: userName.trim()
      }
    });
  };

  const handleAddStory = async () => {
    if (!currentUser?.isAdmin) {
      toast({
        title: 'Error',
        description: 'Only admins can add stories',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!newStoryTitle || !newStoryLink) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!game) {
      toast({
        title: 'Error',
        description: 'No game found',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      dispatch({
        type: 'ADD_STORY',
        payload: {
          gameId: game.id,
          title: newStoryTitle,
          jiraLink: newStoryLink
        }
      });

      setNewStoryTitle('');
      setNewStoryLink('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add story',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleVote = (storyId: string, points: number) => {
    if (!currentUser || !game) return;

    // Update local state first
    setSelectedPoints(prev => ({
      ...prev,
      [storyId]: points
    }));

    // Then dispatch the vote action
    dispatch({
      type: 'VOTE',
      payload: {
        gameId: game.id,
        storyId,
        userId: currentUser.id,
        points
      }
    });

    // Force a re-render by updating the current game
    dispatch({
      type: 'SET_CURRENT_GAME',
      payload: { gameId: game.id }
    });
  };

  const handleFinishVoting = (storyId: string) => {
    if (!game) return;

    dispatch({
      type: 'FINISH_VOTING',
      payload: { gameId: game.id, storyId }
    });
  };

  const handleCloseStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    setIsCloseStoryModalOpen(true);
  };

  const handleConfirmCloseStory = () => {
    if (!selectedStoryId || !game) return;

    dispatch({
      type: 'CLOSE_STORY',
      payload: {
        gameId: game.id,
        storyId: selectedStoryId,
        finalPoint: finalPoints
      }
    });

    setIsCloseStoryModalOpen(false);
    setSelectedStoryId(null);
    setFinalPoints(0);
  };

  const handleRestartVoting = (storyId: string) => {
    if (!game) return;

    dispatch({
      type: 'RESTART_VOTING',
      payload: { gameId: game.id, storyId }
    });
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!game) {
    return (
      <Center h="100vh">
        <Text>Game not found</Text>
      </Center>
    );
  }

  if (!currentUser && isJoining) {
    return (
      <Center h="100vh">
        <VStack spacing={4} w="300px">
          <Text fontSize="xl">Join Game: {game.name}</Text>
          <Input
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button
            colorScheme="blue"
            onClick={handleJoinGame}
            isDisabled={!userName.trim()}
          >
            Join Game
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>{game.name}</Heading>
        <Text>Players: {(game.users || []).map(user => user.name).join(', ')}</Text>

        {currentUser?.isAdmin && (
          <Button colorScheme="blue" onClick={onOpen}>
            Add New Story
          </Button>
        )}

        <VStack spacing={4} w="100%">
          {(game.stories || []).map(story => (
            <Card key={story.id} w="100%">
              <CardHeader>
                <Heading size="md">{story.title}</Heading>
                <Text fontSize="sm" color="blue.500">
                  <a href={story.jiraLink} target="_blank" rel="noopener noreferrer">
                    {story.jiraLink}
                  </a>
                </Text>
                <Badge colorScheme={story.status === 'voting' ? 'yellow' : story.status === 'finished' ? 'green' : 'gray'}>
                  {story.status}
                </Badge>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={4}>
                  {story.status === 'voting' && (
                    <HStack spacing={2}>
                      {[1, 2, 3, 5, 8, 13, 21].map(points => (
                        <Button
                          key={points}
                          colorScheme={selectedPoints[story.id] === points ? 'blue' : 'gray'}
                          onClick={() => handleVote(story.id, points)}
                        >
                          {points}
                        </Button>
                      ))}
                    </HStack>
                  )}
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Voting Status:</Text>
                    <HStack wrap="wrap" spacing={4}>
                      {game.users.map(user => (
                        <Card key={user.id} size="sm" variant="outline">
                          <CardBody p={2}>
                            <HStack>
                              <Text>{user.name}</Text>
                              {story.status === 'voting' ? (
                                story.votes && story.votes[user.id] !== undefined ? (
                                  <CheckIcon color="green.500" />
                                ) : (
                                  <CloseIcon color="red.500" />
                                )
                              ) : story.status === 'finished' ? (
                                <Text fontWeight="bold" color="blue.500">
                                  {story.votes?.[user.id] ?? '-'}
                                </Text>
                              ) : story.status === 'closed' ? (
                                <Text fontWeight="bold" color="blue.500">
                                  {story.votes?.[user.id] ?? '-'}
                                </Text>
                              ) : null}
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
              <CardFooter>
                {currentUser?.isAdmin && story.status === 'voting' && (
                  <Button colorScheme="green" onClick={() => handleFinishVoting(story.id)}>
                    Finish Voting
                  </Button>
                )}
                {currentUser?.isAdmin && story.status === 'finished' && (
                  <HStack>
                    <Button colorScheme="blue" onClick={() => handleCloseStory(story.id)}>
                      Close Story
                    </Button>
                    <Button colorScheme="yellow" onClick={() => handleRestartVoting(story.id)}>
                      Restart Voting
                    </Button>
                  </HStack>
                )}
              </CardFooter>
              {story.status === 'closed' && (
                <CardFooter>
                  <Text fontWeight="bold">Story Points: {story.finalPoint}</Text>
                </CardFooter>
              )}
            </Card>
          ))}
        </VStack>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Story</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Story Title"
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
              />
              <Input
                placeholder="Jira Link"
                value={newStoryLink}
                onChange={(e) => setNewStoryLink(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddStory}>
              Add Story
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCloseStoryModalOpen} onClose={() => setIsCloseStoryModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Close Story</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Final Story Points</FormLabel>
              <Input
                type="number"
                value={finalPoints}
                onChange={(e) => setFinalPoints(Number(e.target.value))}
                placeholder="Enter final story points"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleConfirmCloseStory}>
              Close Story
            </Button>
            <Button variant="ghost" onClick={() => setIsCloseStoryModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default GameComponent; 