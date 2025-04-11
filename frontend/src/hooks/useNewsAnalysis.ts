import { useState, useEffect } from 'react';
import { useNewsApi } from '../api/newsApi';

export const useNewsAnalysis = (articleId: string) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [marketReaction, setMarketReaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const newsApi = useNewsApi();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await newsApi.getArticleAnalysis(articleId);
        setAnalysis(data.analysis);
        setMarketReaction(data.marketImpact);
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [articleId]);

  return { analysis, marketReaction, loading };
}; 