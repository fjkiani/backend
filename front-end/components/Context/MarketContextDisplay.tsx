import React from 'react';
import { useMarketContext } from '../../hooks/useMarketContext';
import { Loader2, AlertCircle, BrainCircuit, Clock } from 'lucide-react';

// Helper function to format the timestamp
const formatTimestamp = (isoString: string | null): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString([], { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const MarketContextDisplay: React.FC = () => {
  const { contextText, generatedAt, loading, error, refetch } = useMarketContext();

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
      <h2 className="text-xl font-semibold text-indigo-800 mb-3 flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-indigo-600" />
        Overall Market Context
      </h2>

      {loading && (
        <div className="flex justify-center items-center p-6 text-indigo-700">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading Market Context...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-300 rounded-md p-3 flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading context:</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && contextText && (
        <div className="space-y-3">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {contextText}
          </p>
          <div className="text-xs text-gray-500 flex items-center justify-end gap-1 pt-2 border-t border-indigo-100">
            <Clock size={12} />
            <span>Last Generated: {formatTimestamp(generatedAt)}</span>
          </div>
        </div>
      )}
      
      {/* Handle the case where loading is false, no error, but context is null (e.g., initial state before fetch or 404) */} 
      {!loading && !error && !contextText && (
          <p className="text-sm text-gray-500 italic p-4 text-center">
            Market context is currently unavailable. Try generating it.
          </p>
      )}
    </div>
  );
}; 