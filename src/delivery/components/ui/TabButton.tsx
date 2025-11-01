import React from 'react';

interface TabButtonProps { label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }

export const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isActive ? 'bg-purple-800/40 text-purple-200' : 'text-gray-400 hover:bg-gray-700/50'}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
);
