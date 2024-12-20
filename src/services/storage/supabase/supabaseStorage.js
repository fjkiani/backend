// src/services/storage/supabase/supabaseStorage.js
import { createClient } from '@supabase/supabase-js';
import logger from '../../../logger.js';

export class SupabaseStorage {
  constructor() {
    // Debug Supabase config (safely)
    console.log('Supabase config:', {
      hasUrl: !!process.env.VITE_SUPABASE_URL,
      hasKey: !!process.env.VITE_SUPABASE_KEY,
      keyType: process.env.VITE_SUPABASE_KEY?.includes('service_role') ? 'service_role' : 'anon'
    });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase config: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  ensureDate(dateInput) {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    return new Date(dateInput);
  }

  async storeArticle(article) {
    try {
      const publishDate = article.publishedAt || article.published_at || article.date || new Date().toISOString();
      
      const articleData = {
        title: article.title,
        content: article.content,
        url: article.url,
        published_at: this.ensureDate(publishDate),
        source: article.source || 'Trading Economics',
        category: article.category,
        sentiment_score: article.sentiment?.score,
        sentiment_label: article.sentiment?.label,
        raw_data: article
      };

      const { data, error } = await this.supabase
        .from('articles')
        .upsert(articleData, {
          onConflict: 'url',
          ignoreDuplicates: true
        })
        .select();

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      logger.error('Failed to store article:', error);
      throw error;
    }
  }

  async storeArticles(articles, source = 'node-cron') {
    try {
      // Remove duplicates from the input array based on URL
      const uniqueArticles = Array.from(
        new Map(articles.map(article => [article.url, article])).values()
      );

      const articlesData = uniqueArticles.map(article => ({
        title: article.title,
        content: article.content,
        url: article.url,
        published_at: this.ensureDate(article.publishedAt),
        source: article.source || 'Trading Economics',
        category: article.category,
        sentiment_score: article.sentiment?.score,
        sentiment_label: article.sentiment?.label,
        raw_data: article,
        insertion_source: source
      }));

      const { data, error } = await this.supabase
        .from('articles')
        .upsert(articlesData, {
          onConflict: 'url',
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

  async getRecentArticles(limit = 100, lastTimestamp = null) {
    let query = this.supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (lastTimestamp) {
      query = query.gt('published_at', lastTimestamp);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getArticlesByCategory(category) {
    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('*')
        .eq('category', category)
        .order('published_at', { ascending: false });

      if (error) throw error;
      if (!data?.length) {
        logger.warn(`No articles found for category: ${category}`);
      }
      return data || [];
    } catch (error) {
      logger.error(`Failed to get articles for category ${category}:`, error);
      throw error;
    }
  }

  async searchArticles(query) {
    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('*')
        .textSearch('content', query)
        .order('published_at', { ascending: false });

      if (error) throw error;
      if (!data?.length) {
        logger.warn(`No articles found for search term: ${query}`);
      }
      return data || [];
    } catch (error) {
      logger.error(`Failed to search articles with query ${query}:`, error);
      throw error;
    }
  }

  async getArticleById(id) {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteArticle(where) {
    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('url', where.url);

    if (error) throw error;
  }

  async getCategories() {
    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('category');

      if (error) throw error;

      const categories = data.map(article => article.category);
      return [...new Set(categories)].filter(Boolean);
    } catch (error) {
      logger.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  async getSampleArticle() {
    try {
      const { data, error } = await this.supabase
        .from('articles')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get sample article:', error);
      throw error;
    }
  }
}
