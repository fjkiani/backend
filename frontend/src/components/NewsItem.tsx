import React from 'react';
import './NewsItem.css';

export const NewsItem: React.FC<{ article: any }> = ({ article }) => {
  const hasAnalysis = article.analysis && article.classification?.importance >= 4;
  
  return (
    <div className={`news-item ${hasAnalysis ? 'high-impact' : ''}`}>
      <div className="news-header">
        <h3>{article.title}</h3>
        {hasAnalysis && (
          <div className="impact-indicators">
            <span className="high-impact-badge">
              High Impact ({article.classification.importance}/5)
            </span>
            <span className="category-badge">
              {article.classification.type}
            </span>
          </div>
        )}
      </div>

      {hasAnalysis && (
        <div className="analysis-details">
          <div className="summary-section">
            <h4>Summary</h4>
            <p>{article.analysis.summary}</p>
          </div>

          <div className="market-impact-section">
            <h4>Market Impact</h4>
            <div className="impact-immediate">
              <strong>Immediate:</strong> {article.analysis.marketImpact.immediate}
            </div>
            <div className="impact-sectors">
              <strong>Affected Sectors:</strong>
              {article.analysis.marketImpact.affectedSectors.map(sector => (
                <span key={sector} className="sector-tag">{sector}</span>
              ))}
            </div>
          </div>

          <div className="key-points-section">
            <h4>Key Points</h4>
            <ul>
              {article.analysis.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 