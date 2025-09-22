// src/services/storage/supabase/supabaseStorage.js
import { createClient } from '@supabase/supabase-js';
import logger from '../../../logger.js';

class SupabaseStorage {
  constructor(userId = null) {
    // Try all possible environment variable combinations
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.DB_URL;

    const supabaseKey =
      process.env.VITE_SUPABASE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SERVICE_KEY;

    // Debug environment variables
    logger.info('Supabase environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      userId: userId,
      urlStart: supabaseUrl?.substring(0, 20) + '...',
      envKeys: Object.keys(process.env).filter(key =>
        key.includes('SUPABASE') ||
        key.includes('DB_') ||
        key.includes('SERVICE_') ||
        key.includes('VITE_')
      )
    });

    if (!supabaseUrl || !supabaseKey) {
      const error = new Error('Missing Supabase credentials');
      error.details = {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        envKeys: Object.keys(process.env)
      };
      throw error;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.userId = userId; // Store user ID for data isolation
      logger.info(`SupabaseStorage initialized successfully for user: ${userId || 'global'}`);
    } catch (error) {
      logger.error('Failed to create Supabase client:', error);
      throw error;
    }
  }

  ensureDate(dateInput) {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    return new Date(dateInput);
  }

  generateUniqueKey(article) {
    // Create a composite key using URL, title, and date
    // Normalize and clean the inputs to ensure consistency
    const cleanTitle = (article.title || '').trim().toLowerCase();
    const cleanUrl = (article.url || '').trim().toLowerCase();
    const publishedAt = this.ensureDate(article.publishedAt || article.date).toISOString();
    
    return `${cleanUrl}_${cleanTitle}_${publishedAt}`;
  }

  async storeArticle(article) {
    try {
      const articleDate = article.publishedAt || article.date;
      
      const articleData = {
        title: article.title,
        content: article.content,
        url: article.url,
        published_at: this.ensureDate(articleDate),
        source: article.source || 'Trading Economics',
        category: article.category || 'Market News',
        sentiment_score: article.sentiment?.score || 0,
        sentiment_label: article.sentiment?.label || 'neutral',
        raw_data: article,
        unique_key: this.generateUniqueKey(article),
        created_at: new Date().toISOString()
      };

      // First check if article exists using unique_key instead of just URL
      const { data: existing } = await this.supabase
        .from('articles')
        .select('id, title, published_at, unique_key')
        .eq('unique_key', articleData.unique_key)
        .single();

      if (existing) {
        // Update existing article
        const { data, error } = await this.supabase
          .from('articles')
          .update(articleData)
          .eq('unique_key', articleData.unique_key)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new article
        const { data, error } = await this.supabase
          .from('articles')
          .insert([articleData])  // Note the array wrapper
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      logger.error('Failed to store article:', {
        error,
        article: {
          title: article.title,
          url: article.url
        }
      });
      throw error;
    }
  }

  async storeArticles(articles) {
    try {
      const uniqueArticles = Array.from(
        new Map(articles.map(article => [
          this.generateUniqueKey(article),
          article
        ])).values()
      );

      const articlesData = uniqueArticles.map(article => {
        const articleDate = article.publishedAt || article.date;
        return {
          title: article.title,
          content: article.content,
          url: article.url,
          published_at: this.ensureDate(articleDate),
          source: article.source || 'Trading Economics',
          category: article.category || 'Market News',
          sentiment_score: article.sentiment?.score || 0,
          sentiment_label: article.sentiment?.label || 'neutral',
          raw_data: article,
          unique_key: this.generateUniqueKey(article),
          user_id: this.userId, // Add user isolation
          created_at: new Date().toISOString()
        };
      });

      const { data, error } = await this.supabase
        .from('articles')
        .upsert(articlesData, {
          onConflict: 'unique_key',
          ignoreDuplicates: true
        })
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to store articles:', error);
      throw error;
    }
  }

  async getRecentArticles(limit = 100) {
    try {
      let query = this.supabase.from('articles');

      // Apply user isolation if userId is provided
      if (this.userId) {
        query = query.eq('user_id', this.userId);
      }

      // First get total count
      const { count, error: countError } = await query
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      logger.info(`Found ${count} articles in Supabase for user: ${this.userId || 'global'}`);

      // Then get articles
      const { data, error } = await query
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Log raw data from Supabase
      logger.info('Raw Supabase response:', {
        allUrls: data?.map(a => a.url),
        first: data?.[0]?.title,
        last: data?.[data.length - 1]?.title,
        returnedCount: data?.length,
        totalCount: count
      });
      
      // Transform data for frontend to match ProcessedArticle interface
      const transformedData = data?.map(article => ({
        id: article.id.toString(),
        raw: {
          title: article.title,
          content: article.content,
          url: article.url,
          publishedAt: article.published_at,
          source: article.source,
          summary: article.content, // Use content as summary for now
          sentiment: article.sentiment_score ? {
            score: article.sentiment_score,
            label: article.sentiment_label || 'neutral',
            confidence: 0.8
          } : undefined
        },
        summary: article.content,
        keyPoints: article.content ? article.content.split('. ').slice(0, 3).map(point => point + (point.endsWith('.') ? '' : '.')) : [],
        entities: {
          companies: article.category === 'stocks' ? [article.title.split(' ')[0]] : [],
          sectors: article.category === 'stock market' ? ['Financial Markets'] : [article.category],
          indicators: []
        },
        marketImpact: {
          shortTerm: {
            description: article.category === 'stocks' ? 'Potential impact on individual stock performance' : 'General market news',
            confidence: article.sentiment_score || 0,
            affectedSectors: article.category === 'stock market' ? ['Financial Markets'] : [article.category]
          },
          longTerm: {
            description: 'Long-term market implications to be determined',
            confidence: 0.5,
            potentialRisks: []
          }
        },
        sentiment: {
          score: article.sentiment_score || 0,
          label: article.sentiment_label || 'neutral',
          confidence: 0.8
        },
        publishedAt: article.published_at,
        created_at: article.created_at || article.published_at,
        category: article.category,
        importance: article.raw_data?.importance || 3
      })) || [];
      
      // Log transformed data
      logger.info('Transformed articles:', {
        count: transformedData.length,
        first: transformedData[0]?.title,
        last: transformedData[transformedData.length - 1]?.title
      });
      
      return {
        articles: transformedData,
        totalCount: count
      };
    } catch (error) {
      logger.error('Failed to get recent articles:', error);
      throw error;
    }
  }

  async storeArticleWithAnalysis(article, analysis) {
    try {
      logger.info('Storing article with analysis:', {
        title: article.raw?.title || article.title,
        url: article.raw?.url || article.url
      });

      // First store or update the article
      const articleData = {
        title: article.raw?.title || article.title,
        content: article.raw?.content || article.content || article.summary,
        url: article.raw?.url || article.url,
        published_at: this.ensureDate(article.raw?.publishedAt || article.published_at),
        source: article.raw?.source || article.source || 'Trading Economics',
        category: article.category || 'Market News',
        sentiment_score: analysis.sentiment?.score || article.sentiment?.score || 0,
        sentiment_label: analysis.sentiment?.label || article.sentiment?.label || 'neutral',
        raw_data: article,
        unique_key: this.generateUniqueKey(article.raw || article),
        created_at: new Date().toISOString()
      };

      // Check if article exists
      const { data: existing } = await this.supabase
        .from('articles')
        .select('id, title, unique_key')
        .eq('unique_key', articleData.unique_key)
        .single();

      let articleId;

      if (existing) {
        // Update existing article
        const { data, error } = await this.supabase
          .from('articles')
          .update(articleData)
          .eq('unique_key', articleData.unique_key)
          .select('id')
          .single();

        if (error) throw error;
        articleId = data.id;
        logger.info('Updated existing article:', articleId);
      } else {
        // Insert new article
        const { data, error } = await this.supabase
          .from('articles')
          .insert([articleData])
          .select('id')
          .single();

        if (error) throw error;
        articleId = data.id;
        logger.info('Created new article:', articleId);
      }

      // Now store the analysis
      const analysisData = {
        article_id: articleId,
        summary: analysis.summary,
        sentiment_score: analysis.sentiment?.score || 0,
        sentiment_label: analysis.sentiment?.label || 'neutral',
        sentiment_confidence: analysis.sentiment?.confidence || 0.8,
        market_impact_immediate: analysis.marketImpact?.immediate || '',
        market_impact_longterm: analysis.marketImpact?.longTerm || '',
        key_points: analysis.keyPoints || [],
        related_indicators: analysis.relatedIndicators || [],
        affected_sectors: analysis.marketImpact?.affectedSectors || [],
        created_at: new Date().toISOString()
      };

      // Check if analysis already exists for this article
      const { data: existingAnalysis } = await this.supabase
        .from('article_analysis')
        .select('id')
        .eq('article_id', articleId)
        .single();

      if (existingAnalysis) {
        // Update existing analysis
        const { error } = await this.supabase
          .from('article_analysis')
          .update(analysisData)
          .eq('article_id', articleId);

        if (error) throw error;
        logger.info('Updated existing analysis for article:', articleId);
      } else {
        // Insert new analysis
        const { error } = await this.supabase
          .from('article_analysis')
          .insert([analysisData]);

        if (error) throw error;
        logger.info('Created new analysis for article:', articleId);
      }

      return { articleId, success: true };

    } catch (error) {
      logger.error('Failed to store article with analysis:', {
        error: error.message,
        article: {
          title: article.raw?.title || article.title,
          url: article.raw?.url || article.url
        }
      });
      throw error;
    }
  }

  async getFullArticlesForAnalysis(limit = 50) {
    try {
      logger.info(`Fetching ${limit} full articles from Supabase for comprehensive analysis.`);

      // Get articles with all fields including raw_data for full content
      let query = this.supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      // Apply user isolation if userId is provided
      if (this.userId) {
        query = query.eq('user_id', this.userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      logger.info(`Retrieved ${data?.length || 0} articles from Supabase for analysis.`);
      logger.debug('Raw article data sample:', {
        sample: data?.slice(0, 2).map(a => ({
          id: a.id,
          title: a.title,
          hasRawData: !!a.raw_data,
          rawDataType: typeof a.raw_data,
          contentLength: a.content?.length || 0
        }))
      });

      // Return raw Supabase data without transformation for analysis
      return data || [];

    } catch (error) {
      logger.error('Error fetching full articles for analysis:', error);
      throw error;
    }
  }
}

export { SupabaseStorage };
export default SupabaseStorage;