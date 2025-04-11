import React, { useState } from 'react';
import './NewsArticle.css';

export const NewsArticle: React.FC<{ article: any }> = ({ article }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="news-article">
      <h1>{article.title}</h1>
      <div className="article-meta">
        <time>{new Date(article.publishedAt).toLocaleString()}</time>
      </div>

      <div className="article-content">
        <p>{article.content}</p>
      </div>

      {article.analysis && (
        <div className="analysis-section">
          <button 
            className="analysis-toggle"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            {showAnalysis ? 'Hide AI Analysis' : 'Show AI Analysis'}
          </button>

          {showAnalysis && (
            <div className="ai-analysis">
              <div className="analysis-summary">
                <h3>AI Summary</h3>
                <p>{article.analysis.summary}</p>
              </div>

              <div className="market-impact">
                <h3>Market Impact</h3>
                <p><strong>Immediate:</strong> {article.analysis.marketImpact.immediate}</p>
                <p><strong>Long Term:</strong> {article.analysis.marketImpact.longTerm}</p>
              </div>

              <div className="key-points">
                <h3>Key Points</h3>
                <ul>
                  {article.analysis.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 