import React, { useState, useCallback } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiFileText } from 'react-icons/fi';
import { textUtils, ProcessingResult } from '../../utils/textProcessor';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface FileItem {
  id: string;
  name: string;
  content: string;
  processedContent?: string;
  stats?: TextStats;
}

const BatchProcessor: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedOperation, setSelectedOperation] = useState('removeExtraSpaces');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: FileItem[] = [];
    
    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content,
        });

        if (newFiles.length === uploadedFiles.length) {
          setFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const processAllFiles = useCallback(async () => {
    setIsProcessing(true);
    const updatedFiles = files.map(file => {
      const result = textUtils.process(file.content, [selectedOperation]);
      return {
        ...file,
        processedContent: result.text,
        stats: result.stats,
      };
    });
    
    setFiles(updatedFiles);
    setIsProcessing(false);
  }, [files, selectedOperation]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const downloadAll = useCallback(async () => {
    const zip = new JSZip();
    files.forEach(file => {
      if (file.processedContent) {
        zip.file(`cleaned_${file.name}`, file.processedContent);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'textcleaner_batch_results.zip');
  }, [files]);

  const operations = [
    { value: 'removeExtraSpaces', label: 'Remove Extra Spaces' },
    { value: 'removeEmptyLines', label: 'Remove Empty Lines' },
    { value: 'toLowerCase', label: 'To Lower Case' },
    { value: 'toUpperCase', label: 'To Upper Case' },
    { value: 'removeSpecialCharacters', label: 'Remove Special Characters' },
    { value: 'removeNumbers', label: 'Remove Numbers' },
    { value: 'removeDuplicates', label: 'Remove Duplicate Lines' },
  ];

  const totalStats = files.reduce((acc, file) => {
    if (file.stats) {
      acc.characters += file.stats.characters;
      acc.words += file.stats.words;
      acc.lines += file.stats.lines;
    }
    return acc;
  }, { characters: 0, words: 0, lines: 0 });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Batch Processing</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={downloadAll}
            disabled={files.length === 0 || !files.some(f => f.processedContent)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <FiDownload />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FiUpload className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Drag & drop files here or click to browse</p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            accept=".txt,.csv,.json,.log,.md,.html,.xml"
            className="hidden"
            id="batch-file-upload"
          />
          <label
            htmlFor="batch-file-upload"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
          >
            Select Files
          </label>
          <p className="text-sm text-gray-500 mt-2">Supports: TXT, CSV, JSON, LOG, MD, HTML, XML</p>
        </div>
      </div>

      {/* Processing Controls */}
      {files.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Operation
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
              >
                {operations.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 h-fit mt-6"
            >
              {isProcessing ? 'Processing...' : 'Process All Files'}
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">
              Files ({files.length})
            </h4>
            <div className="text-sm text-gray-600">
              Total: {totalStats.words} words, {totalStats.characters} chars
            </div>
          </div>

          {files.map((file) => (
            <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiFileText className="text-gray-400" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {file.stats ? (
                        <>
                          {file.stats.words} words ? {file.stats.characters} chars ? {file.stats.lines} lines
                        </>
                      ) : (
                        'Not processed yet'
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.processedContent && (
                    <button
                      onClick={() => {
                        const blob = new Blob([file.processedContent!], { type: 'text/plain' });
                        saveAs(blob, `cleaned_${file.name}`);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{files.length}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {files.filter(f => f.processedContent).length}
              </div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {totalStats.characters.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Characters</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;