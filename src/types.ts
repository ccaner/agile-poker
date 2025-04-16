export type StoryStatus = 'voting' | 'finished' | 'closed';

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface Story {
  id: string;
  title: string;
  jiraLink: string;
  status: StoryStatus;
  votes: { [userId: string]: number };
  finalPoint?: number;
}

export interface Game {
  id: string;
  name: string;
  users: User[];
  stories: Story[];
  currentStoryIndex: number;
  status: 'active' | 'finished';
}

export interface GameState {
  games: { [gameId: string]: Game };
  currentGame: Game | null;
  currentUser: User | null;
} 