import React from 'react';
import { FiSettings, FiUser, FiBell, FiSearch } from 'react-icons/fi';
import { SiReact } from 'react-icons/si';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SiReact className="text-blue-500 text-2xl" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">TextCleaner Pro</h1>
            <p className="text-sm text-gray-600">Professional Text Processing Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search features..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FiBell className="text-gray-600 text-xl" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FiSettings className="text-gray-600 text-xl" />
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
            <FiUser />
            <span>Login</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;