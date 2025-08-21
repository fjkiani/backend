import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NewsGrid } from '../News/NewsGrid';
import { SentimentOverview } from '../Analysis/SentimentOverview';
import { MarketRelationshipGraph } from '../Analysis/MarketRelationshipGraph';
import { ServiceStatus } from './ServiceStatus';
import { useNewsScraper } from '../../hooks/useNewsScraper';
import { useNewsProcessor } from '../../hooks/useNewsProcessor';
import { Newspaper, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { RealTimeNews } from '../News/RealTimeNews';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { RawNewsArticle } from '../../types';
import { RawNewsArticle as ServiceRawNewsArticle } from '../../services/news/types';
import { EconomicCalendar } from '../Calendar/EconomicCalendar';
import { EarningsCalendar } from '../Calendar/EarningsCalendar';
import { useMarketContext } from '../../hooks/useMarketContext';
import { MarketContextDisplay } from '../Context/MarketContextDisplay';
import { config } from '../../config';

export const NewsDashboard: React.FC = () => {
  const { news, loading: newsLoading, error: newsError } = useNewsScraper();

  // --- State for TE Market Overview ---
  const [teMarketOverview, setTeMarketOverview] = useState<string | null>(null);
  const [isTeOverviewLoading, setIsTeOverviewLoading] = useState(false);
  const [teOverviewError, setTeOverviewError] = useState<string | null>(null);
  // --- Ref to track if overview was fetched for the current news set ---
  const overviewFetchedForNewsRef = useRef<RawNewsArticle[] | null>(null);
  // --- End State ---

  // --- Use Market Context Hook --- 
  const { refetch: refetchMarketContext } = useMarketContext(); // Get the refetch function
  // We don't need the contextText/loading state here, MarketContextDisplay handles it

  // --- State for Manual Trigger --- 
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  // --- Fetch Function for TE Market Overview ---
  const fetchTeMarketOverview = async (articlesToAnalyze: RawNewsArticle[]) => {
    console.log('[fetchTeMarketOverview] STARTING fetch.'); // Log start
    if (articlesToAnalyze.length === 0) {
      setTeMarketOverview(null);
      return;
    }
    
    setIsTeOverviewLoading(true);
    setTeOverviewError(null);
    // setTeMarketOverview(null); // --- Temporarily COMMENT OUT immediate clearing ---
    console.log('[fetchTeMarketOverview] State set to loading.');
    
    try {
      console.log('Requesting TE market overview for', articlesToAnalyze.length, 'articles');
      // Ensure the articles sent have the structure expected by the backend (title, url, content)
      const payload = articlesToAnalyze.map(a => ({
          title: a.title,
          url: a.url,
          content: a.content // Assuming content holds the summary from useNewsScraper
      }));
      
      const response = await fetch(`${config.BACKEND_URL}/api/analysis/trading-economics-overview`, {
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
      console.log('[fetchTeMarketOverview] Fetch successful. Response data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTeMarketOverview(data.overview || 'TE Overview generation returned empty (from backend).'); // Set overview on success
      console.log('[fetchTeMarketOverview] State set with overview:', data.overview?.substring(0,50) + '...'); // Log setting state
      console.log('TE Market overview debug info:', data.debug);
      
    } catch (error: unknown) {
      console.error("[fetchTeMarketOverview] Fetch error:", error); // Log error
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during TE overview generation';
      setTeOverviewError(errorMessage);
      setTeMarketOverview(null); // <-- Clear overview ONLY on error -->
      console.log('[fetchTeMarketOverview] State cleared due to error.');
    } finally {
      setIsTeOverviewLoading(false);
      console.log('[fetchTeMarketOverview] FINISHED fetch (finally block).'); // Log finish
    }
  };
  // --- End Fetch Function ---
  
  // --- Trigger TE Overview Fetch --- 
  useEffect(() => {
    console.log('[useEffect TE Overview] Running effect. Conditions:', {
      newsLoading,
      newsError: newsError === null,
      newsLength: news.length > 0,
      // Check if news object reference has changed AND we haven't fetched for it
      needsFetch: news !== overviewFetchedForNewsRef.current
    });
    // Fetch overview only when news is loaded, not loading, no error, 
    // there are articles, AND we haven't fetched for this specific news array instance yet.
    if (!newsLoading && newsError === null && news.length > 0 && news !== overviewFetchedForNewsRef.current) {
      console.log('[useEffect TE Overview] Conditions MET. Calling fetchTeMarketOverview.');
      fetchTeMarketOverview(news);
      // Mark that we have fetched for this news array instance
      overviewFetchedForNewsRef.current = news;
    }
  }, [news, newsLoading, newsError]); // Keep dependencies, but add check inside
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

  // --- Handle Manual Context Generation Trigger --- 
  const handleGenerateContext = async () => {
    setIsGeneratingContext(true);
    setTriggerError(null);
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/context/generate-now`, {
        method: 'POST',
      });
      if (!response.ok || response.status !== 202) { // Check for 202 Accepted
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Trigger failed: ${response.status} - ${errorData.error || response.statusText}`);
      }
      console.log('[NewsDashboard] Context generation trigger successful.');
      // Wait a short moment before refetching to give backend time to process
      setTimeout(() => {
        refetchMarketContext(); 
        console.log('[NewsDashboard] Refetching market context after trigger.');
      }, 2000); // 2-second delay (adjust as needed)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown trigger error';
      setTriggerError(errorMessage);
      console.error('[NewsDashboard] Error triggering context generation:', err);
    } finally {
      setIsGeneratingContext(false);
    }
  };

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

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* --- Overall Market Context Display --- */}
          <MarketContextDisplay />

          {/* --- Manual Trigger Button --- */}
          <div className="text-right">
            <button
              onClick={handleGenerateContext}
              disabled={isGeneratingContext}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingContext ? 'animate-spin' : ''}`} />
              {isGeneratingContext ? 'Generating Context...' : 'Generate/Update Context'}
            </button>
            {triggerError && (
              <p className="text-xs text-red-600 mt-1">Error: {triggerError}</p>
            )}
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
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
            <EconomicCalendar />
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