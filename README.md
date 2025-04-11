# CB News Feature

A real-time financial news aggregator and analysis platform that scrapes, processes, and analyzes market news using AI.

## Features

- Real-time news scraping from Trading Economics
- AI-powered news analysis with sentiment scoring
- Market impact assessment
- Supabase integration for data persistence
- Real-time updates and notifications

## Tech Stack

- Frontend:
  - React with TypeScript
  - Vite for build tooling
  - TanStack Query for data fetching
  - Lucide React for icons
  - Tailwind CSS for styling

- Backend:
  - Node.js with Express
  - Supabase for database
  - Winston for logging
  - CORS for cross-origin support

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Various API keys (see Environment Variables section)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd CB-news-feature-initial-setup
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in the required API keys and configuration values

### Environment Variables

Frontend (.env):
```
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Backend (.env):
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Running the Application

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

- Frontend is deployed on Vercel
- Backend is deployed on Vercel
- Database is hosted on Supabase

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 