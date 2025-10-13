# 🚀 Market Intelligence Dashboard Frontend

A comprehensive React-based frontend for the Market Intelligence Dashboard, providing real-time market analysis, news processing, and financial data visualization.

## 🌟 Features

- **Real-time News Analysis**: Live market news with AI-powered sentiment analysis
- **Market Intelligence**: Comprehensive market overview and relationship mapping
- **Earnings Calendar**: Interactive earnings calendar with trend analysis
- **Economic Calendar**: Economic events and indicators tracking
- **Admin Dashboard**: Agent management and system monitoring
- **Authentication**: Secure user authentication with Supabase
- **Responsive Design**: Modern UI with Tailwind CSS

## 🔗 Backend Integration

This frontend is connected to the Railway-deployed backend:
- **Backend URL**: `https://web-production-9a14.up.railway.app`
- **API Endpoints**: News, earnings calendar, market analysis
- **Real-time Updates**: WebSocket connections for live data

## 🛠️ Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **React Query** for state management
- **Supabase** for authentication
- **Axios** for API communication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/fjkiani/cb-v2.git
cd cb-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_BACKEND_URL=https://web-production-9a14.up.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to GitHub Pages
```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 API Endpoints

The frontend connects to these backend endpoints:

- `GET /api/health` - Health check
- `GET /api/news` - Latest market news
- `GET /api/calendar/earnings` - Earnings calendar data
- `GET /api/calendar/economic` - Economic calendar data
- `POST /api/schedule/run-minute-scrape` - Trigger news scraping

## 🔧 Configuration

The application configuration is managed in `src/config.ts`:

```typescript
export const config = {
  BACKEND_URL: 'https://web-production-9a14.up.railway.app',
  API_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;
```

## 📱 Components

### Core Components
- **NewsDashboard**: Main news feed with real-time updates
- **EarningsCalendar**: Interactive earnings calendar
- **EconomicCalendar**: Economic events tracking
- **MarketOverview**: Market sentiment and analysis
- **AdminDashboard**: System administration interface

### UI Components
- **NewsCard**: Individual news article display
- **NewsGrid**: Grid layout for news articles
- **MarketSentimentGauge**: Visual sentiment indicators
- **ServiceStatus**: Backend service status monitoring

## 🔐 Authentication

The application uses Supabase for authentication:
- User registration and login
- Protected routes and components
- User profile management
- Session management

## 📈 Market Intelligence Features

- **Real-time News Processing**: Automated news scraping and analysis
- **Sentiment Analysis**: AI-powered market sentiment tracking
- **Relationship Mapping**: Market entity relationship visualization
- **Trend Analysis**: Historical data analysis and predictions
- **Context Generation**: Market context and insights

## 🚨 Troubleshooting

### Common Issues

1. **Backend Connection Issues**
   - Verify `VITE_BACKEND_URL` is set correctly
   - Check Railway backend status
   - Ensure CORS is configured properly

2. **Authentication Issues**
   - Verify Supabase credentials
   - Check authentication context setup
   - Ensure proper environment variables

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the backend documentation
- Review the Railway deployment logs

---

**Built with ❤️ for Market Intelligence**