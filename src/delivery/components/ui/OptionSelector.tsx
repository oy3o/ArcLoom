import React from 'react';

export const OptionSelector: React.FC<{ label: string; options: readonly string[]; selectedValue: string; onSelect: (value: any) => void; }> = 
({ label, options, selectedValue, onSelect }) => (
    <div className="mb-6">
        <label className="block text-lg font-semibold text-purple-300 mb-2">{label}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {options.map(option => (
                <button key={option} onClick={() => onSelect(option)} className={`px-4 py-2 text-sm rounded-md transition-all border-2 ${selectedValue === option ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-purple-600'}`}>
                    {option}
                </button>
            ))}
        </div>
    </div>
);