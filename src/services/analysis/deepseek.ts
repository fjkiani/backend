import { ProcessedArticle } from '../news/types';
import { createClient } from '@supabase/supabase-js';

const COHERE_API_KEY = 'OPnR3L2JKy7VXt9MKeCM5KKhQxSZge4snUt6xwL0';
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

// Cache management with localStorage
class AnalysisCache {
  private static CACHE_KEY = 'news-analysis-cache';
  private static MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static MAX_CACHE_SIZE = 100; // Maximum number of cached analyses

  private static cache: Map<string, { timestamp: number; data: DeepSeekAnalysis }>;

  static {
    // Initialize cache from localStorage
    try {
      const stored = localStorage.getItem(AnalysisCache.CACHE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      AnalysisCache.cache = new Map(Object.entries(parsed));
      
      // Clean up old entries on initialization
      AnalysisCache.cleanup();
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      AnalysisCache.cache = new Map();
    }
  }

  static get(key: string): DeepSeekAnalysis | null {
    const entry = AnalysisCache.cache.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > AnalysisCache.MAX_CACHE_AGE) {
      AnalysisCache.cache.delete(key);
      AnalysisCache.saveToStorage();
      return null;
    }

    return entry.data;
  }

  static set(key: string, data: DeepSeekAnalysis): void {
    // Add new entry
    AnalysisCache.cache.set(key, {
      timestamp: Date.now(),
      data
    });

    // Cleanup if cache is too large
    if (AnalysisCache.cache.size > AnalysisCache.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(AnalysisCache.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      while (AnalysisCache.cache.size > AnalysisCache.MAX_CACHE_SIZE) {
        const [oldestKey] = entries.shift()!;
        AnalysisCache.cache.delete(oldestKey);
      }
    }

    // Save to localStorage
    AnalysisCache.saveToStorage();
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of AnalysisCache.cache.entries()) {
      if (now - entry.timestamp > AnalysisCache.MAX_CACHE_AGE) {
        AnalysisCache.cache.delete(key);
      }
    }
    AnalysisCache.saveToStorage();
  }

  private static saveToStorage(): void {
    try {
      const data = Object.fromEntries(AnalysisCache.cache.entries());
      localStorage.setItem(AnalysisCache.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }
}

export interface DeepSeekAnalysis {
  summary: string;
  sentiment: {
    score: number;
    label: string;
    confidence: number;
  };
  marketImpact: {
    immediate: string;
    longTerm: string;
    affectedSectors: string[];
  };
  keyPoints: string[];
  relatedIndicators: string[];
}

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function normalizeUrl(url: string): string {
  try {
    // Remove any trailing slashes
    url = url.replace(/\/+$/, '');
    
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove www. if present
    url = url.replace(/^(https?:\/\/)?(www\.)?/, '$1');
    
    return url.toLowerCase();
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url;
  }
}

async function storeArticleAndAnalysis(
  article: ProcessedArticle, 
  analysis: DeepSeekAnalysis
) {
  try {
    const normalizedUrl = normalizeUrl(article.raw.url);
    console.log('Looking for article with normalized URL:', {
      originalUrl: article.raw.url,
      normalizedUrl: normalizedUrl,
      title: article.raw.title
    });

    // First try exact URL match
    let { data: existingArticles, error: checkError } = await supabase
      .from('articles')
      .select('id, url, title')
      .eq('url', normalizedUrl);

    // If no match, try with the original URL
    if ((!existingArticles || existingArticles.length === 0) && article.raw.url) {
      const { data: originalUrlMatch } = await supabase
        .from('articles')
        .select('id, url, title')
        .eq('url', article.raw.url);
      
      if (originalUrlMatch && originalUrlMatch.length > 0) {
        existingArticles = originalUrlMatch;
      }
    }

    if (checkError) throw checkError;

    // Get or create article ID
    let articleId: number;
    
    if (existingArticles && existingArticles.length > 0) {
      // Use the first matching article
      console.log('Found existing article:', {
        title: existingArticles[0].title,
        url: existingArticles[0].url
      });
      articleId = existingArticles[0].id;
    } else {
      // Try searching by title as a last resort
      const { data: titleMatch } = await supabase
        .from('articles')
        .select('id, url, title')
        .eq('title', article.raw.title);

      if (titleMatch && titleMatch.length > 0) {
        console.log('Found article by title match:', titleMatch[0].title);
        articleId = titleMatch[0].id;
      } else {
        console.log('Article not found in database:', {
          title: article.raw.title,
          url: article.raw.url,
          normalizedUrl
        });
        throw new Error('Article not found in database. Please ensure the article exists before running analysis.');
      }
    }

    // Check if analysis already exists for this article
    const { data: existingAnalysis } = await supabase
      .from('article_analysis')
      .select('*')
      .eq('article_id', articleId);

    if (existingAnalysis && existingAnalysis.length > 0) {
      console.log('Analysis already exists for article:', article.raw.title);
      return { article: { id: articleId }, analysis: existingAnalysis[0] };
    }

    // Create the analysis only if it doesn't exist
    const { data: storedAnalysis, error: analysisError } = await supabase
      .from('article_analysis')
      .insert({
        article_id: articleId,
        summary: analysis.summary,
        sentiment_score: analysis.sentiment.score,
        sentiment_label: analysis.sentiment.label,
        sentiment_confidence: analysis.sentiment.confidence,
        market_impact_immediate: analysis.marketImpact.immediate,
        market_impact_longterm: analysis.marketImpact.longTerm,
        key_points: analysis.keyPoints,
        related_indicators: analysis.relatedIndicators,
        affected_sectors: analysis.marketImpact.affectedSectors,
      })
      .select()
      .single();

    if (analysisError) throw analysisError;
    console.log('Successfully stored analysis for article:', article.raw.title);

    return { article: { id: articleId }, analysis: storedAnalysis };
  } catch (error) {
    console.error('Failed to store article and analysis:', error);
    throw error;
  }
}

export const analyzeArticle = async (
  article: ProcessedArticle
): Promise<DeepSeekAnalysis> => {
  console.log('Processing article:', {
    id: article.id,
    title: article.raw.title,
    url: article.raw.url
  });

  const normalizedUrl = normalizeUrl(article.raw.url);

  // First check if article exists with analysis
  const { data: existingArticles, error: checkError } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      article_analysis (
        summary,
        sentiment_score,
        sentiment_label,
        sentiment_confidence,
        market_impact_immediate,
        market_impact_longterm,
        key_points,
        related_indicators,
        affected_sectors
      )
    `)
    .eq('url', normalizedUrl);

  // Remove the maybeSingle() and handle multiple results
  if (checkError) {
    console.error('Error checking for existing article:', checkError);
    throw checkError;
  }

  // If we have existing articles with analysis, use the first one
  if (existingArticles && existingArticles.length > 0) {
    const articleWithAnalysis = existingArticles.find(article => 
      article.article_analysis && article.article_analysis.length > 0
    );

    if (articleWithAnalysis) {
      console.log('Found existing analysis in database for:', article.raw.title);
      const analysis = articleWithAnalysis.article_analysis[0];
      
      return {
        summary: analysis.summary,
        sentiment: {
          score: analysis.sentiment_score,
          label: analysis.sentiment_label,
          confidence: analysis.sentiment_confidence
        },
        marketImpact: {
          immediate: analysis.market_impact_immediate,
          longTerm: analysis.market_impact_longterm,
          affectedSectors: analysis.affected_sectors
        },
        keyPoints: analysis.key_points,
        relatedIndicators: analysis.related_indicators
      };
    }
  }

  // Check local cache
  const cacheKey = `analysis:${article.id}`;
  const cachedAnalysis = AnalysisCache.get(cacheKey);
  if (cachedAnalysis) {
    console.log('Retrieved analysis from local cache for:', article.raw.title);
    // Store cached analysis in Supabase if we have an existing article
    if (existingArticles && existingArticles.length > 0) {
      const articleWithAnalysis = existingArticles.find(article => 
        article.article_analysis && article.article_analysis.length > 0
      );

      if (articleWithAnalysis) {
        await storeArticleAndAnalysis(article, cachedAnalysis);
      }
    }
    return cachedAnalysis;
  }

  // Generate new analysis
  console.log('Generating new analysis for:', article.raw.title);
  
  const prompt = `
    Analyze this financial news article and provide insights in JSON format.
    
    Article Title: ${article.raw.title}
    Article Content: ${article.raw.content}
    
    Provide your analysis in this exact JSON structure:
    {
      "summary": "Brief 2-3 sentence summary of the article",
      "sentiment": {
        "score": "number between -1 and 1",
        "label": "one of: positive, negative, neutral",
        "confidence": "number between 0 and 1"
      },
      "marketImpact": {
        "immediate": "1-2 sentence analysis of short-term market impact",
        "longTerm": "1-2 sentence analysis of long-term implications",
        "affectedSectors": ["list", "of", "affected", "sectors"]
      },
      "keyPoints": [
        "3-5 key points from the article"
      ],
      "relatedIndicators": [
        "list of relevant economic indicators"
      ]
    }
    
    Return only the JSON object, no other text.
  `.trim();

  const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COHERE_API_KEY}`,
      'Cohere-Version': '2022-12-06'
    },
    body: JSON.stringify({
      model: 'command',
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.3,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.generations[0].text;
  console.log('Raw API response:', content);

  try {
    const result = JSON.parse(content);
    const analysis = {
      summary: result.summary || "Analysis completed",
      sentiment: {
        score: Number(result.sentiment?.score) || 0,
        label: result.sentiment?.label || "neutral",
        confidence: Number(result.sentiment?.confidence) || 0
      },
      marketImpact: {
        immediate: result.marketImpact?.immediate || "No immediate impact analysis",
        longTerm: result.marketImpact?.longTerm || "No long-term impact",
        affectedSectors: Array.isArray(result.marketImpact?.affectedSectors) 
          ? result.marketImpact.affectedSectors 
          : []
      },
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : ["No key points available"],
      relatedIndicators: Array.isArray(result.relatedIndicators) ? result.relatedIndicators : []
    };

    // Store in local cache
    AnalysisCache.set(cacheKey, analysis);
    console.log('Cached analysis for:', article.raw.title);
    
    // Only store in Supabase if we don't already have an article with analysis
    const { data: finalCheck } = await supabase
      .from('articles')
      .select('id, article_analysis!inner(*)')
      .eq('url', normalizedUrl)
      .maybeSingle();

    if (!finalCheck) {
      await storeArticleAndAnalysis(article, analysis);
    }

    return analysis;
  } catch (parseError) {
    console.error('Parse error:', parseError, 'Content:', content);
    throw new Error('Failed to parse response');
  }
}; 