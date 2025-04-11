import React from 'react';
import { useNewsAnalysis } from '../hooks/useNewsAnalysis';

export const NewsAnalysis: React.FC<{ articleId: string }> = ({ articleId }) => {
  const { analysis, marketReaction, loading } = useNewsAnalysis(articleId);

  if (loading) return <div>Loading analysis...</div>;

  return (
    <div className="news-analysis">
      {/* Market Impact Section */}
      {marketReaction && (
        <div className="market-impact">
          <h3>Market Impact</h3>
          <div className={`severity-indicator severity-${marketReaction.severity}`}>
            Severity: {marketReaction.severity}/5
          </div>
          <div className="immediate-reaction">
            <h4>Immediate Market Reaction</h4>
            {marketReaction.tickerReactions.map(reaction => (
              <div key={reaction.ticker} className="ticker-reaction">
                <span>{reaction.ticker}</span>
                <span className={reaction.priceChange > 0 ? 'positive' : 'negative'}>
                  {reaction.priceChange.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Section */}
      {analysis && (
        <div className="analysis-content">
          <h3>Analysis</h3>
          <div className="summary">{analysis.summary}</div>
          <div className="market-impact">
            <h4>Market Impact</h4>
            <div>Immediate: {analysis.marketImpact.immediate}</div>
            <div>Long Term: {analysis.marketImpact.longTerm}</div>
          </div>
          <div className="key-points">
            <h4>Key Points</h4>
            <ul>
              {analysis.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 