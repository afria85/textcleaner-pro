import React from 'react';
import { FiClock, FiTrash2, FiRepeat, FiCheckCircle } from 'react-icons/fi';
import { HistoryItem } from '../../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onRestoreItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClearHistory,
  onRestoreItem,
  onDeleteItem,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

  const getOperationLabel = (op: string) => {
    const labels: Record<string, string> = {
      removeExtraSpaces: 'Remove Spaces',
      removeEmptyLines: 'Remove Empty Lines',
      toLowerCase: 'To Lowercase',
      toUpperCase: 'To Uppercase',
      toTitleCase: 'Title Case',
      removeSpecialCharacters: 'Remove Special',
      removeNumbers: 'Remove Numbers',
      removeDuplicates: 'Remove Duplicates',
      sortLines: 'Sort Lines',
      reverseText: 'Reverse Text',
    };
    return labels[op] || op;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FiClock className="text-blue-500 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">Processing History</h3>
          {history.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
              {history.length} {history.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-2 px-3 py-2 hover:bg-red-50 rounded-lg"
          >
            <FiTrash2 />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10">
          <FiClock className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No history yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Processed text will appear here for quick access
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getOperationLabel(item.operation)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-gray-600">
                      <span className="font-medium">{item.stats.inputLength}</span> ?{' '}
                      <span className="font-medium">{item.stats.outputLength}</span> chars
                    </div>
                    {item.stats.reduction > 0 && (
                      <div className="text-green-600 font-medium">
                        Saved {item.stats.reduction.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRestoreItem(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Restore this text"
                  >
                    <FiRepeat />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete from history"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Input Preview</div>
                  <div className="font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 truncate">
                    {item.inputPreview || <span className="text-gray-400">Empty</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Output Preview</div>
                  <div className="font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 truncate">
                    {item.outputPreview || <span className="text-gray-400">Empty</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Input: {item.stats.inputLength} chars</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiCheckCircle className="text-green-500" />
                    <span>Output: {item.stats.outputLength} chars</span>
                  </div>
                </div>
                <button
                  onClick={() => onRestoreItem(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Restore ?
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p className="flex items-center">
              <FiClock className="mr-2" />
              <span>History is automatically saved. Click "Restore" to load previous results.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;