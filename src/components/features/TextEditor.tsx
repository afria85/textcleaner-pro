import React from 'react';
import { FiCopy, FiTrash2, FiUpload } from 'react-icons/fi';

interface TextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  readOnly?: boolean;
  showStats?: boolean;
  onClear?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  className?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  label = 'Text Editor',
  readOnly = false,
  showStats = true,
  onClear,
  onCopy,
  onPaste,
  className = '',
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onChange?.(text);
    };
    reader.readAsText(file);
  };

  const stats = {
    characters: value.length,
    words: value.trim() === '' ? 0 : value.trim().split(/\s+/).length,
    lines: value === '' ? 0 : value.split('\n').length,
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        <div className="flex space-x-2">
          {!readOnly && onPaste && (
            <button
              onClick={onPaste}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <FiUpload className="text-sm" />
              <span>Paste</span>
            </button>
          )}
          
          {onCopy && value && (
            <button
              onClick={onCopy}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <FiCopy className="text-sm" />
              <span>Copy</span>
            </button>
          )}
          
          {onClear && value && (
            <button
              onClick={onClear}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <FiTrash2 className="text-sm" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <textarea
        className={`w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm ${
          readOnly 
            ? 'bg-gray-50 border-gray-300 text-gray-700' 
            : 'border-gray-300 focus:border-transparent'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        spellCheck="false"
        autoComplete="off"
      />

      {!readOnly && (
        <div className="mt-3 flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
            <FiUpload />
            <span>Upload File</span>
            <input
              type="file"
              accept=".txt,.csv,.json,.md,.html,.xml"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <span className="text-sm text-gray-400">Supports: .txt, .csv, .json, .md</span>
        </div>
      )}

      {showStats && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-600">Characters</div>
              <div className="font-bold text-gray-900">{stats.characters}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-600">Words</div>
              <div className="font-bold text-gray-900">{stats.words}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-gray-600">Lines</div>
              <div className="font-bold text-gray-900">{stats.lines}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;