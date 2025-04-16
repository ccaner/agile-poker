# Agile Poker

A real-time planning poker application for agile teams to estimate story points collaboratively.

## Features

- Create and join planning poker games
- Add stories with titles and Jira links
- Real-time voting with standard Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- Admin controls for managing the voting process
- Real-time updates for all participants
- Persistent game state
- Mobile-friendly interface

## Tech Stack

- Frontend: React, TypeScript, Chakra UI
- Backend: Node.js, Express
- Real-time Communication: Socket.io
- Database: SQLite

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/agile-poker.git
cd agile-poker
```

2. Install dependencies:
```bash
npm install
cd backend
npm install
```

3. Start the development servers:
```bash
# Terminal 1 (Backend)
cd backend
npm start

# Terminal 2 (Frontend)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Usage

1. Create a new game as an admin
2. Share the game link with your team
3. Team members join with their names
4. Admin adds stories to estimate
5. Team members vote on stories
6. Admin reveals votes and sets final points
7. Repeat for all stories

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
