export interface UserStory {
    id: string;
    title: string;
    jiraLink: string;
    status: 'voting' | 'finished' | 'closed';
    votes: { [userId: string]: number };
    finalPoint?: number;
}

export interface User {
    id: string;
    name: string;
    isAdmin: boolean;
}

export interface Game {
    id: string;
    name: string;
    adminId: string;
    users: User[];
    stories: UserStory[];
    createdAt: string;
}

export type GameState = {
    games: { [gameId: string]: Game };
    currentUser?: User;
    currentGame?: Game;
} 