export interface ProcessedArticle {
  id: string;
  raw: {
    title: string;
    content: string;
    url: string;
    publishedAt: string;
    source?: string;
    naturalLanguage?: string;
    tags?: string[];
    created_at?: string;
  };
  summary?: string;
  keyPoints?: string[];
  entities?: {
    companies: string[];
    sectors: string[];
    indicators: string[];
  };
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  marketImpact?: {
    shortTerm: {
      description: string;
      confidence: number;
      affectedSectors: string[];
    };
    longTerm: {
      description: string;
      confidence: number;
      potentialRisks: string[];
    };
  };
  classification?: {
    type: string;
    importance: number;
  };
}

export interface DeepSeekAnalysis {
  summary: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
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