import React from 'react';
import { NewsDashboard } from './components/Dashboard/NewsDashboard';
import { RealTimeNews } from './components/News/RealTimeNews';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NewsDashboard />
      <RealTimeNews />
    </QueryClientProvider>
  );
}

export default App;