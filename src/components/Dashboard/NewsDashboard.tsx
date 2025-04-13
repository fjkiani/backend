import React, { useState, useMemo, useEffect } from 'react';
import { NewsGrid } from '../News/NewsGrid';
import { SentimentOverview } from '../Analysis/SentimentOverview';
import { MarketRelationshipGraph } from '../Analysis/MarketRelationshipGraph';
import { ServiceStatus } from './ServiceStatus';
import { useNewsScraper } from '../../hooks/useNewsScraper';
import { useNewsProcessor } from '../../hooks/useNewsProcessor';
import { Newspaper, AlertCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { RealTimeNews } from '../News/RealTimeNews';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { RawNewsArticle } from '../../types';
import { RawNewsArticle as ServiceRawNewsArticle } from '../../services/news/types';
import { EconomicCalendar } from '../Calendar/EconomicCalendar';
import { EarningsCalendar } from '../Calendar/EarningsCalendar';

// Assume backend URL is defined or imported
const BACKEND_URL = 'http://localhost:3001';

export const NewsDashboard: React.FC = () => {
  const { news, loading: newsLoading, error: newsError } = useNewsScraper();

  // --- State for TE Market Overview ---
  const [teMarketOverview, setTeMarketOverview] = useState<string | null>(null);
  const [isTeOverviewLoading, setIsTeOverviewLoading] = useState(false);
  const [teOverviewError, setTeOverviewError] = useState<string | null>(null);
  // --- End State ---

  // --- Fetch Function for TE Market Overview ---
  const fetchTeMarketOverview = async (articlesToAnalyze: RawNewsArticle[]) => {
    if (articlesToAnalyze.length === 0) {
      setTeMarketOverview(null);
      return;
    }
    
    setIsTeOverviewLoading(true);
    setTeOverviewError(null);
    setTeMarketOverview(null);
    
    try {
      console.log('Requesting TE market overview for', articlesToAnalyze.length, 'articles');
      // Ensure the articles sent have the structure expected by the backend (title, url, content)
      const payload = articlesToAnalyze.map(a => ({
          title: a.title,
          url: a.url,
          content: a.content // Assuming content holds the summary from useNewsScraper
      }));
      
      const response = await fetch(`${BACKEND_URL}/api/analysis/trading-economics-overview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articles: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('TE Market overview response received:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTeMarketOverview(data.overview || 'TE Overview generation returned empty.');
      console.log('TE Market overview debug info:', data.debug);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during TE overview generation';
      setTeOverviewError(errorMessage);
      console.error("TE Market overview fetch error:", error);
    } finally {
      setIsTeOverviewLoading(false);
    }
  };
  // --- End Fetch Function ---
  
  // --- Trigger TE Overview Fetch --- 
  useEffect(() => {
    // Fetch overview only when news is loaded, not loading, and there are articles
    if (!newsLoading && newsError === null && news.length > 0) {
      fetchTeMarketOverview(news); 
    }
  }, [news, newsLoading, newsError]); // Depend on news data and loading/error status
  // --- End Trigger ---

  const newsForProcessor: ServiceRawNewsArticle[] = useMemo(() => {
    return news.map(article => ({
      ...article,
      tags: article.tags?.map(tagString => ({ label: tagString, score: 0 })) ?? undefined,
    }));
  }, [news]);

  const { processedArticles, loading: processingLoading, error: processingError } = useNewsProcessor(newsForProcessor);

  const isLoading = newsLoading || processingLoading;
  const error = newsError || processingError;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Newspaper className="w-6 h-6 text-blue-600" />
                Market Intelligence Dashboard
              </h1>
              <ServiceStatus />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-700 font-medium">{error.message}</p>
                <p className="text-red-600 text-sm mt-1">
                  Please ensure the backend service is running and try again
                </p>
              </div>
            </div>
          ) : null}

          {/* Display Economic Calendar above the tabs/news grid */}
          <div className="mb-6">
            <EconomicCalendar marketOverview={teMarketOverview} />
          </div>

          {/* Display Earnings Calendar */}
          <div className="mb-6">
            <EarningsCalendar />
          </div>

          <Tabs defaultValue="trading-economics">
            <TabsList className="mb-4">
              <TabsTrigger value="trading-economics">Trading Economics</TabsTrigger>
              <TabsTrigger value="investing11">Investing11</TabsTrigger>
            </TabsList>

            <TabsContent value="trading-economics">
              <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Trading Economics - Market Overview</h3>
                {isTeOverviewLoading ? (
                  <div className="flex items-center text-green-700">
                     <Loader2 className="animate-spin mr-2" size={16} />
                     <span>Generating overview...</span>
                  </div>
                ) : teOverviewError ? (
                  <p className="text-red-600">Error generating overview: {teOverviewError}</p>
                ) : teMarketOverview ? (
                  <p className="text-green-900 whitespace-pre-wrap">{teMarketOverview}</p>
                ) : newsLoading ? (
                   <p className="text-gray-500 italic">Loading news before generating overview...</p>
                ) : (
                  <p className="text-gray-500 italic">Market overview will be generated based on key articles.</p>
                )}
              </div>
            
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <NewsGrid articles={processedArticles} loading={newsLoading} />
                </div>
                <div className="space-y-6">
                  <SentimentOverview articles={processedArticles} />
                  <MarketRelationshipGraph articles={processedArticles} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="investing11">
              <RealTimeNews />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  );
};