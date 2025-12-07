import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import TextStatistics from './components/features/TextStatistics';
import OperationsPanel from './components/features/OperationsPanel';
import { textUtils, ProcessingResult } from './utils/textProcessor';
import TextEditor from './components/features/TextEditor';
import HistoryPanel from './components/features/HistoryPanel';
import useLocalStorage from './hooks/useLocalStorage';
import { HistoryItem } from './types';

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedOperation, setSelectedOperation] = useState('removeExtraSpaces');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('textcleaner-history', []);

  const handleProcessText = useCallback(() => {
    if (!inputText.trim()) return;
    
    const result = textUtils.process(inputText, [selectedOperation]);
    setOutputText(result.text);
    setProcessingResult(result);

    // Add to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      inputPreview: inputText.length > 100 ? inputText.substring(0, 100) + '...' : inputText,
      outputPreview: result.text.length > 100 ? result.text.substring(0, 100) + '...' : result.text,
      operation: selectedOperation,
      stats: {
        inputLength: inputText.length,
        outputLength: result.text.length,
        reduction: inputText.length > 0 
          ? ((inputText.length - result.text.length) / inputText.length) * 100 
          : 0,
      },
    };

    setHistory(prev => [historyItem, ...prev.slice(0, 9)]);
  }, [inputText, selectedOperation, setHistory]);

  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
    setProcessingResult(null);
  };

  const handleCopyOutput = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      alert('Output copied to clipboard!');
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleRestoreHistoryItem = (item: HistoryItem) => {
    setOutputText(item.outputPreview);
    setSelectedOperation(item.operation);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleProcessText();
      }
      
      if (e.ctrlKey && e.key === 'c' && outputText) {
        handleCopyOutput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleProcessText, outputText]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TextEditor
              value={inputText}
              onChange={setInputText}
              placeholder="Paste your text here or use Ctrl+V..."
              label="Input"
              onClear={() => setInputText('')}
              onPaste={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setInputText(text);
                } catch (err) {
                  alert('Failed to paste from clipboard');
                }
              }}
            />
            
            <TextEditor
              value={outputText}
              placeholder="Cleaned text will appear here..."
              label="Output"
              readOnly
              showStats
              onClear={() => setOutputText('')}
              onCopy={handleCopyOutput}
            />
          </div>

          <div className="mt-6">
            <OperationsPanel
              selectedOperation={selectedOperation}
              onOperationChange={setSelectedOperation}
              onProcess={handleProcessText}
              onClearAll={handleClearAll}
              onCopyOutput={handleCopyOutput}
              inputText={inputText}
              outputText={outputText}
              processingTime={processingResult?.processingTime}
            />
          </div>

          <div className="mt-6">
            <TextStatistics text={inputText} />
          </div>

          {processingResult && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Processing Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-blue-600 font-medium">Processing Time</div>
                  <div className="text-2xl font-bold text-blue-700">{processingResult.processingTime.toFixed(0)}ms</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-600 font-medium">Input Characters</div>
                  <div className="text-2xl font-bold text-gray-800">{textUtils.getStats(inputText).characters}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-600 font-medium">Output Characters</div>
                  <div className="text-2xl font-bold text-gray-800">{processingResult.stats.characters}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-600 font-medium">Words Reduced</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {textUtils.getStats(inputText).words - processingResult.stats.words}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-600 font-medium">Space Saved</div>
                  <div className="text-2xl font-bold text-green-600">
                    {(((textUtils.getStats(inputText).characters - processingResult.stats.characters) / 
                      textUtils.getStats(inputText).characters) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <HistoryPanel
              history={history}
              onClearHistory={handleClearHistory}
              onRestoreItem={handleRestoreHistoryItem}
              onDeleteItem={handleDeleteHistoryItem}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;