import React, { useState, useEffect } from 'react';
import { NewsCard } from './NewsCard';
// Remove the import from the general types file
// import { ProcessedArticle } from '../../types/article'; 
// Import the type definition expected by NewsCard
import { ProcessedArticle } from '../../services/news/types';
import { Loader2, RefreshCw } from 'lucide-react';

// Interface matching the backend service's transformed article structure
// This interface might not be strictly needed anymore if we use the imported ProcessedArticle's raw field directly
interface RealTimeArticle {
  id: string; // ID might be string now
  title: string;
  content: string; // Placeholder content
  url: string;
  published_at: string; // ISO string
  source: string;
  category: string;
  created_at: string;
  updated_at: string;
  // Add other fields if they exist in the backend response
}

// Point to the local backend server during development
const BACKEND_URL = 'http://localhost:3001';

// Rename the component
export const RealTimeNews = () => {
  // Use the new interface name
  const [articles, setArticles] = useState<RealTimeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNews = async (forceRefresh = false) => {
    try {
      setIsRefreshing(forceRefresh);
      // Update the API endpoint path
      const response = await fetch(`${BACKEND_URL}/api/real-time-news/news${forceRefresh ? '?refresh=true' : ''}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ensure data.articles is an array before setting
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error("Fetch error:", error); // Log the error
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Poll every 5 minutes - consider if polling is still desired
    // const interval = setInterval(() => fetchNews(), 5 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true); // Show loading state on manual refresh
    setError(null); // Clear previous errors
    fetchNews(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        {/* Update display title */}
        <h2 className="text-xl font-semibold">Market News</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="text-red-500 p-4">
          Error fetching news: {error} <br />
          Please check the backend logs for more details.
        </div>
      ) : articles.length === 0 ? (
        <div className="text-gray-500 p-4">
          No market news available at this time.
        </div>
      ) : (
        articles.map(article => {
          // Create the structure expected by NewsCard (ProcessedArticle from services/news/types)
          const articleForCard: ProcessedArticle = {
            id: article.id,
            // Populate the 'raw' field with the basic article data
            raw: {
              title: article.title,
              content: article.content, // Placeholder content
              url: article.url,
              publishedAt: article.published_at, // Use ISO string
              source: article.source, // Use the fetched source name
              // Add other raw fields if available/needed, e.g., created_at
              created_at: article.created_at 
            },
            // Provide default/empty values for analysis fields
            summary: '',
            keyPoints: [],
            entities: {
              companies: [],
              sectors: [],
              indicators: []
            },
            sentiment: {
              score: 0,
              label: 'neutral',
              confidence: 0
            },
            marketImpact: {
              shortTerm: { description: '', confidence: 0, affectedSectors: [] },
              longTerm: { description: '', confidence: 0, potentialRisks: [] }
            }
          };

          return (
            <NewsCard 
              key={articleForCard.id} 
              article={articleForCard} 
            />
          );
        })
      )}
    </div>
  );
}; 