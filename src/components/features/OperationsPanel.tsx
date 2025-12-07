import React from 'react';
import { FiPlay, FiTrash2, FiCopy, FiDownload } from 'react-icons/fi';

interface OperationsPanelProps {
  selectedOperation: string;
  onOperationChange: (operation: string) => void;
  onProcess: () => void;
  onClearAll: () => void;
  onCopyOutput: () => void;
  inputText: string;
  outputText: string;
  processingTime?: number;
}

const OperationsPanel: React.FC<OperationsPanelProps> = ({
  selectedOperation,
  onOperationChange,
  onProcess,
  onClearAll,
  onCopyOutput,
  inputText,
  outputText,
  processingTime
}) => {
  const operations = [
    { value: 'removeExtraSpaces', label: 'Remove Extra Spaces', description: 'Removes multiple spaces, tabs' },
    { value: 'removeEmptyLines', label: 'Remove Empty Lines', description: 'Deletes blank lines' },
    { value: 'toLowerCase', label: 'To Lower Case', description: 'Converts to lowercase' },
    { value: 'toUpperCase', label: 'To Upper Case', description: 'Converts to uppercase' },
    { value: 'toTitleCase', label: 'To Title Case', description: 'Capitalizes each word' },
    { value: 'removeSpecialCharacters', label: 'Remove Special Chars', description: 'Removes @#$% symbols' },
    { value: 'removeNumbers', label: 'Remove Numbers', description: 'Deletes digits 0-9' },
    { value: 'removeDuplicates', label: 'Remove Duplicates', description: 'Removes duplicate lines' },
    { value: 'sortLines', label: 'Sort Lines', description: 'Sorts lines alphabetically' },
    { value: 'reverseText', label: 'Reverse Text', description: 'Reverses entire text' },
  ];

  const handleDownload = () => {
    if (!outputText) return;
    
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned-text-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Processing Tools</h3>
        {processingTime && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {processingTime.toFixed(0)} ms
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operations Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Cleaning Operation
          </label>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {operations.map((op) => (
              <div
                key={op.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOperation === op.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onOperationChange(op.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{op.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{op.description}</div>
                  </div>
                  {selectedOperation === op.value && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-4">
          <div className="space-y-3">
            <button
              onClick={onProcess}
              disabled={!inputText.trim()}
              className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium ${
                inputText.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FiPlay />
              <span>Process Text</span>
            </button>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onClearAll}
                className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiTrash2 className="text-gray-600 mb-1" />
                <span className="text-sm text-gray-700">Clear All</span>
              </button>

              <button
                onClick={onCopyOutput}
                disabled={!outputText}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
                  outputText
                    ? 'border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FiCopy className="mb-1" />
                <span className="text-sm">Copy Output</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputText}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg ${
                  outputText
                    ? 'border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FiDownload className="mb-1" />
                <span className="text-sm">Download</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Input Length</div>
                <div className="font-medium">{inputText.length} chars</div>
              </div>
              <div>
                <div className="text-gray-600">Output Length</div>
                <div className="font-medium">{outputText.length} chars</div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-gray-500">
            <div className="font-medium mb-1">Keyboard Shortcuts:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> +{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> = Process
              </div>
              <div>
                <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> +{' '}
                <kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd> = Copy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsPanel;