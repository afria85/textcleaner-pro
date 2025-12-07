import React from 'react';
import { FiGrid, FiFileText, FiDatabase, FiCode, FiSettings, FiUsers } from 'react-icons/fi';
import { TbFileSpreadsheet, TbJson } from 'react-icons/tb';
import { SiMarkdown } from 'react-icons/si';

const Sidebar = () => {
  const menuItems = [
    { icon: <FiGrid />, label: 'Dashboard', active: true },
    { icon: <FiFileText />, label: 'Text Cleaner' },
    { icon: <TbFileSpreadsheet />, label: 'CSV Processor' },
    { icon: <TbJson />, label: 'JSON Formatter' },
    { icon: <SiMarkdown />, label: 'Markdown' },
    { icon: <FiDatabase />, label: 'SQL Formatter' },
    { icon: <FiCode />, label: 'Code Formatter' },
  ];

  const toolsItems = [
    { icon: <FiUsers />, label: 'Batch Process' },
    { icon: <FiSettings />, label: 'Regex Tool' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Main Menu</h2>
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tools</h2>
        <nav className="space-y-2">
          {toolsItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Pro Tip</h3>
        <p className="text-sm text-blue-700">
          Use <code className="bg-blue-100 px-1 rounded">Ctrl+Enter</code> to process text faster.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;