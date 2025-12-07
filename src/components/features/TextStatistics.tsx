import React from 'react';
import { FiBarChart2, FiType, FiFileText, FiHash } from 'react-icons/fi';
import { textUtils, TextStats } from '../../utils/textProcessor';

interface TextStatisticsProps {
  text: string;
}

const TextStatistics: React.FC<TextStatisticsProps> = ({ text }) => {
  const stats = textUtils.getStats(text);

  const statItems = [
    { icon: <FiType />, label: 'Characters', value: stats.characters, color: 'blue' },
    { icon: <FiBarChart2 />, label: 'Words', value: stats.words, color: 'green' },
    { icon: <FiFileText />, label: 'Lines', value: stats.lines, color: 'purple' },
    { icon: <FiHash />, label: 'Spaces', value: stats.spaces, color: 'yellow' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center"
          >
            <div className={`text-2xl mb-2 text-${item.color}-500`}>
              {item.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Text length (with spaces):</span>
            <span className="font-medium">{stats.characters} chars</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Text length (without spaces):</span>
            <span className="font-medium">{stats.characters - stats.spaces} chars</span>
          </div>
          <div className="flex justify-between">
            <span>Paragraphs:</span>
            <span className="font-medium">{stats.paragraphs}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextStatistics;